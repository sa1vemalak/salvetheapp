#!/bin/bash
# Downloads open-licensed score datasets into the private bucket gs://$BUCKET (runs in Cloud Build, which has open internet).
set -u
BUCKET=${BUCKET:-salvetheapp-3cceb-acervo}
W=/workspace/acervo; mkdir -p $W; cd $W
log() { echo "[$(date +%T)] $*"; }
manifest=$W/MANIFESTO.tsv; echo -e "conjunto\tarquivo\tbytes\torigem\tlicenca" > $manifest

zenodo() {  # record id, name, license, file-name regex to keep, max bytes per file
  local rec=$1 name=$2 lic=$3 keep=$4 max=$5
  mkdir -p $name
  curl -fsSL "https://zenodo.org/api/records/$rec" -o $name/zenodo.json || { log "ERRO zenodo $rec"; return; }
  python3 - "$name" "$keep" "$max" <<'PY' > $name/lista.txt
import json,sys,re
d=json.load(open(sys.argv[1]+'/zenodo.json')); keep=re.compile(sys.argv[2],re.I); mx=int(sys.argv[3])
for f in d.get('files',[]):
    n=f.get('key'); s=f.get('size',0); u=f['links'].get('self') or f['links'].get('content')
    print(('BAIXAR' if keep.search(n) and s<=mx else 'PULAR'),n,s,u,sep='\t')
PY
  cat $name/lista.txt | sed "s/^/  $name: /" | cut -c1-160
  while IFS=$'\t' read -r what f s u; do
    [ "$what" = BAIXAR ] || continue
    log "baixando $name/$f ($((s/1000000)) MB)"
    curl -fsSL --retry 5 -o "$name/$f" "$u" && echo -e "$name\t$f\t$s\thttps://zenodo.org/records/$rec\t$lic" >> $manifest
  done < $name/lista.txt
}
git_repo() {  # url, name, license
  log "clonando $2"; git clone -q --depth 1 "$1" "$2" && rm -rf "$2/.git" && echo -e "$2\t(repositório)\t$(du -sb $2 | cut -f1)\t$1\t$3" >> $manifest || log "ERRO $2"
}

# PDMX: ~250k public-domain MusicXML (use the no_license_conflict subset); keep everything up to 15 GB per file
zenodo 15571083 pdmx "PDMX/CC0 + CC-BY (conjunto)" '.' 15000000000
git_repo https://github.com/OpenScore/Lieder openscore-lieder "CC0 (crédito pedido)"
git_repo https://github.com/MutopiaProject/MutopiaProject mutopia "Domínio público / Creative Commons (ver cada peça)"
git_repo https://github.com/00sapo/OpenEWLD openewld "Domínio público; dados MIT + CC0"
git_repo https://github.com/DCMLab/choro choro-songbook "ver LICENSE do repositório"
# Slakh: only the small "baby" sample (the full set is >100 GB)
zenodo 4603870 slakh-baby "CC BY 4.0" '.' 15000000000

log "enviando para gs://$BUCKET"
gsutil -m -q cp -r $W/* gs://$BUCKET/ && log "pronto"
du -sh $W/* | sort -h
gsutil du -sh gs://$BUCKET
