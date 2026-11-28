# Testes

**Rápido (o de todo dia, segundos):** roda sempre, antes de cada pedido no GitHub e de cada publicação.
- `node testes/rapido.js`: abre o app daqui num navegador e confere botões, "Editar com o Caio" (com o servidor
  simulado), "Refazer o áudio" e erros de JavaScript. Não precisa de conta nem internet do Firebase.
- `node testes/daw.js`: Ferramentas › Seguir a DAW › os guias da DAW (cada DAW, Mac e Windows, o .txt) e da rede local (o .zip
  do modo local com programa, atalhos e dados). `FOTOS=pasta` salva os prints e os .txt.
- `node testes/laterais.js`: o menu à esquerda, as ferramentas à direita e a partitura no meio, no iPad e no celular
  (gavetas), e os avisos dos robôs com o botão Ensaio. `FOTOS=pasta` salva os prints.
- `node testes/convite.js`: "Link para músico/editor" copia a mensagem pronta (banda, quem convidou, link) e o código de acesso
  copia o convite para testar o app que salva músicos.
- `node testes/instalar.js`: no celular e no tablet (iPhone, iPad, Android) aparece "Instalar o app" com o passo a passo para pôr
  o ícone na tela de início; no computador e quando já abriu pelo ícone, não aparece. `FOTOS=pasta` salva os prints.
- `python3 testes/malak_base.py` (precisa do music21): a pauta da base sem nome na grade não vira trompete; os nomes param no 2º sistema.
- `python3 testes/malak_links.py`: o Malak abre os PDFs da turnê salvos como caminho do site ("scores/...").
- `python3 testes/malak_leitura.py` (precisa de pymupdf e music21): o Malak lê do PDF as pausas, notas agudas com linhas
  suplementares, semicolcheias, pontos, quiálteras e os PDFs do Finale; confere os compassos antes do áudio; e não gera
  de novo (nem gasta) quando nada mudou.
- `node --check server/functions/index.js`: o código do Caio não tem erro de escrita.
- `node testes/caio_servidor.js` (depois de `cd server/functions && npm ci`): o Caio lê a partitura com o mesmo código do app
  (tercinas, dinâmicas, ligaduras), acha compassos com tempo errado, vê os avisos do Malak e tem a proposta testada antes de chegar ao usuário.
- Publicação: `python3 ferramentas/deploy.py` confere as partituras e áudios só confirmando que existem (~3 s).

**Completo (FULL, só quando pedirem "teste full"):** pesado e com calma.
- Conta de teste temporária (`visual_conta.py create` / `remove`) e os testes de ponta a ponta: `visual.js`,
  `visual2.js`, `caio.js` (Caio de verdade), `robo.js` (Malak de verdade), `correcao.js`, `equipe.js`, `treino.js`,
  `senha.js`, `codigo.js`.
- Regras do banco no emulador: `regras_firestore.mjs`.
- Comparações de qualidade: `compara.py`, `vet_cmp.py`, `base_cmp.py`, `avaliar_arr.py`, `arranjo_e2e.py`.
- Publicação com `FULL=1 python3 ferramentas/deploy.py` (baixa cada áudio inteiro depois de publicar).
