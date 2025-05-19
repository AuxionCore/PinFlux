export default function clearActiveChatStyles() {
  const allLis = document
    .querySelector("ol#pinnedChats")
    ?.querySelectorAll("li");
  for (const li of allLis || []) {
    const liInsideRaper = li.querySelector("div");
    if (!liInsideRaper) continue;
    liInsideRaper.className =
      "no-draggable group rounded-lg active:opacity-90 hover:bg-[var(--sidebar-surface-secondary)] group-hover:bg-[var(--sidebar-surface-secondary)] h-9 text-sm screen-arch:bg-transparent relative";

    const btn = li.querySelector("button") as HTMLButtonElement;
    const chatOptionsBtnRaper = btn.parentElement as HTMLDivElement;
    if (chatOptionsBtnRaper) {
      chatOptionsBtnRaper.className =
        "absolute top-0 bottom-0 inline-flex items-center gap-1.5 pe-2 ltr:end-0 rtl:start-0 can-hover:not-group-hover:opacity-0 group-focus-within:opacity-100! group-hover:opacity-100! group-focus:opacity-100! focus-within:opacity-100! focus:opacity-100!";
    }
  }
}
