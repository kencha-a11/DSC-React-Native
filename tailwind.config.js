/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        lato: ["Lato_400Regular", "sans-serif"],
        latoBold: ["Lato_700Bold", "sans-serif"],
        robotoMono: ["RobotoMono_400Regular", "monospace"],
        robotoMonoBold: ["RobotoMono_700Bold", "monospace"],
      },
      colors: {
        primary: {
          100: "#0061FF0A",
          200: "#0061FF1A",
          300: "#0061FF",
        },
        accent: {
          100: "#FBFBFD",
        },
        black: {
          DEFAULT: '#000000',
          100: '#8C8E98',
          200: '#666876',
          300: '#191d31'
        },
        danger: '#F75555'
      },
    },
  },
  plugins: [],
};
