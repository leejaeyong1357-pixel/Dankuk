/**
 * 생성된 음성 파일을 문항 뱅크의 promptAudio 에 연결한다.
 * services/tts/generate.py 실행 후에 돌린다.
 *
 * 파일 이름은 문장 내용의 해시다. 서로 다른 문항이 같은 문장을 쓰면
 * 같은 파일을 가리키므로 중복 저장이 없고, 뱅크를 다시 만들어도 재사용된다.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";

const BANK = "data/testlets.json";
const DIR = "public/audio/questions";
const EXT = "mp3";

const audioName = (text) =>
  `${createHash("sha1").update(text, "utf8").digest("hex").slice(0, 12)}.${EXT}`;

if (!fs.existsSync(DIR)) {
  console.error(`${DIR} 가 없습니다. 먼저 services/tts/generate.py 를 실행하세요.`);
  process.exit(1);
}

const have = new Set(fs.readdirSync(DIR).filter((f) => f.endsWith(`.${EXT}`)));
const testlets = JSON.parse(fs.readFileSync(BANK, "utf8"));

let linked = 0, total = 0;
const missing = new Set();
for (const t of testlets) {
  for (const q of t.questions) {
    total++;
    const name = audioName(q.promptText);
    if (have.has(name)) {
      q.promptAudio = `/audio/questions/${name}`;
      linked++;
    } else {
      q.promptAudio = null;
      missing.add(name);
    }
  }
}
fs.writeFileSync(BANK, JSON.stringify(testlets, null, 2));

console.log(`${linked} / ${total} 문항에 음성을 연결했습니다 (파일 ${have.size}개).`);
if (missing.size) {
  console.warn(`음성이 없는 문장 ${missing.size}개는 브라우저 음성으로 대체 재생됩니다.`);
}

// 뱅크를 다시 만들면 사라진 문장의 음성이 그대로 남는다.
// 배포에 같이 실려 용량만 차지하므로 정리할 수 있게 한다.
// 지우는 동작이라 기본값은 보고만 하고, --prune 을 줄 때만 실제로 지운다.
const used = new Set();
for (const t of testlets) {
  for (const q of t.questions) used.add(audioName(q.promptText));
}
const orphans = [...have].filter((f) => !used.has(f));

if (orphans.length) {
  const bytes = orphans.reduce((s, f) => s + fs.statSync(`${DIR}/${f}`).size, 0);
  const mb = (bytes / 1024 / 1024).toFixed(0);
  if (process.argv.includes("--prune")) {
    for (const f of orphans) fs.unlinkSync(`${DIR}/${f}`);
    console.log(`쓰이지 않는 음성 ${orphans.length}개(${mb}MB)를 지웠습니다.`);
  } else {
    console.log(
      `쓰이지 않는 음성 ${orphans.length}개(${mb}MB)가 있습니다. ` +
      `지우려면 npm run link-audio -- --prune`,
    );
  }
}
