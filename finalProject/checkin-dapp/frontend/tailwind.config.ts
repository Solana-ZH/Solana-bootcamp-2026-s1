import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FDFBF7",
        brand: {
          pink: "#FF8FAB",
          yellow: "#FFD93D",
          blue: "#4CC9F0",
          green: "#6BCB77",
          dark: "#2D3436",
          gray: "#F0F0F0",
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        'cartoon': '4px 4px 0px 0px #2D3436',
        'cartoon-sm': '2px 2px 0px 0px #2D3436',
        'cartoon-hover': '2px 2px 0px 0px #2D3436',
        'cartoon-lg': '6px 6px 0px 0px #2D3436',
      }
    },
  },
  plugins: [],
};
export default config;
