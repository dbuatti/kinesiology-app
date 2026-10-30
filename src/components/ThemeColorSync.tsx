import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Keeps the browser chrome in step with the app's own theme.
 *
 * `index.html` ships two media-queried `theme-color` metas so the OS choice is
 * honoured before React hydrates. Once the theme is known we overwrite both
 * with the active canvas colour — otherwise an in-app toggle (which can differ
 * from the OS setting) leaves a light status bar over a dark page.
 */
const THEME_COLORS = {
  light: "#F8FAFC",
  dark: "#0B1218",
} as const;

const ThemeColorSync = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const color = THEME_COLORS[resolvedTheme === "dark" ? "dark" : "light"];
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute("content", color));
  }, [resolvedTheme]);

  return null;
};

export default ThemeColorSync;
