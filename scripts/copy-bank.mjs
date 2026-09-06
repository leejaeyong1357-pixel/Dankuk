/**
 * 문항 뱅크를 정적 파일로 복사한다.
 *
 * 브라우저는 뱅크를 번들이 아니라 /data/testlets.json 에서 내려받는다.
 * 6MB 를 번들에 넣으면 접속할 때마다 파싱 비용을 물기 때문이다.
 * (gzip 0.6MB, 브라우저가 캐시하므로 두 번째부터는 받지 않는다)
 */
import fs from "node:fs";
import path from "node:path";

const SRC = "data/testlets.json";
const DIR = path.join("public", "data");
const DST = path.join(DIR, "testlets.json");

if (!fs.existsSync(SRC)) {
  console.error(`${SRC} 이 없습니다. npm run seed 를 먼저 실행하세요.`);
  process.exit(1);
}
fs.mkdirSync(DIR, { recursive: true });
fs.copyFileSync(SRC, DST);
const mb = (fs.statSync(DST).size / 1024 / 1024).toFixed(1);
console.log(`문항 뱅크를 ${DST} 로 복사했습니다 (${mb}MB).`);
