/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#000000",
      "foreground": "#C7CDD6",
      "border": "#303840",
      "card": "#080808",
      "cardForeground": "#C7CDD6",
      "popover": "#0C0C0C",
      "popoverForeground": "#C7CDD6",
      "primary": "#1FA89C",
      "primaryForeground": "#000000",
      "secondary": "#111111",
      "secondaryForeground": "#C7CDD6",
      "muted": "#101010",
      "mutedForeground": "#9099A4",
      "accent": "#3FE0D0",
      "accentForeground": "#000000",
      "destructive": "#D05260",
      "destructiveForeground": "#000000",
      "input": "#48535D",
      "ring": "#3FE0D0",
      "chart1": "#3FE0D0",
      "chart2": "#1FA89C",
      "chart3": "#C7CDD6",
      "chart4": "#3FE0D0",
      "chart5": "#9B7E4D",
      "sidebar": "#050505",
      "sidebarForeground": "#C7CDD6",
      "sidebarBorder": "#303840",
      "sidebarPrimary": "#3FE0D0",
      "sidebarPrimaryForeground": "#000000",
      "sidebarAccent": "#151515",
      "sidebarAccentForeground": "#C7CDD6",
      "sidebarRing": "#3FE0D0"
    },
    "dark": {
      "background": "#000000",
      "foreground": "#C7CDD6",
      "border": "#303840",
      "card": "#080808",
      "cardForeground": "#C7CDD6",
      "popover": "#0C0C0C",
      "popoverForeground": "#C7CDD6",
      "primary": "#3FE0D0",
      "primaryForeground": "#000000",
      "secondary": "#111111",
      "secondaryForeground": "#C7CDD6",
      "muted": "#101010",
      "mutedForeground": "#9099A4",
      "accent": "#C7CDD6",
      "accentForeground": "#000000",
      "destructive": "#D05260",
      "destructiveForeground": "#000000",
      "input": "#48535D",
      "ring": "#3FE0D0",
      "chart1": "#3FE0D0",
      "chart2": "#1FA89C",
      "chart3": "#C7CDD6",
      "chart4": "#7A8DA1",
      "chart5": "#C19A5B",
      "sidebar": "#050505",
      "sidebarForeground": "#C7CDD6",
      "sidebarBorder": "#303840",
      "sidebarPrimary": "#3FE0D0",
      "sidebarPrimaryForeground": "#000000",
      "sidebarAccent": "#151515",
      "sidebarAccentForeground": "#C7CDD6",
      "sidebarRing": "#3FE0D0"
    }
  },
  "fontFamily": {
    "sans": [
      "Space Grotesk",
      "sans-serif"
    ],
    "serif": [
      "Playfair Display",
      "serif"
    ],
    "mono": [
      "Geist Mono",
      "monospace"
    ]
  },
  "radius": "0.375rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
