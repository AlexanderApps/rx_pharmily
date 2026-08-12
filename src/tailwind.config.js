/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./shared/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  // Preflight is Tailwind's base reset — on web it targets bare HTML
  // element selectors (input, textarea, button, h1, etc.), not classes.
  // NativeWind maps those same element selectors onto their RN
  // equivalents (input -> TextInput, etc.) globally across the app, which
  // is why TextInputs that never use className still picked up reset
  // styling (removed default padding/borders, changed font handling) the
  // moment global.css's @tailwind base was added. Turning preflight off
  // stops that automatic reset; utility classes via className still work
  // exactly the same everywhere they're actually used.
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
