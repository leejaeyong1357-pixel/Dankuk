"""
문항 음성 사전 생성 — Kokoro-82M (Apache-2.0). docs/SPEC §6.1

문항은 고정이므로 오프라인에서 한 번만 생성해 정적 파일로 서빙한다.
따라서 런타임 추론도, 런타임 비용도 없다.

브라우저 내장 음성(speechSynthesis)은 운영에 쓰지 않는다.
OS·브라우저마다 목소리가 다르고 en-US 음성이 아예 없는 환경도 있어,
학생마다 다른 문제를 듣게 되기 때문이다.

실제 OPIc 의 면접관 음성을 복제하지 않는다. 음성 인격권 문제가 있고,
대비 효과는 동일 음색이 아니라 동일 레지스터(미국식 여성·중간 속도·중립 톤)에서 나온다.

준비:
  pip install -r requirements.txt
  # 모델 가중치 (Apache-2.0, kokoro-onnx 릴리스)
  curl -L -o models/kokoro-v1.0.onnx \
    https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  curl -L -o models/voices-v1.0.bin \
    https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

실행:
  python generate.py              # 미생성 문항만
  python generate.py --force      # 전체 재생성
  python generate.py --workers 8  # 병렬 처리
"""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import shutil
import sys
import time
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public" / "audio" / "questions"
BANK = ROOT / "data" / "testlets.json"
MODELS = pathlib.Path(os.getenv("KOKORO_DIR", str(pathlib.Path(__file__).parent / "models")))

# 면접관 음성 — 미국식 여성, 중립 톤. 한 번 정하면 바꾸지 않는다.
VOICE = os.getenv("KOKORO_VOICE", "af_heart")
SPEED = float(os.getenv("KOKORO_SPEED", "0.95"))
LANG = "en-us"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="이미 있는 파일도 다시 만든다")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--limit", type=int, default=0, help="처음 N개만 (점검용)")
    args = ap.parse_args()

    try:
        import soundfile as sf
        from kokoro_onnx import Kokoro
    except ImportError:
        print("의존성이 없습니다. pip install -r requirements.txt", file=sys.stderr)
        return 1

    model = MODELS / "kokoro-v1.0.onnx"
    voices = MODELS / "voices-v1.0.bin"
    if not model.exists() or not voices.exists():
        print(f"모델 파일이 없습니다: {MODELS}\n상단 주석의 curl 명령으로 내려받으세요.", file=sys.stderr)
        return 1

    testlets = json.loads(BANK.read_text(encoding="utf-8"))
    questions = [q for t in testlets for q in t["questions"]]
    if args.limit:
        questions = questions[: args.limit]

    # 서로 다른 testlet 이 같은 문장을 쓰는 경우가 절반 가까이 된다.
    # 문장 단위로 한 번만 합성하고 나머지는 파일을 복사해 재사용한다.
    by_text: dict[str, list[dict]] = {}
    for q in questions:
        by_text.setdefault(q["promptText"], []).append(q)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    kokoro = Kokoro(str(model), str(voices))

    def missing(group):
        return args.force or any(not (OUT_DIR / f"{q['id']}.wav").exists() for q in group)

    todo = [(text, group) for text, group in by_text.items() if missing(group)]
    print(
        f"문항 {len(questions)}개 / 고유 문장 {len(by_text)}개 / "
        f"합성 대상 {len(todo)}개 / 보이스 {VOICE}",
    )

    done = 0
    started = time.time()

    def render(item):
        nonlocal done
        text, group = item
        first = OUT_DIR / f"{group[0]['id']}.wav"
        try:
            samples, sr = kokoro.create(text, voice=VOICE, speed=SPEED, lang=LANG)
            sf.write(first, samples, sr)
            # 같은 문장을 쓰는 나머지 문항에는 결과를 복사한다
            for q in group[1:]:
                shutil.copyfile(first, OUT_DIR / f"{q['id']}.wav")
        except Exception as exc:  # 한 문항 실패가 전체를 멈추지 않게 한다
            print(f"  실패 {group[0]['id']}: {exc}", file=sys.stderr)
            return
        done += 1
        if done % 50 == 0:
            rate = done / max(time.time() - started, 0.001)
            left = (len(todo) - done) / max(rate, 0.001)
            print(f"  {done}/{len(todo)}  ({rate:.1f}/s, 남은 시간 약 {left/60:.1f}분)", flush=True)

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        list(pool.map(render, todo))

    print(f"완료 {done}개 -> {OUT_DIR} ({(time.time()-started)/60:.1f}분)")
    print("이어서 실행: npm run link-audio")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
