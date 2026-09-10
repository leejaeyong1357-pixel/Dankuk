import type { Config } from "tailwindcss";
import { ACTIVE, type BrandKey } from "./lib/brand";

/**
 * 조직별 색.
 *
 * 클래스 이름(dku-600 등)은 그대로 두고 값만 바꾼다. 그래야 조직을 바꿀 때
 * 화면 코드를 한 줄도 건드리지 않는다.
 */
const PALETTES: Record<BrandKey, Record<number, string>> = {
  // 단국대 코퍼릿 블루
  dku: {
    50: "#eef4fd", 100: "#d9e6fa", 200: "#b9d0f5", 300: "#8bb2ed",
    400: "#5789e1", 500: "#3468d4", 600: "#2451ba", 700: "#1d4098",
    800: "#12357c", 900: "#0b2a63",
  },
  // 한화엔진 오렌지
  hanwha: {
    50: "#fff5f0", 100: "#ffe6da", 200: "#ffc9b0", 300: "#ffa483",
    400: "#fb7d51", 500: "#f2612f", 600: "#e64f1c", 700: "#c03d13",
    800: "#963012", 900: "#6e2410",
  },
};


const config: Config = {
  // lib/brand.ts 가 클래스 이름을 들고 있으므로 lib 도 훑는다
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 조직 색 — lib/brand.ts 의 ACTIVE 가 고른다. 화면 코드는 dku-* 를 그대로 쓴다
        dku: PALETTES[ACTIVE],
      },
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
