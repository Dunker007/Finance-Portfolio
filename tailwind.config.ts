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
                'bg-dark': '#050505',
                'bg-card': '#0a0a0a',
                'primary-blue': '#3b82f6',
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.5s ease-out',
                'glow': 'pulse-glow 3s infinite',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'pulse-glow': {
                    '0%, 100%': { 'box-shadow': '0 0 5px rgba(59, 130, 246, 0.5)' },
                    '50%': { 'box-shadow': '0 0 15px rgba(59, 130, 246, 0.5)' },
                }
            }
        },
    },
    plugins: [],
} satisfies Config;
