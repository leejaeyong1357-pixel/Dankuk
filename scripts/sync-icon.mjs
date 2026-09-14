/**
 * 브라우저 탭 아이콘을 조직에 맞춰 자리에 놓는다.
 *
 * Next 는 app/icon.* 이라는 파일 이름만 보고 탭 아이콘을 정한다. 파일 이름
 * 규칙이라 lib/brand.ts 의 ACTIVE 를 따라가지 못하고, 조직마다 다른 파일을
 * 저장소에 두면 두 배포의 코드가 달라진다.
 *
 * 그래서 원본 두 벌을 public/icon-<브랜드> 로 두고, 빌드 전에 이 스크립트가
 * 맞는 것을 app/icon 으로 복사한다. app/icon.* 은 만들어지는 파일이라
 * .gitignore 에 넣어 두었다.
 */
import fs from "node:fs";
import path from "node:path";

/**
 * 조직 이름을 Next 와 같은 순서로 찾는다.
 *
 * 넘겨받은 환경변수가 먼저고(배포판 설정), 없으면 저장소의 .env.production 을
 * 본다. Next 는 그 파일을 알아서 읽지만 이 스크립트는 그냥 node 로 돌아
 * 읽지 못한다 — 여기서 읽지 않으면 아이콘만 다른 조직 것이 나간다.
 */
function brandKey() {
  if (!process.env.NEXT_PUBLIC_BRAND && fs.existsSync(".env.production")) {
    process.loadEnvFile(".env.production");
  }
  // lib/brand.ts 의 ACTIVE 와 같은 규칙
  return process.env.NEXT_PUBLIC_BRAND === "hanwha" ? "hanwha" : "dku";
}

const BRAND = brandKey();

const SOURCES = {
  dku: path.join("public", "icon-dku.svg"),
  hanwha: path.join("public", "icon-hanwha.png"),
};

const src = SOURCES[BRAND];
if (!fs.existsSync(src)) {
  console.error(`${src} 이 없습니다. 탭 아이콘 없이 빌드합니다.`);
  process.exit(0);
}

// 지난 빌드가 다른 조직의 아이콘을 남겼을 수 있다. 두 개가 함께 있으면
// Next 가 둘 다 탭 아이콘으로 내보내므로 먼저 치운다
for (const name of fs.readdirSync("app")) {
  if (/^icon\.(ico|jpg|jpeg|png|svg)$/.test(name)) {
    fs.rmSync(path.join("app", name));
  }
}

const dst = path.join("app", `icon${path.extname(src)}`);
fs.copyFileSync(src, dst);
console.log(`탭 아이콘 — ${src} → ${dst}`);
