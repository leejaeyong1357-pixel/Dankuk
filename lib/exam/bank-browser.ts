"use client";

/**
 * 브라우저용 문항 뱅크 로더.
 *
 * 뱅크는 6MB 라 번들에 넣지 않는다. 정적 파일로 두고 필요할 때 한 번만
 * 내려받는다 (gzip 0.6MB, 브라우저가 캐시하므로 두 번째부터는 받지 않는다).
 */
import { bankLoaded, setBank, type Testlet } from "./repository";

const BANK_URL = "/data/testlets.json";

let pending: Promise<void> | null = null;

/** 뱅크가 준비될 때까지 기다린다. 여러 번 불러도 한 번만 받는다. */
export function ensureBank(): Promise<void> {
  if (bankLoaded()) return Promise.resolve();
  if (!pending) {
    pending = fetch(BANK_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`문항을 불러오지 못했습니다 (${res.status})`);
        return res.json();
      })
      .then((data) => setBank(data as Testlet[]))
      .catch((err) => {
        // 실패하면 다음 시도에서 다시 받을 수 있게 비운다
        pending = null;
        throw err;
      });
  }
  return pending;
}
