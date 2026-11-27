# temporary test account as editor of the TEST band zz-malak-capri only (create | remove)
import json, sys, time, urllib.request, subprocess
P = 'salvetheapp-3cceb'; KEY = 'AIzaSyDItCDsH2QN_DCVHfnK27qkQTVu0WJcf90'; BAND = 'zz-malak-capri'
T = subprocess.check_output(['python3', '-I', 'fbtools/tok.py']).decode().strip()
H = {'Authorization': 'Bearer ' + T, 'X-Goog-User-Project': P, 'Content-Type': 'application/json'}
B = f'https://firestore.googleapis.com/v1/projects/{P}/databases/(default)/documents'
def call(url, body=None, method='POST', h=H):
    r = urllib.request.Request(url, json.dumps(body).encode() if body is not None else None, method=method, headers=h)
    try: return json.load(urllib.request.urlopen(r))
    except urllib.error.HTTPError as e: return {'err': e.code, 'body': e.read().decode()[:200]}
if sys.argv[1] == 'create':
    mail = f'zz-visual-{int(time.time())}@example.com'
    r = call(f'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={KEY}', {'email': mail, 'password': 'teste12345', 'displayName': 'Músico Teste', 'returnSecureToken': True}, h={'Content-Type': 'application/json', 'Referer': 'https://salvetheapp.web.app/'})
    uid = r['localId']
    call(f'{B}/bands/{BAND}/members/{uid}', {'fields': {'role': {'stringValue': 'editor'}, 'name': {'stringValue': 'Músico Teste'}, 'email': {'stringValue': mail}, 'joinedAt': {'integerValue': str(int(time.time() * 1000))}}}, 'PATCH')
    call(f'{B}/users/{uid}', {'fields': {'bands': {'mapValue': {'fields': {BAND: {'mapValue': {'fields': {'name': {'stringValue': 'ZZ Robô Teste'}, 'role': {'stringValue': 'editor'}}}}}}}}}, 'PATCH')
    print(mail)
else:
    us = call(f'https://identitytoolkit.googleapis.com/v1/projects/{P}/accounts:query', {'returnUserInfo': True, 'limit': '500'}).get('userInfo', [])
    for u in us:
        if (u.get('email') or '').startswith('zz-visual-') and u['email'].endswith('@example.com'):
            uid = u['localId']
            for path in (f'bands/{BAND}/members/{uid}', f'users/{uid}'):
                call(f'{B}/{path}', method='DELETE')
            call(f'https://identitytoolkit.googleapis.com/v1/projects/{P}/accounts:delete', {'localId': uid}); print('removida', u['email'])
