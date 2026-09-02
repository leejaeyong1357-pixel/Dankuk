/**
 * 생성된 음성 파일을 문항 뱅크의 promptAudio 에 연결한다.
 * services/tts/generate.py 실행 후에 돌린다.
 */
import fs from "node:fs";

const BANK = "data/testlets.json";
const DIR = "public/audio/questions";

if (!fs.existsSync(DIR)) {
  console.error(`${DIR} 가 없습니다. 먼저 services/tts/generate.py 를 실행하세요.`);
  process.exit(1);
}

const have = new Set(
  fs.readdirSync(DIR).filter((f) => f.endsWith(".wav")).map((f) => f.slice(0, -4)),
);
const testlets = JSON.parse(fs.readFileSync(BANK, "utf8"));

let linked = 0, total = 0;
for (const t of testlets) {
  for (const q of t.questions) {
    total++;
    if (have.has(q.id)) {
      q.promptAudio = `/audio/questions/${q.id}.wav`;
      linked++;
    } else {
      q.promptAudio = null;
    }
  }
}
fs.writeFileSync(BANK, JSON.stringify(testlets, null, 2));
console.log(`${linked} / ${total} 문항에 음성을 연결했습니다.`);
if (linked < total) {
  console.warn(`음성이 없는 문항 ${total - linked}개는 브라우저 음성으로 대체 재생됩니다.`);
}
