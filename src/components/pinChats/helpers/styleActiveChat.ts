  export default function styleActiveChat(
    anchorRaper: HTMLDivElement,
    chatOptionsBtnRaper: HTMLDivElement
  ) {
    anchorRaper.className =
      "no-draggable group rounded-lg active:opacity-90 bg-[var(--sidebar-surface-tertiary)] h-9 text-sm screen-arch:bg-transparent relative";
    chatOptionsBtnRaper.className =
      "absolute top-0 bottom-0 inline-flex items-center gap-1.5 pe-2 ltr:end-0 rtl:start-0 flex";
  }