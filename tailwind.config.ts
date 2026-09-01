import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 단국대 코퍼릿 블루 계열
        dku: {
          50: "#eef4fd",
          100: "#d9e6fa",
          200: "#b9d0f5",
          300: "#8bb2ed",
          400: "#5789e1",
          500: "#3468d4",
          600: "#2451ba",
          700: "#1d4098",
          800: "#12357c",
          900: "#0b2a63",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
