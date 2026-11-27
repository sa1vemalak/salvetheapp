# temporary test account in the app team (create | remove); never touches real users
import json, sys, time, urllib.request, subprocess
P = 'salvetheapp-3cceb'; KEY = 'AIzaSyDItCDsH2QN_DCVHfnK27qkQTVu0WJcf90'
T = subprocess.check_output(['python3', '-I', 'fbtools/tok.py']).decode().strip()
H = {'Authorization': 'Bearer ' + T, 'X-Goog-User-Project': P, 'Content-Type': 'application/json'}
B = f'https://firestore.googleapis.com/v1/projects/{P}/databases/(default)/documents'
def call(url, body=None, method='POST', h=H):
    r = urllib.request.Request(url, json.dumps(body).encode() if body is not None else None, method=method, headers=h)
    try: return json.load(urllib.request.urlopen(r))
    except urllib.error.HTTPError as e: return {'err': e.code, 'body': e.read().decode()[:200]}
def test_accounts():
    us = call(f'https://identitytoolkit.googleapis.com/v1/projects/{P}/accounts:query', {'returnUserInfo': True, 'limit': '500'}).get('userInfo', [])
    return [u for u in us if (u.get('email') or '').startswith('zz-equipe-') and u['email'].endswith('@example.com')]
if sys.argv[1] == 'create':
    mail = f'zz-equipe-{int(time.time())}@example.com'
    r = call(f'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={KEY}', {'email': mail, 'password': 'teste12345', 'returnSecureToken': True}, h={'Content-Type': 'application/json', 'Referer': 'https://salvetheapp.web.app/'})
    uid = r['localId']
    call(f'{B}/equipe/{uid}', {'fields': {'nome': {'stringValue': 'Teste automático'}, 'papel': {'stringValue': 'teste'}}}, 'PATCH')
    print(mail)
else:  # remove every zz-equipe test account, its team doc, and what it wrote
    for u in test_accounts():
        uid = u['localId']
        call(f'{B}/equipe/{uid}', method='DELETE')
        for col in ('sugestoes', 'treino/regras/licoes'):
            q = call(f'{B}:runQuery', {'structuredQuery': {'from': [{'collectionId': col.split('/')[-1]}], 'where': {'fieldFilter': {'field': {'fieldPath': 'uid'}, 'op': 'EQUAL', 'value': {'stringValue': uid}}}}} if col == 'sugestoes' else None)
        for path in ('sugestoes', 'treino/regras/licoes'):
            docs = call(f'{B}/{path}?pageSize=300', method='GET').get('documents', [])
            for d in docs:
                if d['fields'].get('uid', {}).get('stringValue') == uid:
                    call('https://firestore.googleapis.com/v1/' + d['name'], method='DELETE'); print('apagado', d['name'].split('documents/')[1])
        call(f'https://identitytoolkit.googleapis.com/v1/projects/{P}/accounts:delete', {'localId': uid})
        print('conta removida', u['email'])
    for x in ('0', 'zz-teste-equipe'):
        call(f'{B}/equipe/{x}', method='DELETE')
