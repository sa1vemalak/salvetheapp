# Mestrinho: recording -> instruments apart, notes, chords -> AI horn arrangement -> score PDFs
FROM python:3.10-slim
ENV PYTHONUNBUFFERED=1 DEBIAN_FRONTEND=noninteractive QT_QPA_PLATFORM=offscreen
RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends ffmpeg musescore3 wget ca-certificates fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*
RUN pip install -q --no-cache-dir torch torchaudio --extra-index-url https://download.pytorch.org/whl/cpu
RUN pip install -q --no-cache-dir --upgrade pip setuptools wheel "flit_core>=3.11,<4" cython
RUN pip install -q --no-cache-dir --prefer-binary --no-build-isolation demucs "basic-pitch[onnx]" onnxruntime panns-inference \
      librosa music21 soundfile "numpy<2" anthropic google-cloud-storage google-cloud-firestore \
    && (pip uninstall -y -q tflite-runtime || true)
# models baked into the image: no download when a band is waiting
RUN python -c "from demucs.pretrained import get_model; get_model('htdemucs_6s')" \
    && python -c "from panns_inference import SoundEventDetection; SoundEventDetection(checkpoint_path=None, device='cpu')"
WORKDIR /app
COPY mestrinho.py metais.py arranjador.py job.py /app/
CMD ["python", "/app/job.py"]
