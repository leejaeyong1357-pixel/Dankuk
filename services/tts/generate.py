"""
문항 음성 사전 생성 — Kokoro-82M (Apache-2.0). SPEC §6.1

문항은 고정이므로 오프라인에서 한 번만 생성해 정적 MP3 로 서빙한다.
따라서 런타임 추론도, 런타임 비용도 없다.

실제 OPIc 의 Ava 음성을 복제하지 않는다. 음성 인격권 문제가 있고,
대비 효과는 동일 음색이 아니라 동일 레지스터(미국식 여성·중간 속도·중립 톤)에서 나온다.

실행:
  pip install -r requirements.txt
  python generate.py            # 미생성 문항만
  python generate.py --force    # 전체 재생성
"""
import argparse
import json
import pathlib
import sys

OUT_DIR = pathlib.Path(__file__).resolve().parents[2] / "public" / "audio" / "questions"
BANK = pathlib.Path(__file__).resolve().parents[2] / "data" / "questions.json"

# Ava 대역으로 고정할 보이스. 미국식 여성·중립 톤.
VOICE = "af_heart"
SPEED = 0.95


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="이미 있는 파일도 다시 만든다")
    args = ap.parse_args()

    try:
        import soundfile as sf
        from kokoro import KPipeline
    except ImportError:
        print("의존성이 없습니다. pip install -r requirements.txt 를 먼저 실행하세요.", file=sys.stderr)
        return 1

    questions = json.loads(BANK.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    pipeline = KPipeline(lang_code="a")  # a = American English

    made = skipped = 0
    for q in questions:
        target = OUT_DIR / f"{q['id']}.wav"
        if target.exists() and not args.force:
            skipped += 1
            continue
        chunks = [audio for _, _, audio in pipeline(q["textEn"], voice=VOICE, speed=SPEED)]
        if not chunks:
            continue
        import numpy as np
        sf.write(target, np.concatenate(chunks), 24000)
        made += 1
        if made % 50 == 0:
            print(f"  {made}개 생성…")

    print(f"생성 {made}개 / 건너뜀 {skipped}개 -> {OUT_DIR}")
    print("data/questions.json 의 audioUrl 을 채우려면 link_audio.mjs 를 실행하세요.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
