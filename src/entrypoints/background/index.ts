export default defineBackground({
  type: "module",
  main() {
    browser.commands.onCommand.addListener(async (command) => {
      if (command === "pin-current-chat") {
        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab || !tab.id || !tab.url) return;
        if (tab.url.includes("chatgpt.com/c")) {
          browser.tabs.sendMessage(tab.id, { action: "pin-current-chat" });
        }
      }
    });
  },
});
