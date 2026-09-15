/**
 * 정적 배포 빌드.
 *
 * 서버가 없는 곳(Cloudflare Pages, Netlify 등)에 올릴 out/ 을 만든다.
 * 출제·전사·채점은 모두 브라우저에서 돌기 때문에 API 라우트가 필요 없지만,
 * app/api 가 남아 있으면 next build 가 정적 내보내기를 거부한다.
 * 그래서 빌드하는 동안만 비켜 두었다가 반드시 되돌린다.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const API = path.join("app", "api");
// _ 로 시작하는 폴더는 App Router 가 경로로 잡지 않는다
const PARKED = path.join("app", "_api_disabled_during_static_build");

function restore() {
  if (fs.existsSync(PARKED)) {
    if (fs.existsSync(API)) fs.rmSync(API, { recursive: true, force: true });
    fs.renameSync(PARKED, API);
  }
}

// 이전 빌드가 중간에 죽었을 수 있다
restore();

if (!fs.existsSync(API)) {
  console.error("app/api 가 없습니다. 저장소 상태를 확인하세요.");
  process.exit(1);
}

process.on("SIGINT", () => { restore(); process.exit(130); });
process.on("SIGTERM", () => { restore(); process.exit(143); });

/**
 * 채점 키가 이 빌드에 들어왔는지 로그에 남긴다.
 *
 * 키는 빌드할 때 코드에 박히므로, 배포판 설정에 넣어도 빌드가 그 값을 받지
 * 못하면 조용히 "AI 채점 꺼짐"으로 나간다. 그때 설정이 잘못된 것인지 값이
 * 전달되지 않은 것인지 화면만 보고는 알 수 없어, 빌드 로그에서 바로 가린다.
 *
 * 값은 절대 찍지 않는다 — 들어 있는지와 길이만 적는다.
 */
function reportKey(name) {
  const v = process.env[name];
  console.log(`[채점 키] ${name}: ${v && v.trim() ? `있음 (${v.trim().length}자)` : "없음"}`);
}
console.log("──────── 이 빌드가 받은 채점 키 ────────");
reportKey("NEXT_PUBLIC_OPENAI_API_KEY");
reportKey("NEXT_PUBLIC_ANTHROPIC_API_KEY");
console.log("둘 다 '없음' 이면 배포판 설정이 빌드로 전달되지 않은 것이다.");
console.log("────────────────────────────────────────");

try {
  execSync("node scripts/copy-bank.mjs", { stdio: "inherit" });
  // npm 의 prebuild 는 build 스크립트에만 걸린다. 여기서는 직접 부른다
  execSync("node scripts/sync-icon.mjs", { stdio: "inherit" });
  // 이전 빌드가 남긴 라우트 타입이 남아 있으면, 비켜 둔 API 를 찾다 실패한다
  fs.rmSync(".next", { recursive: true, force: true });
  fs.renameSync(API, PARKED);
  execSync("next build", {
    stdio: "inherit",
    env: { ...process.env, STATIC_EXPORT: "1", NEXT_PUBLIC_STATIC_MODE: "1" },
  });
} finally {
  restore();
}

const out = "out";
if (!fs.existsSync(out)) {
  console.error("out/ 이 만들어지지 않았습니다.");
  process.exit(1);
}

const size = execSync(`du -sh ${out}`).toString().split("\t")[0];
console.log(`\n정적 빌드 완료 — ${out}/ (${size})`);
console.log("이 폴더를 그대로 올리면 됩니다 (Cloudflare Pages, Netlify 등).");
