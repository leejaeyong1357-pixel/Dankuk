"""
STT 서비스 계약 테스트.

모델 가중치 없이도 응답 형태가 웹 앱(lib/stt.ts)의 기대와 맞는지 검증한다.
채점에 직결되는 두 필드가 빠지면 지표가 통째로 무너지므로 반드시 확인한다.
  - words   : 단어 단위 타임스탬프 -> 발화량·WPM·침묵 구간
  - segments: 구간별 언어 태그    -> 한국어 이탈 탐지

실행: python3 services/stt/test_contract.py
"""
from __future__ import annotations

import sys
import types
from dataclasses import dataclass
from pathlib import Path


@dataclass
class _Word:
    word: str
    start: float
    end: float


@dataclass
class _Segment:
    text: str
    start: float
    end: float
    words: list


@dataclass
class _Info:
    language: str
    duration: float


class _StubModel:
    """faster_whisper.WhisperModel 대역"""

    def __init__(self, *_args, **_kwargs):
        pass

    def transcribe(self, _path, **_kwargs):
        segments = [
            _Segment(
                text=" I usually go to the cafe near my house.",
                start=0.0, end=3.4,
                words=[_Word(" I", 0.0, 0.2), _Word(" usually", 0.2, 0.7)],
            ),
        ]
        return iter(segments), _Info(language="en", duration=3.4)


def main() -> int:
    # faster_whisper 를 스텁으로 갈아끼운 뒤 서비스를 import 한다
    stub = types.ModuleType("faster_whisper")
    stub.WhisperModel = _StubModel  # type: ignore[attr-defined]
    sys.modules["faster_whisper"] = stub
    sys.path.insert(0, str(Path(__file__).parent))

    try:
        from fastapi.testclient import TestClient
    except ImportError:
        print("fastapi[testclient] 가 필요합니다: pip install httpx", file=sys.stderr)
        return 1

    import main as service  # noqa: PLC0415

    client = TestClient(service.app)

    health = client.get("/health")
    assert health.status_code == 200, health.text
    assert health.json()["ok"] is True

    res = client.post("/transcribe", files={"file": ("a.webm", b"\x00\x01", "audio/webm")})
    assert res.status_code == 200, res.text
    body = res.json()

    failures = []
    for key in ("text", "duration", "words", "segments"):
        if key not in body:
            failures.append(f"필수 필드 누락: {key}")

    if body.get("words"):
        w = body["words"][0]
        for key in ("word", "start", "end"):
            if key not in w:
                failures.append(f"words[].{key} 누락 — 발화량·유창성 지표가 계산되지 않습니다")
    else:
        failures.append("words 가 비어 있습니다 — word_timestamps 설정을 확인하세요")

    if body.get("segments"):
        s = body["segments"][0]
        for key in ("text", "start", "end", "language"):
            if key not in s:
                failures.append(f"segments[].{key} 누락 — 한국어 이탈 탐지가 동작하지 않습니다")
    else:
        failures.append("segments 가 비어 있습니다")

    if failures:
        for f in failures:
            print(f"  ✗ {f}")
        return 1

    print(f"  ✓ text: {body['text'][:40]!r}")
    print(f"  ✓ duration: {body['duration']}")
    print(f"  ✓ words: {len(body['words'])}개 (word/start/end 확인)")
    print(f"  ✓ segments: {len(body['segments'])}개 (language 태그 확인)")
    print("STT 서비스 계약 통과")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
