# Skills de terceiros

Cópias sem alterações, lidas por inteiro antes de entrar aqui (SKILL.md, referências e scripts).
Para atualizar, copie de novo da origem e leia a diferença antes de aceitar.

| Skill | Origem | Versão (commit) | Licença |
|---|---|---|---|
| firebase-firestore | github.com/firebase/agent-skills | 99954a3 (2026-11-09) | Apache-2.0 |
| firebase-auth-basics | github.com/firebase/agent-skills | 99954a3 | Apache-2.0 |
| firebase-security-rules-auditor | github.com/firebase/agent-skills | 99954a3 | Apache-2.0 |
| firestore-rules-creation | github.com/firebase/agent-skills | 99954a3 | Apache-2.0 |
| firebase-hosting-basics | github.com/firebase/agent-skills | 99954a3 | Apache-2.0 |
| webapp-testing | github.com/anthropics/skills | e4bb5d9 (2026-11-16) | Apache-2.0 |
| systematic-debugging | github.com/obra/superpowers | 22f0b46 (2026-11-03) | MIT |
| verification-before-completion | github.com/obra/superpowers | 22f0b46 | MIT |

## Cuidados

- As skills do Firebase mandam fazer deploy (`deploy --only firestore:rules`, `--only auth`) depois de mudar
  regras ou login. Deploy muda o app publicado: só com a aprovação de quem cuida do projeto (`salvetheapp-3cceb`).
- `firestore-rules-creation` cita um subagente `firestore-rules-author`. Ele não foi copiado (foi escrito para
  outra ferramenta). Sem ele, a própria skill manda seguir o passo a passo dela, que é o esperado.
- `systematic-debugging` cita `superpowers:test-driven-development`, que não está aqui. Ela funciona sem.

- `webapp-testing` ensina Playwright em Python; os testes do projeto (`testes/*.js`) usam o de Node, que é o que
  está instalado nas sessões na nuvem. O script `scripts/with_server.py` funciona com qualquer um.
  Nas sessões na nuvem, use um servidor em Node para servir `app/` (o `python3 -m http.server` iniciado pelo
  script travou), e não confie só no "Server ready": ali a porta local aceita conexão antes de o servidor responder.

## Ficaram de fora, de propósito

- `firebase-basics`: obriga a IA a fazer login no Firebase e instalar outros plugins antes de qualquer tarefa.
  Atrapalha nas sessões na nuvem, e o projeto já está configurado.
- Analytics, Crashlytics, Remote Config, Data Connect, App Hosting, AI Logic, Xcode: o app não usa.
- `musescore` (hkuds/cli-anything): o código é limpo, mas depende de instalar um programa à parte, e
  `diagramacao/diagramar.py` já chama o MuseScore com o estilo da turnê.
- `audio-to-midi` (maystudios/claude-skills): instala pacotes sozinho, sem fixar versão, e baixa um modelo de
  165 MB. Faz o que o Mestrinho já faz (Demucs + Basic Pitch).
- `mikuscore-skills` (igapyon): 28 MB de código embutido para revisar, e é focada em ABC, não no fluxo
  MusicXML + MuseScore do projeto.
