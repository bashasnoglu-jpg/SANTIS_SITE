/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                santis: {
                    bg: "#1a1a1a",     // Deep Matte Black
                    card: "#262626",   // Slightly lighter for cards
                    gold: "#d4af37",   // Wealth / Luxury
                    text: "#e5e5e5",   // Primary Text
                    muted: "#a3a3a3",  // Secondary Text
                    border: "#404040", // Subtle Borders
                    success: "#10b981",
                    error: "#ef4444"
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'], // Maybe add for headings later?
            }
        },
    },
    plugins: [],
}
