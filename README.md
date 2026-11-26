# salvetheapp

App para bandas: partituras de cada músico, player, anotações do ensaio, sincronia com a DAW e o assistente Caio.

| Pasta | O que é |
|---|---|
| `app/` | o app publicado no Firebase Hosting (`index.html`; o `fb.js` é gerado de `app-src/`) |
| `app-src/shim.js` | login, bandas, shows, convites, códigos de acesso e envio de arquivos (Firebase). Gera `app/fb.js`: `npx esbuild shim.js --bundle --minify --format=iife --target=es2019 --outfile=../app/fb.js` |
| `server/` | Cloud Functions: `agente` (Caio) e o barramento de LLMs (`functions/llm/`). Deploy: `firebase deploy --only functions` |
| `firebase/` | regras de segurança do Firestore e do Storage |
| `diagramacao/` | diagramação no padrão da turnê (MuseScore + estilos) e geração de áudio |
| `modo-local/` | programa para usar o app sem internet (rede local) |
| `ferramentas/` | scripts de deploy e manutenção |

Projeto Firebase: `salvetheapp-3cceb`. A chave da Anthropic fica no Secret Manager (`ANTHROPIC_API_KEY`), nunca no código.
As partituras e áudios das bandas não ficam neste repositório.
