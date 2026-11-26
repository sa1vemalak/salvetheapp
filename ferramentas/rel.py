import json,urllib.request,os,sys
T=open('.t').read().strip(); P='salvetheapp-3cceb'
def req(url,body,method='POST'):
    r=urllib.request.Request(url,json.dumps(body).encode(),method=method,headers={'Authorization':'Bearer '+T,'Content-Type':'application/json','X-Goog-User-Project':P})
    try: return json.load(urllib.request.urlopen(r))
    except urllib.error.HTTPError as e: return {'err':e.code,'body':e.read().decode()[:600]}
for fn,rel in [('firestore.rules','cloud.firestore'),('storage.rules','firebase.storage/salvetheapp-3cceb.firebasestorage.app')]:
    rs=req(f'https://firebaserules.googleapis.com/v1/projects/{P}/rulesets',{'source':{'files':[{'name':fn,'content':open(fn).read()}]}})
    if 'name' not in rs: print(fn,rs); continue
    name=f'projects/{P}/releases/{rel}'
    r=req(f'https://firebaserules.googleapis.com/v1/projects/{P}/releases',{'name':name,'rulesetName':rs['name']})
    if 'err' in r: r=req(f'https://firebaserules.googleapis.com/v1/{name}',{'release':{'name':name,'rulesetName':rs['name']}},'PATCH')
    print(fn,'->',r.get('name',r))
