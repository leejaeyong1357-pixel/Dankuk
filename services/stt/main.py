"""
STT 마이크로서비스 — faster-whisper (MIT) 래퍼. SPEC §6.2

Next.js 의 lib/stt.ts 가 STT_URL 로 이 서비스를 호출한다.
반환 필드 중 두 가지가 채점에 직결되므로 반드시 유지해야 한다.
  - words   : 단어 단위 타임스탬프 -> 발화량·WPM·침묵 구간 지표
  - segments: 구간별 언어 태그   -> 한국어 이탈 탐지 ("언어 선택" 채점 항목)

실행:
  pip install -r requirements.txt
  uvicorn main:app --host 0.0.0.0 --port 8000
"""
import os
import tempfile

from fastapi import FastAPI, UploadFile, File
from faster_whisper import WhisperModel

# GPU 가 있으면 float16, 없으면 CPU int8 로 떨어진다.
MODEL_SIZE = os.getenv("WHISPER_MODEL", "large-v3")
DEVICE = os.getenv("WHISPER_DEVICE", "auto")
COMPUTE = os.getenv("WHISPER_COMPUTE", "float16" if DEVICE == "cuda" else "int8")

app = FastAPI(title="DKU OPIc STT")
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE)


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_SIZE, "device": DEVICE, "compute": COMPUTE}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or "")[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await file.read())
        path = tmp.name

    try:
        # multilingual=True 로 두어야 한국어 구간을 한국어로 받아쓴다.
        # 영어 전용 모델을 쓰면 한국어 이탈이 깨진 영어로 나와 탐지가 불가능하다.
        segments, info = model.transcribe(
            path,
            word_timestamps=True,
            vad_filter=True,
            beam_size=5,
        )

        words, segs, text_parts = [], [], []
        for seg in segments:
            text_parts.append(seg.text)
            segs.append({
                "text": seg.text,
                "start": seg.start,
                "end": seg.end,
                # faster-whisper 는 파일 전체에 대해 하나의 언어를 판정한다.
                # 구간별 판정이 필요하면 WhisperX 정렬을 붙여 확장한다.
                "language": info.language,
            })
            for wd in (seg.words or []):
                words.append({"word": wd.word.strip(), "start": wd.start, "end": wd.end})

        return {
            "text": "".join(text_parts).strip(),
            "duration": info.duration,
            "language": info.language,
            "words": words,
            "segments": segs,
        }
    finally:
        os.unlink(path)
