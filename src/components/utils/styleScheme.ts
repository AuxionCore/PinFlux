function getCurrentStyleScheme(): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue("color-scheme")
    .trim();
}

const isDarkMode: boolean = getCurrentStyleScheme() === "dark";

export { isDarkMode };
