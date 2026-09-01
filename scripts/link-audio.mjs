/**
 * 생성된 음성 파일을 문항 뱅크의 audioUrl 에 연결한다.
 * services/tts/generate.py 실행 후에 돌린다.
 */
import fs from "node:fs";

const BANK = "data/questions.json";
const DIR = "public/audio/questions";

if (!fs.existsSync(DIR)) {
  console.error(`${DIR} 가 없습니다. 먼저 services/tts/generate.py 를 실행하세요.`);
  process.exit(1);
}

const have = new Set(fs.readdirSync(DIR).filter((f) => f.endsWith(".wav")).map((f) => f.slice(0, -4)));
const questions = JSON.parse(fs.readFileSync(BANK, "utf8"));

let linked = 0;
for (const q of questions) {
  if (have.has(q.id)) {
    q.audioUrl = `/audio/questions/${q.id}.wav`;
    linked++;
  } else {
    delete q.audioUrl;
  }
}
fs.writeFileSync(BANK, JSON.stringify(questions, null, 2));
console.log(`${linked} / ${questions.length} 문항에 음성을 연결했습니다.`);
