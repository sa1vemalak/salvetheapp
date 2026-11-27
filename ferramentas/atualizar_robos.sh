#!/bin/bash
# Atualiza os robôs do salvetheapp com o código do repositório. Feito para rodar no Cloud Shell do Google
# (console.cloud.google.com, ícone >_), de dentro da pasta do repositório:
#     bash ferramentas/atualizar_robos.sh            # tudo: Caio e funções, Malak, Mestrinho
#     bash ferramentas/atualizar_robos.sh funcoes    # só uma parte: funcoes, malak ou mestrinho
# O Malak leva uns 15-30 minutos e o Mestrinho uns 30-60 (a montagem roda no Google; não feche a aba).
set -euo pipefail
P=salvetheapp-3cceb
R=southamerica-east1
TAG=v$(date -u +%Y%m%d%H%M)
QUAIS=${1:-tudo}
cd "$(dirname "$0")/../server"
gcloud config set project "$P" >/dev/null 2>&1

passo() { echo; echo "=================== $* ==================="; }

if [[ $QUAIS == tudo || $QUAIS == funcoes ]]; then
  passo "1/3 Caio e funções (agente, robo, treino)"
  (cd functions && npm ci --silent)
  if ! npx -y firebase-tools@13 login:list 2>/dev/null | grep -q "@"; then
    echo "Precisa entrar no Firebase: abra o link que vai aparecer, escolha sua conta, copie o código e cole aqui."
    npx -y firebase-tools@13 login --no-localhost
  fi
  npx -y firebase-tools@13 deploy --only functions --project "$P" --force
  echo "OK: funções atualizadas."
fi

robo() {  # $1 = nome do job no Cloud Run, $2 = pasta com o Dockerfile
  local img base novo
  img=$(gcloud run jobs describe "$1" --region="$R" --format='value(spec.template.spec.template.spec.containers[0].image)')
  base=${img%@*}; base=${base%:*}; novo="$base:$TAG"
  echo "Imagem atual: $img"
  echo "Imagem nova:  $novo"
  (cd "$2" && gcloud builds submit --region=us-central1 --config=cloudbuild.yaml --substitutions=_IMAGE="$novo" .)
  gcloud run jobs update "$1" --region="$R" --image="$novo" --quiet
  echo "OK: $1 agora usa $novo (para voltar: gcloud run jobs update $1 --region=$R --image=$img)"
}

if [[ $QUAIS == tudo || $QUAIS == malak ]]; then
  passo "2/3 Malak (lê partitura e gera o áudio)"
  robo robo malak
fi

if [[ $QUAIS == tudo || $QUAIS == mestrinho ]]; then
  passo "3/3 Mestrinho (gravação -> arranjo)"
  robo mestrinho mestrinho
fi

passo "PRONTO: robôs atualizados com o código do repositório"
