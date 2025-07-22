export default defineBackground({
  type: "module",
  main() {
    browser.runtime.onInstalled.addListener(async (details) => {
      if (details.reason === "update" && details.previousVersion === "2.0.0") {
        try {
          await browser.storage.sync.set({ showShortcutsNotification: true });
          await browser.action.openPopup();
        } catch (error) {
          console.error("Failed to handle extension update:", error);
    browser.commands.onCommand.addListener(async (command) => {
      if (command === "pin-current-chat") {
        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab || !tab.id || !tab.url) return;
        
        try {
          const url = new URL(tab.url);
          if (url.hostname === "chatgpt.com" && url.pathname.startsWith("/c/")) {
            await browser.tabs.sendMessage(tab.id, { action: "pin-current-chat" });
          }
        } catch (error) {
          console.error("Failed to send pin-current-chat message:", error);
        }
      }
    });        }
      }
    });
  },
});
