/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./tr/**/*.html",
        "./en/**/*.html",
        "./de/**/*.html",
        "./ru/**/*.html",
        "./fr/**/*.html",
        "./assets/js/**/*.js",
        "./admin/**/*.html"
    ],
    theme: {
        extend: {
            colors: {
                'santis-gold': '#D4AF37',
            },
            fontFamily: {
                'sans': ['Inter', 'sans-serif'],
                'serif': ['"Playfair Display"', 'serif'],
                'mono': ['Space Mono', 'sans-serif']
            }
        },
    },
    plugins: [],
}
