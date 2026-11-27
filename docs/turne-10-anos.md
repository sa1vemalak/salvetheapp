# De onde o app veio: a Turnê 10 Anos

O salvetheapp nasceu como ferramenta de uma turnê ("Poesia Acústica – Turnê 10 Anos": trompete Bb, sax tenor,
trombone e base) e virou um app para qualquer banda. O foco agora é só o salvetheapp; o que veio da turnê fica
guardado para aprendizado.

## Onde está cada coisa da turnê

| O quê | Onde |
|---|---|
| Projeto original no Google | Firebase `pnpl10y` (banco `pnpl-10y`). **Não apagar**: guarda os dados originais. |
| Site antigo `pnpl10y.web.app` | **Desligado em 27/11/2026** (não apagado). Para religar, publicar de novo uma versão antiga dele no Firebase Hosting. |
| Partituras e áudios da turnê (`scores/`, `_blob/`, 235 arquivos) | No ar em `salvetheapp-3cceb.web.app`, idênticos aos do site antigo (conferido arquivo por arquivo antes de desligar). |
| Dados do banco da turnê | Copiados para o `salvetheapp-3cceb` com `ferramentas/copydb.py`. |
| Padrão de diagramação dos metais | `diagramacao/` (`estilo_turne/`, MuseScore) |
| Testes do Mestrinho com as músicas da turnê | `server/mestrinho/testes-separador/RESULTADO.md`, `testes/` |
| Regras dos arranjadores da turnê | coleção de regras da IA arranjadora (página Equipe do app) |

O endereço `salvetheapp.web.app` também mora no projeto `pnpl10y`, mas é o app (fala com o banco do
`salvetheapp-3cceb`), não a turnê. Publicar nele: `SITE=salvetheapp python3 ferramentas/deploy.py`.
