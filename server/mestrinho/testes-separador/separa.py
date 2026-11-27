# test (Cloud Run job, Mestrinho image): free wind/brass separators vs the Demucs "other" stem, on the Capricorniana
import subprocess, sys, os, json, glob, shutil
subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'audio-separator[cpu]'], check=False)
from google.cloud import storage
cli = storage.Client()
acervo = cli.bucket('salvetheapp-3cceb-acervo'); app = cli.bucket('salvetheapp-3cceb.firebasestorage.app')
os.makedirs('/w/in', exist_ok=True); os.makedirs('/w/out', exist_ok=True)
app.blob('bands/zz-malak-capri/arquivos/capricorniana-gravacao.mp3').download_to_filename('/w/in/mix.mp3')
acervo.blob('mestrinho-testes/out/stems/other.wav').download_to_filename('/w/in/demucs_other.wav')
from audio_separator.separator import Separator
cands = {'demucs_other': '/w/in/demucs_other.wav'}
MODELS = [m for m in os.environ.get('MODELOS', '17_HP-Wind_Inst-UVR.pth').split(',') if m]
for model in MODELS:
    for src_name, src in (('mix', '/w/in/mix.mp3'), ('demucs_other', '/w/in/demucs_other.wav')):
        try:
            out = f'/w/out/{model.split(".")[0]}__{src_name}'; os.makedirs(out, exist_ok=True)
            sep = Separator(output_dir=out, output_format='WAV')
            sep.load_model(model_filename=model)
            files = sep.separate(src)
            print(model, src_name, '->', files, flush=True)
            for f in files:
                p = f if os.path.isabs(f) else os.path.join(out, f)
                low = os.path.basename(p).lower()
                # the wind stem ("(Woodwinds)", "(Wind)", "(Brass)"), never the "(No Woodwinds)" rest
                if any(w in low for w in ('(woodwind', '(wind', '(brass')) and '(no ' not in low:
                    cands[f'{model.split(".")[0]}__{src_name}'] = p
        except Exception as e:
            print('FALHOU', model, src_name, e, flush=True)
print('candidatos:', cands, flush=True)
# notes heard in each candidate stem (same settings the Mestrinho uses for the horn stem)
from basic_pitch.inference import predict
from basic_pitch import ICASSP_2022_MODEL_PATH
import pathlib
onnx = pathlib.Path(ICASSP_2022_MODEL_PATH).parent / 'nmp.onnx'
MODEL = str(onnx) if onnx.exists() else ICASSP_2022_MODEL_PATH
res = {}
for k, f in cands.items():
    _, _, ev = predict(f, MODEL, onset_threshold=0.45, frame_threshold=0.3, minimum_note_length=70,
                       minimum_frequency=100, maximum_frequency=2000, multiple_pitch_bends=False, melodia_trick=True)
    res[k] = sorted([[round(float(s), 3), round(float(e), 3), int(p), round(float(a), 3)] for s, e, p, a, *_ in ev])
    print(k, len(res[k]), 'notas', flush=True)
json.dump(res, open('/w/notas_candidatos.json', 'w'))
acervo.blob('separador-teste/notas_candidatos.json').upload_from_filename('/w/notas_candidatos.json')
for k, f in cands.items():
    if k != 'demucs_other':
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f, '-b:a', '192k', f'/w/{k}.mp3'])
        acervo.blob(f'separador-teste/{k}.mp3').upload_from_filename(f'/w/{k}.mp3')
print('enviado', flush=True)
