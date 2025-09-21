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
  manifest: ({ browser }) => {
    const isFirefox = browser === "firefox";

    const baseManifest: {
      name: string;
      description: string;
      default_locale: string;
      permissions: string[];
      commands: {
        [key: string]: {
          suggested_key: {
            default: string;
          };
          description: string;
        };
      };
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
      permissions: ["storage", "commands", "activeTab"],
      commands: {
        "pin-current-chat": {
          suggested_key: {
            default: "Alt+P",
          },
          description: "__MSG_pinCurrentChatCommand__",
        },
      },
    };

    if (isFirefox) {
      baseManifest.browser_specific_settings = {
        gecko: {
          id: "",
        },
      };
    }

    return baseManifest;
  },
});
