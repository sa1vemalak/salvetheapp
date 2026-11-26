import json,urllib.request,os,sys
T=open(os.path.dirname(os.path.abspath(__file__))+'/.t').read().strip()
def unv(v):
    k,x=next(iter(v.items()))
    if k=='mapValue': return {a:unv(b) for a,b in x.get('fields',{}).items()}
    if k=='arrayValue': return [unv(y) for y in x.get('values',[])]
    if k=='integerValue': return int(x)
    if k=='nullValue': return None
    return x
def dec(v):
    if isinstance(v,list): return [dec(x) for x in v]
    if isinstance(v,dict): return dec(v['__a']) if list(v)==['__a'] else {a:dec(b) for a,b in v.items()}
    return v
out,col=sys.argv[1],sys.argv[2]; os.makedirs(f'{out}/{col}',exist_ok=True)
tok=''
while True:
    r=json.load(urllib.request.urlopen(urllib.request.Request(f'https://firestore.googleapis.com/v1/projects/salvetheapp-3cceb/databases/(default)/documents/{col}?pageSize=300'+(f'&pageToken={tok}' if tok else ''),headers={'Authorization':'Bearer '+T})))
    for d in r.get('documents',[]):
        id=d['name'].split('/')[-1]; json.dump(dec({a:unv(b) for a,b in d.get('fields',{}).items()}),open(f'{out}/{col}/{id}.json','w'),ensure_ascii=False)
    tok=r.get('nextPageToken')
    if not tok: break
print(col,len(os.listdir(f'{out}/{col}')))
