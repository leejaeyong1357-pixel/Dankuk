/**
 * 정적 배포(STATIC_EXPORT=1)와 서버 배포를 같은 코드로 지원한다.
 *
 * 정적 배포에서는 out/ 을 그대로 Cloudflare Pages·Netlify 같은 곳에 올린다.
 * 서버가 없으므로 API 라우트는 쓰이지 않는다 — 출제·전사·채점은 모두
 * 브라우저에서 돈다 (lib/client-engine.ts).
 */
const isStatic = process.env.STATIC_EXPORT === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isStatic
    ? {
        output: "export",
        // 정적 호스팅은 /path 를 /path/index.html 로 찾는다
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
