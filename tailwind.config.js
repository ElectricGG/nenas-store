/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            colors: {
                'palo-rosa': '#D48995',
                'rosa': '#FFB7C5',
                'blanco': '#FFFFFF',
                primary: {
                    DEFAULT: '#D48995',
                    50: '#fbf3f5',
                    100: '#f6e5e9',
                    200: '#eccad4',
                    300: '#dfadbd',
                    400: '#d48995',
                    500: '#c56577',
                    600: '#ab4a5e',
                    700: '#8e3a4b',
                    800: '#773341',
                    900: '#662f3a',
                }
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
                serif: ['"Playfair Display"', 'serif'],
            }
        },
    },
    plugins: [],
}
