import json,urllib.request,os,sys,time
T=open(os.path.dirname(os.path.abspath(__file__))+'/.t').read().strip()
SRC='projects/pnpl10y/databases/pnpl-10y/documents'
DST='projects/salvetheapp-3cceb/databases/(default)/documents'
API='https://firestore.googleapis.com/v1/'
def req(url,body=None,proj=None):
    h={'Authorization':'Bearer '+T,'Content-Type':'application/json'}
    if proj: h['X-Goog-User-Project']=proj
    r=urllib.request.Request(url,json.dumps(body).encode() if body is not None else None,method='POST' if body is not None else 'GET',headers=h)
    return json.load(urllib.request.urlopen(r))
def colls(parent):
    return req(API+parent+':listCollectionIds',{'pageSize':1000}).get('collectionIds',[])
def docs(parent,c):
    out=[];tok=''
    while True:
        j=req(API+f'{parent}/{c}?pageSize=300&showMissing=true'+(f'&pageToken={tok}' if tok else ''))
        out+=j.get('documents',[]); tok=j.get('nextPageToken')
        if not tok: return out
allDocs=[]
def walk(parent):
    for c in colls(parent):
        for d in docs(parent,c):
            if 'fields' in d or 'createTime' in d: allDocs.append(d)
            walk(d['name'])
walk(SRC)
json.dump(allDocs,open('../fb/backup-pnpl10y-firestore.json','w'))
print('read',len(allDocs),'docs')
writes=[{'update':{'name':d['name'].replace(SRC,DST),'fields':d.get('fields',{})}} for d in allDocs if 'createTime' in d]
for i in range(0,len(writes),200):
    r=req(API+'projects/salvetheapp-3cceb/databases/(default)/documents:batchWrite',{'writes':writes[i:i+200]},proj='salvetheapp-3cceb')
    bad=[s for s in r.get('status',[]) if s.get('code')]
    if bad: print('errors',bad[:3])
print('wrote',len(writes))
from collections import Counter
print(Counter(d['name'].split('/documents/')[1].split('/')[0] for d in allDocs))
