/**
 * 인증 코드 발송.
 *
 * SMTP 설정이 있으면 실제로 메일을 보내고, 없으면 서버 로그에만 남긴다.
 * 개발 환경에서 메일 서버 없이도 로그인 흐름을 끝까지 확인할 수 있게 하기 위함이다.
 * 운영에서는 SMTP_* 를 반드시 설정해야 한다.
 */
export interface Mailer {
  name: string;
  sendCode(email: string, code: string): Promise<void>;
}

export class ConsoleMailer implements Mailer {
  name = "console";
  async sendCode(email: string, code: string) {
    console.info(`[auth] 인증 코드 발송 (SMTP 미설정) ${email} -> ${code}`);
  }
}

export class SmtpMailer implements Mailer {
  name = "smtp";
  async sendCode(email: string, code: string) {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? "단국대 OPIc 트레이너 <no-reply@dankook.ac.kr>",
      to: email,
      subject: `[단국대 OPIc 트레이너] 인증 코드 ${code}`,
      text: `인증 코드는 ${code} 입니다. 10분 안에 입력해 주세요.\n본인이 요청하지 않았다면 이 메일을 무시하세요.`,
    });
  }
}

let cached: Mailer | null = null;
export function getMailer(): Mailer {
  if (cached) return cached;
  cached = process.env.SMTP_HOST ? new SmtpMailer() : new ConsoleMailer();
  return cached;
}

/** SMTP 가 없으면 개발 편의를 위해 코드를 응답에 실어 준다 */
export const exposesCode = () => !process.env.SMTP_HOST;
