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
  /*
   * 에스엘 블루.
   *
   * 받은 시안에서 뽑은 값이다 — 로그인 버튼 #0055AF, 대시보드 버튼 #015ACE,
   * 로고 글자 #033177. 이 셋을 600·700·900 에 맞추고 나머지를 이었다.
   * CI 규정집 값을 받으면 그대로 바꿔 넣으면 된다.
   */
  sl: {
    50: "#eef5ff", 100: "#d9e8ff", 200: "#b3d0ff", 300: "#80b2ff",
    400: "#3d87f0", 500: "#0d6ada", 600: "#0059c2", 700: "#00489e",
    800: "#033a7c", 900: "#033177",
  },};


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
      /*
       * 굵기를 한 단씩 낮춘다.
       *
       * 화면 곳곳이 font-bold / font-extrabold 로 덮여 있어 라벨도 값도 제목도
       * 전부 굵게 나왔다. 글자가 빽빽해 보이는 원인이 서체가 아니라 굵기였다.
       * 클래스 이름은 그대로 두고 값만 낮춘다 — 화면 코드를 한 줄도 건드리지
       * 않으면서 전체가 한 번에 가벼워진다.
       *
       * Pretendard 는 가변 서체라 650 같은 중간값도 그대로 나온다.
       */
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "550",
        bold: "600",
        extrabold: "680",
        black: "750",
      },
    },
  },
  plugins: [],
};
export default config;
