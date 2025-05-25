import initContentScript from "@/components/pinChats/main";

const urlPatternStrings = ["https://chatgpt.com/*"];
const urlMatchPatterns = urlPatternStrings.map((p) => new MatchPattern(p));

export default defineContentScript({
  matches: urlPatternStrings,
  async main(ctx) {
    await initContentScript();

    ctx.addEventListener(window, "wxt:locationchange", async ({ newUrl }) => {
      if (urlMatchPatterns.some((pattern) => pattern.includes(newUrl))) {
        const pinnedContainer = document.querySelector(
          "#chatListContainer"
        ) as HTMLOListElement;
        if (!pinnedContainer) {
          await initContentScript();
        }
      }
    });
  },
});
