FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive PYTHONUNBUFFERED=1 QT_QPA_PLATFORM=offscreen JAVA_TOOL_OPTIONS=-Djava.awt.headless=true
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-pip ca-certificates curl jq fluidsynth fluid-soundfont-gm musescore-general-soundfont ffmpeg musescore3 \
      fontconfig fonts-dejavu-core libfreetype6 libgtk-3-0t64 libgl1 xvfb xauth tesseract-ocr tesseract-ocr-eng tesseract-ocr-por tesseract-ocr-ita tesseract-ocr-deu \
    && rm -rf /var/lib/apt/lists/*
# Audiveris (reads printed scores): the newest Ubuntu 24.04 package from its releases
RUN set -eux; \
    url=$(curl -fsSL https://api.github.com/repos/Audiveris/audiveris/releases \
          | jq -r '[.[] | select(.prerelease == false) | .assets[] | select(.name | test("ubuntu24.*x86_64.*\\.deb$"))][0].browser_download_url'); \
    echo "Audiveris: $url"; curl -fsSL -o /tmp/audiveris.deb "$url"; \
    deps=$(dpkg-deb -f /tmp/audiveris.deb Depends | sed -E 's/\([^)]*\)//g; s/\|[^,]*//g; s/,/ /g'); echo "deps: $deps"; \
    apt-get update; apt-get install -y --no-install-recommends $deps; \
    dpkg-deb -x /tmp/audiveris.deb /; rm -rf /var/lib/apt/lists/* /tmp/audiveris.deb; \
    bin=$(find /opt -type f -iname 'audiveris' -perm -u+x | head -1); ln -s "$bin" /usr/local/bin/audiveris; audiveris -help >/dev/null 2>&1 || true
COPY requirements.txt /app/
RUN pip3 install --no-cache-dir --break-system-packages -r /app/requirements.txt
COPY robo.py layout2.py /app/
WORKDIR /app
CMD ["python3", "/app/robo.py"]
