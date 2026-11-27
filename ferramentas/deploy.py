import json,os,gzip,hashlib,urllib.request,sys
from concurrent.futures import ThreadPoolExecutor
T=open(os.path.dirname(__file__)+'/.t').read().strip()
H={'Authorization':'Bearer '+T,'Content-Type':'application/json','X-Goog-User-Project':'salvetheapp-3cceb'}
API='https://firebasehosting.googleapis.com/v1beta1'
SITE='sites/'+os.environ.get('SITE','pnpl10y')
def call(url,body=None,method='POST'):
    r=urllib.request.Request(url,json.dumps(body).encode() if body is not None else None,method=method,headers=H)
    return json.load(urllib.request.urlopen(r))
root=sys.argv[1]
import re,time
ver=time.strftime('%Y%m%d%H%M%S')
ip=os.path.join(root,'index.html'); h=open(ip).read()
h=re.sub(r"window\.APP_VERSION = '[^']*';", "window.APP_VERSION = '"+ver+"';", h); open(ip,'w').write(h)
json.dump({'v':ver},open(os.path.join(root,'version.json'),'w'))
# local mode: the page that talks to the Mac's program, and the list of files the Mac downloads
import hashlib,shutil
os.makedirs(os.path.join(root,'local'),exist_ok=True)
lh=h.replace('<script src="fb.js"></script>','<script src="local.js"></script>')
lh=re.sub(r"window\.APP_VERSION = '[^']*';","window.APP_VERSION = 'dev';",lh)
open(os.path.join(root,'local','index.html'),'w').write(lh)
shutil.copyfile(os.path.join(os.path.dirname(__file__),'..','localmode','local.js'),os.path.join(root,'local','local.js'))
man=[]
for dp,_,fs_ in os.walk(root):
    for f in fs_:
        full=os.path.join(dp,f); rel=os.path.relpath(full,root).replace(os.sep,'/')
        if rel in ('index.html','fb.js','version.json','local/manifest.json') or rel.startswith('.'): continue
        to={'local/index.html':'index.html','local/local.js':'local.js'}.get(rel)
        b=open(full,'rb').read()
        e={'path':rel,'size':len(b),'md5':hashlib.md5(b).hexdigest()}
        if to: e['to']=to
        man.append(e)
json.dump({'version':ver,'files':sorted(man,key=lambda x:x['path'])},open(os.path.join(root,'local','manifest.json'),'w'))
print('local files',len(man))
if os.environ.get('DRY'): sys.exit(0)
print('version',ver)
files={}
for dp,_,fs in os.walk(root):
    for f in fs:
        p=os.path.join(dp,f); rel='/'+os.path.relpath(p,root)
        if rel.endswith('.bak') or '/.' in rel: continue
        z=gzip.compress(open(p,'rb').read(),compresslevel=6 if not rel.endswith('.mp4') else 1,mtime=0)
        files[rel]=(hashlib.sha256(z).hexdigest(),z)
print('files',len(files))
cfg={'headers':[
  {'glob':'/_blob/**','headers':{'Cache-Control':'public, max-age=31536000, immutable'}},
  {'glob':'**/*.@(html|js|json|webmanifest)','headers':{'Cache-Control':'no-cache'}},
  {'regex':'^/$','headers':{'Cache-Control':'no-cache'}},
  {'glob':'/scores/**','headers':{'Cache-Control':'no-cache'}}],
  'cleanUrls':False}
v=call(f'{API}/{SITE}/versions',{'config':cfg})
name=v['name']; print(name)
pf=call(f'{API}/{name}:populateFiles',{'files':{k:h for k,(h,_) in files.items()}})
need=set(pf.get('uploadRequiredHashes',[])); up=pf['uploadUrl']
byh={h:z for h,z in files.values()}
print('upload',len(need))
def send(h):
    for i in range(4):
        try:
            r=urllib.request.Request(f'{up}/{h}',byh[h],method='POST',headers={'Authorization':'Bearer '+T,'Content-Type':'application/octet-stream','X-Goog-User-Project':'salvetheapp-3cceb'})
            urllib.request.urlopen(r,timeout=300).read(); return True
        except Exception as e: err=e
    print('fail',h,err); return False
with ThreadPoolExecutor(8) as ex: ok=sum(ex.map(send,need))
print('uploaded',ok)
if ok!=len(need): sys.exit(1)
call(f'{API}/{name}?update_mask=status',{'status':'FINALIZED'},'PATCH')
rel=call(f'{API}/{SITE}/releases?versionName={name}',{})
print('released',rel.get('name'))
