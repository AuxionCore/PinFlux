import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  zip: {
    excludeSources: ["playwright-report/**", "e2e/**", "test-results/**"],
  },
  webExt: {
    disabled: true,
  },
  debug: true,
  manifest: ({ browser }) => {
    const isFirefox = browser === "firefox";
    const isChrome = browser === "chrome";

    const baseManifest: {
      name: string;
      description: string;
      default_locale: string;
      permissions: string[];
      browser_specific_settings?: {
        gecko: {
          id: string;
        };
      };
      key?: string;
    } = {
      name: "__MSG_extensionName__",
      description: "__MSG_extensionDescription__",
      default_locale: "en",
      permissions: ["storage"],
    };

    if (isFirefox) {
      baseManifest.browser_specific_settings = {
        gecko: {
          id: "",
        },
      };
    }

    if (isChrome) {
      baseManifest.key =
        "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsnIclzE8Zudy7C813EnUC1b0QR+xrTxah1HaALPJRgfg3gkxE6+z1dmGFkSotdwyeHg8Ey1HNBeokk/Cxnn6nJnj0TAtTtLiRppZFp6YEkrPYGhFerQkcjwrza//I9ZJI2fG9UpmFQHQWiUpOc4+JAd6jKLJqLk+3l3/Tg4Pto/nqss2N9q318xh5X3tKBuSBlje/zpxxCpbVU6b75wy3/kKXUOBpBkLXJ2Cy3akReuorIQErJJVmtls9XqrqSFBlQd4vMSkh0EZc67BzfI4sRwZ4b7nkmKmjZ4r87oHD++TxQIkGbjbwV5vmywk/0fKT0YPncEo+JeEpd6riOgaewIDAQAB";
    }

    return baseManifest;
  },
});
