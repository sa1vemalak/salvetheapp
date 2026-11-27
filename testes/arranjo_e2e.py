# test band only: a song with just the recording, then the arrangement job (as the app does)
import json, urllib.request, urllib.parse, uuid, time
T = open('fbtools/.t').read().strip(); P = 'salvetheapp-3cceb'; BK = f'{P}.firebasestorage.app'
H = {'Authorization': 'Bearer ' + T, 'X-Goog-User-Project': P}
B = f'https://firestore.googleapis.com/v1/projects/{P}/databases/(default)/documents'
def v(x):
    if isinstance(x, bool): return {'booleanValue': x}
    if isinstance(x, int): return {'integerValue': str(x)}
    if isinstance(x, str): return {'stringValue': x}
    if isinstance(x, list): return {'arrayValue': {'values': [v(y) for y in x]}}
    if isinstance(x, dict): return {'mapValue': {'fields': {k: v(y) for k, y in x.items()}}}
def put(path, fields):
    urllib.request.urlopen(urllib.request.Request(f'{B}/{path}', json.dumps({'fields': {k: v(x) for k, x in fields.items()}}).encode(), method='PATCH', headers={**H, 'Content-Type': 'application/json'}))
band = 'zz-malak-capri'; song = 'capricorniana-so-audio'; tok = str(uuid.uuid4()); obj = f'bands/{band}/arquivos/capricorniana-gravacao.mp3'
data = open('/root/.claude/uploads/7639134b-da79-503b-9d91-2316ae46b5a7/a0cf72ce-capricorniana_correto.mp3', 'rb').read()
meta = json.dumps({'name': obj, 'contentType': 'audio/mpeg', 'metadata': {'firebaseStorageDownloadTokens': tok}}).encode()
body = b'--xx\r\nContent-Type: application/json\r\n\r\n' + meta + b'\r\n--xx\r\nContent-Type: audio/mpeg\r\n\r\n' + data + b'\r\n--xx--\r\n'
urllib.request.urlopen(urllib.request.Request(f'https://storage.googleapis.com/upload/storage/v1/b/{BK}/o?uploadType=multipart', body, headers={**H, 'Content-Type': 'multipart/related; boundary=xx'}))
src = f'https://firebasestorage.googleapis.com/v0/b/{BK}/o/{urllib.parse.quote(obj, safe="")}?alt=media&token={tok}'
put(f'bands/{band}/songs/{song}', {'title': 'Capricorniana (só áudio)', 'tag': '', 'notes': '', 'parts': [], 'fontes': [], 'guia': {'name': 'capricorniana.mp3', 'src': src, 'at': int(time.time() * 1000)}})
job = f'bands/{band}/jobs/{song}__{int(time.time() * 1000)}'
put(job, {'song': song, 'tipo': 'arranjo', 'fonte': 'audio', 'status': 'pendente', 'criadoEm': int(time.time() * 1000), 'uid': 'QFXbpZaSkofA5OQY4VdM2IuMlDd2'})
print(job)
