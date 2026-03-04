# Corevanta – Theme & Branding

Corevanta uses a **three-color palette** that works together for contrast and clarity:

| Color | Hex | Use |
|-------|-----|-----|
| **White** | `#ffffff` | Light backgrounds, text on dark areas, cards. Keeps the UI clear. |
| **Navy** | `#083554` | Primary dark: sidebar, headers, dark-mode backgrounds. Strong and professional. |
| **Accent blue** | `#11278C` | Buttons, links, focus states, CTAs. Pops on both white and navy. |

**Do these colors make sense together?** Yes. Navy and accent blue are in the same hue family (blue) but different in value and saturation, so they feel cohesive. White gives strong contrast for text and surfaces. The accent is noticeably brighter than the navy, so it reads as “action” without clashing.

## Where colors are defined

1. **Single source**: **`src/config/theme.js`**  
   All Corevanta colors and variants (e.g. `navyLight`, `accentLight`) live here. ThemeContext and Tailwind are aligned with this file.

2. **CSS variables (dark/light mode)**: **`src/context/ThemeContext.jsx`**  
   `getThemeCSSVariables()` applies the palette to `--bg-*`, `--text-*`, `--accent-*`, `--gradient-*`, etc. It reads from `theme.js`.

3. **Tailwind**: **`tailwind.config.js`**  
   The `hub-*` namespace uses the Corevanta palette (e.g. `bg-hub-primary` = navy, `bg-hub-accent-primary` = #11278C). Use classes like `bg-hub-primary`, `text-hub-accent-primary`, `bg-hub-gradient`.

## Changing colors later

Edit **`src/config/theme.js`** and adjust the hex values. Keep the same structure so ThemeContext and Tailwind stay in sync. Then update `tailwind.config.js` if you add or rename keys.

## Logo & favicon

- Add your logo as **`public/logo.png`**.
- Replace **`public/favicon.ico`** for the browser tab icon.
