/**
 * SMTP 설정 점검.
 *
 * 인증 코드가 실제로 학생에게 닿는지는 로그인 화면까지 가 보기 전에는 알기 어렵다.
 * 이 스크립트는 접속 -> 인증 -> 실제 발송까지 한 번에 확인한다.
 *
 *   npm run check:smtp -- 받는주소@dankook.ac.kr
 *
 * 받는 주소를 생략하면 접속과 인증까지만 확인하고 메일은 보내지 않는다.
 */
import nodemailer from "nodemailer";

const to = process.argv[2];

const cfg = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM ?? "단국대 OPIc 트레이너 <no-reply@dankook.ac.kr>",
};

if (!cfg.host) {
  console.error("SMTP_HOST 가 없습니다. .env 를 만들고 다시 실행하세요.");
  console.error("  cp .env.example .env   # SMTP_* 채우기");
  process.exit(1);
}

// 흔한 설정 실수는 접속 전에 잡아 준다
if (cfg.port === 465 && !cfg.secure) {
  console.warn("경고: 465 포트는 보통 SMTP_SECURE=true 입니다.");
}
if (cfg.port === 587 && cfg.secure) {
  console.warn("경고: 587 포트는 보통 SMTP_SECURE=false (STARTTLS) 입니다.");
}

console.log(`서버   ${cfg.host}:${cfg.port} (secure=${cfg.secure})`);
console.log(`계정   ${cfg.user ?? "(인증 없음)"}`);
console.log(`발신   ${cfg.from}`);

const transport = nodemailer.createTransport({
  host: cfg.host,
  port: cfg.port,
  secure: cfg.secure,
  auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
});

try {
  await transport.verify();
  console.log("\n접속·인증 OK");
} catch (err) {
  console.error("\n접속 또는 인증 실패:", err.message);
  console.error(hint(err));
  process.exit(1);
}

if (!to) {
  console.log("받는 주소를 주면 실제로 한 통 보내 봅니다:");
  console.log("  npm run check:smtp -- 본인주소@dankook.ac.kr");
  process.exit(0);
}

try {
  const info = await transport.sendMail({
    from: cfg.from,
    to,
    subject: "[단국대 OPIc 트레이너] SMTP 점검",
    text:
      "이 메일이 보이면 인증 코드 발송이 정상 동작합니다.\n" +
      "받은편지함에 없으면 스팸함도 확인해 주세요. " +
      "스팸으로 갔다면 발신 도메인의 SPF/DKIM 설정이 필요합니다.",
  });
  console.log(`발송 OK  messageId=${info.messageId}`);
  console.log(`거부된 주소: ${info.rejected.length ? info.rejected.join(", ") : "없음"}`);
  console.log("\n받은편지함과 스팸함을 모두 확인하세요.");
} catch (err) {
  console.error("발송 실패:", err.message);
  console.error(hint(err));
  process.exit(1);
}

function hint(err) {
  const m = String(err.message);
  if (/EAUTH|535|Username and Password/i.test(m)) {
    return "→ 계정/비밀번호 문제입니다. Gmail 이면 계정 비밀번호가 아니라 앱 비밀번호를 넣어야 합니다.";
  }
  if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(m)) {
    return "→ 서버 주소·포트를 확인하세요. 사내망이면 아웃바운드 25/465/587 이 막혀 있을 수 있습니다.";
  }
  if (/self.signed|certificate|SSL|TLS/i.test(m)) {
    return "→ 포트와 SMTP_SECURE 조합을 확인하세요 (587=false, 465=true).";
  }
  if (/550|553|relay|not permitted|Sender address rejected/i.test(m)) {
    return "→ 발신 주소가 서버에서 허용되지 않았습니다. SMTP_FROM 을 인증한 계정의 주소로 맞추세요.";
  }
  return "";
}
