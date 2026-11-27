# 27/11/2026: skills para o projeto e correção nas regras de convite

Registro da conversa com o Claude Code (sessão na nuvem).

## O que foi pedido

1. Quais skills gratuitas do GitHub servem ao salvetheapp.
2. Colocar a do Firebase e a webapp-testing no repositório, abrir uma por uma, verificar e instalar as de confiança.
3. Depois, aplicar melhorias no app.
4. Guardar esta conversa junto com o projeto.

## Skills

Lidas por inteiro (instruções, referências e scripts). Instaladas em `.claude/skills/`, com origem, versão e
cuidados em `.claude/skills/ORIGEM.md`:

- Firebase (oficial do Google): firebase-firestore, firebase-auth-basics, firebase-security-rules-auditor,
  firestore-rules-creation, firebase-hosting-basics.
- Anthropic (oficial): webapp-testing.
- obra/superpowers: systematic-debugging, verification-before-completion.

Recusadas, com o motivo no ORIGEM.md: firebase-basics, musescore (hkuds/cli-anything), audio-to-midi
(maystudios) e mikuscore-skills (igapyon).

## Melhoria aplicada: regras de convite e membros (`firebase/firestore.rules`)

Auditoria feita com a skill `firebase-security-rules-auditor`.

**Falha encontrada:** um **editor** podia criar um link de convite com papel `dono`, sair da banda e voltar
por esse link como dono. A partir daí podia tirar o dono verdadeiro, apagar a banda e trocar o papel de todos.
Isso acontecia porque os convites não tinham nenhuma validação. Pelo mesmo caminho, também dava para gravar
campos estranhos na ficha de membro, e o dono podia mudar o nome e o e-mail de outra pessoa.

**Correção:**
- convite só pode ser `musico` ou `editor`, com os campos que o app grava (`role`, `bandName`, `createdAt`, `by`);
- entrar por convite só como `musico` ou `editor`, com o mesmo papel do link;
- ficha de membro só com `role`, `invite`, `name`, `email`, `joinedAt`, com tamanho limitado;
- o dono troca só o papel das pessoas.

O app só cria links de músico e de editor, então nada muda para quem usa.

**Teste:** `testes/regras_firestore.mjs`, no emulador. Regras novas: 13 de 13 passam. Regras antigas: 4 falham,
o que mostra que a falha existia.

**Publicado depois, na segunda rodada (ver abaixo).** Para valer no app, quem cuida do projeto precisa publicar as regras do jeito de sempre:
`ferramentas/rel.py` rodado de dentro de `firebase/`, com o token `.t` ao lado (ele publica `firestore.rules` e
`storage.rules`).

## Segunda rodada: validade dos convites, junção na main e publicação

Pedido: "faça os 3" (validade dos links, juntar a branch na main, publicar as regras).

**Links de convite valem 7 dias.** Antes, quem fosse removido da banda podia voltar com um link antigo.
- Regras: entrar por convite só se o link tiver menos de 7 dias. A data do link precisa ser a real (com até
  10 minutos de diferença de relógio), para ninguém criar um link com data no futuro que nunca venceria. O link
  também precisa estar no nome de quem o criou.
- App (`app-src/shim.js` → `app/fb.js`): quem abre um link vencido vê "Este convite venceu (vale 7 dias). Peça um
  link novo para quem te convidou." Quem já é da banda abre normalmente. O aviso de link copiado diz que vale 7 dias.
- O link não é apagado depois do uso, porque um mesmo link pode ser mandado no grupo da banda para várias pessoas.
- Testes: 18 de 18 passam no emulador (5 novos sobre a validade).

**Publicação (27/11/2026, 03:54 UTC).** Feita pela API do Firebase Rules, com uma chave temporária do
`gcloud auth print-access-token` (a chave do gcloud precisa do cabeçalho `x-goog-user-project: salvetheapp-3cceb`).
- Antes de publicar, as regras que estavam no ar foram comparadas com as do repositório. Havia uma mudança feita só
  no console (às 03:19 do mesmo dia): `fonte` também aceita `'partitura'`. Ela foi trazida para `firebase/firestore.rules`
  para não se perder.
- Testes de novo: 18 de 18 no emulador, e o teste do próprio Google aceitou as regras.
- Depois de publicar, as regras no ar foram baixadas e conferidas: são idênticas ao arquivo.
- Só `firestore.rules` foi publicado. `storage.rules` e o app (Hosting) não foram mexidos.
