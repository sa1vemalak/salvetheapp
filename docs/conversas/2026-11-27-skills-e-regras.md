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

**App publicado (27/11/2026, 04:02 UTC), nos dois sites: `salvetheapp-3cceb` e `pnpl10y`.**
- O app no ar estava mais novo que o repositório: às 03:40 alguém publicou o editor de partitura (`editor.js`,
  `partitura.js` e mudanças no `index.html`) sem salvar no repositório. Publicar a pasta `app/` apagaria o editor.
- Por isso a publicação partiu do que estava no ar e trocou só 5 arquivos: `fb.js` (convite vence em 7 dias),
  `index.html` e `local/index.html` (aviso "vale 7 dias"), `version.json` e `local/manifest.json`. Os outros 249
  (editor, partituras, modo local) ficaram como estavam.
- Conferido depois: a página abre sem erros, o aviso de convite vencido está no ar, e editor, partituras e modo
  local continuam respondendo.
- **Atenção:** o editor de partitura ainda não está no repositório. Quem o fez precisa salvar o código-fonte, senão
  a próxima publicação feita a partir do repositório o apaga.

**Editor de partitura salvo no repositório (mesmo dia).** `app/editor.js`, `app/partitura.js` e `app/index.html`
foram copiados do que está no ar (versão 20261127040225). O `index.html` do ar já continha tudo o que estava no
repositório e mais o editor; as linhas que parecem removidas na comparação são linhas estendidas (por exemplo,
`corrigir_notas` passou a aceitar também `cifras`).
- Ainda falta: o Caio no servidor (`server/functions/index.js`) do repositório só conhece `corrigir_notas`. Se o app
  no ar usa `cifras`, a versão publicada das funções também está mais nova que o repositório e precisa ser salva.

**Caio salvo no repositório (mesmo dia).** O código das funções foi baixado do Cloud Functions (só leitura). As três
funções (`agente` = Caio, `robo` = Malak, `treino`) saem do mesmo `index.js`; a mais nova é a `agente` (03:40), e o
`index.js` dela foi copiado para `server/functions/index.js`. Só estende o que havia: edição da partitura editável,
cifras, articulações e ligaduras em `ver_notas`, e ajuda para criar partitura em branco. `llm/`, `package.json` e
`package-lock.json` já eram iguais. Os backups `index.before-formula.js` e `index.before-cifras.js` que estavam
no pacote não foram trazidos.
- `robo` e `treino` no ar ainda rodam um `index.js` mais antigo (publicados às 23:33 e 01:03). Na próxima
  publicação das funções eles passam a usar este arquivo.

## Terceira rodada: script de publicação seguro

- `ferramentas/deploy.py` procurava `localmode/local.js`, mas a pasta é `modo-local/`: falhava num clone limpo.
- Pior: publicava só a pasta `app/`, e os sites guardam também as partituras e áudios das bandas (`scores/` e
  `_blob/`, 235 arquivos fora do repositório). Uma publicação feita do repositório apagaria esses arquivos.
- Agora o script: publica nos dois sites de uma vez (antes, `pnpl10y` ficou na versão das 04:14, sem o aviso de
  convite vencido); copia `scores/` e `_blob/` da versão no ar; recusa se houver mudança não salva em `app/`; baixa o
  código no ar e recusa se algum arquivo não existir em nenhuma versão salva do repositório (o caso do editor e do
  Caio publicados sem salvar); grava o commit em `version.json`; não altera arquivos do repositório; confere
  depois de publicar. `DRY=1` só confere (passou nos dois sites).
- Não publicado nesta rodada: a credencial do Google desta sessão foi recusada (401) pelo Hosting, Rules e Functions.

## Quarta rodada: publicação do pnpl10y

- Senhas temporárias do Google (valem 1 hora) estavam vencidas; o usuário gerou uma nova no Cloud Shell.
- Primeira tentativa: o filtro `include` do `versions:clone` devolveu uma cópia **vazia**, e o pnpl10y ficou uns
  2 minutos sem as partituras e áudios das bandas. Voltei para a versão anterior (`c7aa13ebe3900206`) e conferi os
  235 arquivos.
- Conserto no `deploy.py`: copia a versão inteira (testado: 256 arquivos; `populateFiles` só acrescenta/troca),
  confere os dados das bandas **antes** de pôr no ar, e se depois de publicar faltar algum, volta sozinho para a
  versão anterior.
- Segunda tentativa: pnpl10y publicado (20261127131533, commit 8479158), com o aviso de convite vencido e os 235
  arquivos das bandas. O salvetheapp-3cceb já estava com o mesmo código e não foi republicado.

## Quinta rodada: pnpl10y desligado, foco no salvetheapp

- Pedido: excluir o pnpl10y; foco total no salvetheapp; manter o que veio da turnê para aprendizado.
- `pnpl10y` é um projeto separado (o da turnê), com banco próprio e dois sites (`pnpl10y.web.app` e
  `salvetheapp.web.app`). Apagar o projeto apagaria os dados da turnê, então só o site `pnpl10y.web.app` foi
  **desligado** (SITE_DISABLE; dá para religar). Antes, os 235 arquivos das bandas foram conferidos: idênticos no
  `salvetheapp-3cceb`.
- Código: `deploy.py` publica só no `salvetheapp-3cceb` por padrão; `pnpl10y.web.app` saiu da lista de endereços
  aceitos pelo Caio e do texto do modo local. Registro da turnê: `docs/turne-10-anos.md`.
- `salvetheapp.web.app` (site do projeto `pnpl10y` que roda o app) mantido e atualizado (20261127132358): aviso de
  convite vencido, metrônomo/bateria novos, 235 arquivos das bandas, página abre sem erros. O `deploy.py` agora
  publica nos dois endereços oficiais juntos: `salvetheapp-3cceb` e `salvetheapp`.
