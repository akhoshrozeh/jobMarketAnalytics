import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "emc": "#14E8A2",
        "m-dark-green": "#3D8D7A",
        "m-light-green": "#B3D8A8",
        "m-light-yellow": "#FBFFE4",
        "m-light-blue": "#A3D1C6",
      },
      animation: {
        'spin-slow': 'spin 40s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
