/**
 * Gets the current style scheme (light or dark) from the document's computed styles
 * @returns The current color scheme as a string
 */
function getCurrentStyleScheme(): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue("color-scheme")
    .trim();
}

/**
 * Boolean flag indicating whether the current theme is dark mode
 */
const isDarkMode: boolean = getCurrentStyleScheme() === "dark";

export { isDarkMode };
