/** LLM 없이 계산되는 채점 지표 (docs/SPEC §4.3) */
export interface DeterministicMetrics {
  durationSec: number;
  wordCount: number;
  wpm: number;
  fillerCount: number;
  fillerRate: number;
  connectorCount: number;
  distinctConnectors: string[];
  typeTokenRatio: number;
  longestPauseSec: number;
  pauseOverTwoSec: number;
  pastTenseVerbCount: number;
  koreanSpilloverSec: number;
  koreanSpillover: boolean;
}
