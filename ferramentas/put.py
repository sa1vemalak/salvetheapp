import json,glob,os,re,urllib.request,sys
T=open(os.path.dirname(__file__)+'/.t').read().strip()
BASE='https://firestore.googleapis.com/v1/projects/salvetheapp-3cceb/databases/(default)/documents'
def enc(v):
    return [ {'__a':enc(x)} if isinstance(x,list) else enc(x) for x in v] if isinstance(v,list) else ({k:enc(x) for k,x in v.items()} if isinstance(v,dict) else v)
def val(v):
    if v is None: return {'nullValue':None}
    if isinstance(v,bool): return {'booleanValue':v}
    if isinstance(v,int): return {'integerValue':str(v)}
    if isinstance(v,float): return {'doubleValue':v}
    if isinstance(v,str): return {'stringValue':v}
    if isinstance(v,list): return {'arrayValue':{'values':[val(x) for x in v]}}
    return {'mapValue':{'fields':{k:val(x) for k,x in v.items()}}}
def put(path,doc):
    body=json.dumps({'fields':{k:val(x) for k,x in enc(doc).items()}}).encode()
    r=urllib.request.Request(f'{BASE}/{path}',body,method='PATCH',headers={'Authorization':'Bearer '+T,'Content-Type':'application/json'})
    try: urllib.request.urlopen(r).read(); return True
    except urllib.error.HTTPError as e: print(path,e.code,e.read()[:300]); return False
root=sys.argv[1]
n=0
for f in sorted(glob.glob(root+'/*/*.json')):
    col=f.split('/')[-2]; id=os.path.basename(f)[:-5]
    d=json.load(open(f))
    if col=='songs':
        for k,u in d['player']['mixes'].items():
            if re.fullmatch(r'/_blob/[0-9a-f]{32}',u): d['player']['mixes'][k]=u+'.mp4'
    n+=put(f'{col}/{id}',d)
print('ok',n)
