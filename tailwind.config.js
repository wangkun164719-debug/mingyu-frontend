/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07101f",
          900: "#0c1730",
          850: "#101d38",
          800: "#152344",
          700: "#25345a"
        },
        gold: {
          300: "#f6dd88",
          400: "#e6c35a",
          500: "#cba23a",
          600: "#a68224"
        },
        mist: {
          100: "#eef2ff",
          200: "#d8deef",
          300: "#a6b0c8",
          400: "#7c88a5"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(230,195,90,0.3), 0 22px 50px rgba(6,10,24,0.45)",
        soft: "0 14px 40px rgba(4, 10, 24, 0.26)"
      },
      fontFamily: {
        display: ['"Noto Serif SC"', '"Songti SC"', '"STSong"', "serif"],
        sans: ['"PingFang SC"', '"Microsoft YaHei"', "system-ui", "sans-serif"]
      },
      backgroundImage: {
        aurora:
          "radial-gradient(circle at top, rgba(36, 58, 104, 0.45), rgba(7, 16, 31, 0) 42%), linear-gradient(135deg, #0a1730 0%, #121f3d 48%, #271d44 100%)",
        card:
          "linear-gradient(145deg, rgba(19, 33, 64, 0.94), rgba(17, 29, 58, 0.82))"
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseStar: {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.18)" }
        },
        modalIn: {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        }
      },
      animation: {
        rise: "rise 0.5s ease-out both",
        star: "pulseStar 4.8s ease-in-out infinite",
        modal: "modalIn 0.22s ease-out both"
      }
    }
  },
  plugins: []
};
