# salvetheapp

App para bandas: partituras de cada músico, player, anotações do ensaio, sincronia com a DAW e o assistente Caio.

| Pasta | O que é |
|---|---|
| `app/` | o app publicado no Firebase Hosting (`index.html`; o `fb.js` é gerado de `app-src/`) |
| `app-src/shim.js` | login, bandas, shows, convites, códigos de acesso e envio de arquivos (Firebase). Gera `app/fb.js`: `npx esbuild shim.js --bundle --minify --format=iife --target=es2019 --outfile=../app/fb.js` |
| `server/functions/` | Cloud Functions: `agente` (Caio, só música e o app), `robo` (dispara o Malak) e o barramento de LLMs (`llm/`). Deploy: `firebase deploy --only functions` |
| `server/malak/` | **Malak**, o robô: lê a partitura (PDF exportado de programa de partitura pelos símbolos exatos com `vetor.py`; PDF escaneado com Audiveris; ou MusicXML/MuseScore), gera o áudio de estudo (sopros com gravações reais de instrumentos via `hornsampler.py`, a parte de cifras vira piano e baixo como na primeira versão da turnê, outros instrumentos em General MIDI), o mapa de compassos e aplica correções de notas. Roda como Cloud Run Job `robo`. Imagem (os samples vêm de `gs://salvetheapp-3cceb-acervo/libs`): `gcloud builds submit --region=us-central1 --config=cloudbuild.yaml --substitutions=_IMAGE=southamerica-east1-docker.pkg.dev/salvetheapp-3cceb/robo/robo:vN .` |
| `server/mestrinho/` | **Mestrinho** (primeira versão): áudio → separação de instrumentos (Demucs), andamento e batidas, notas (Basic Pitch), cifras e rascunho em MusicXML. `avaliar.py` compara com a partitura oficial. `arranjador.py` é a **IA arranjadora**: monta o esqueleto do que o Mestrinho ouviu (cifra, notas na região dos metais, melodia, compasso por compasso), o Claude escreve trompete/sax/trombone com as regras dos arranjadores da banda, e sai MusicXML + eventos para o áudio. Roda como Cloud Run Job (`arranjador_job.py`) com a chave da Anthropic do Secret Manager. No app: "Só tenho a gravação" cria um pedido `tipo: arranjo`; a função `robo` liga o Cloud Run Job `mestrinho` (`job.py`, imagem do `Dockerfile`, até 5 por banda por dia), que escreve o arranjo, desenha a grade e as partes em PDF (MuseScore) e chama o Malak para o áudio de estudo. Os músicos dão nota de 1 a 5 em `songs/{id}/avaliacoes` |
| `server/acervo/` | download dos bancos de partituras abertos (PDMX, OpenScore, Mutopia, OpenEWLD, Choro Songbook, Slakh) e uma partitura por filtro do Musica Brasilis, com licença de cada uma |
| `firebase/` | regras de segurança do Firestore e do Storage |
| `testes/` | testes de ponta a ponta (Playwright) e comparação de notas |
| `diagramacao/` | diagramação no padrão da turnê (MuseScore + estilos) e geração de áudio |
| `modo-local/` | programa para usar o app sem internet (rede local) |
| `ferramentas/` | scripts de deploy e manutenção |

Projeto Firebase: `salvetheapp-3cceb`. A chave da Anthropic fica no Secret Manager (`ANTHROPIC_API_KEY`), nunca no código.
As partituras e áudios das bandas não ficam neste repositório.
