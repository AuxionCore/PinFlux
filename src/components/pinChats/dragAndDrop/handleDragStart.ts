import createDraggableDisplay from "./createDraggableDisplay";

export default function handleDragStart(event: DragEvent): void {
  const target = event.target as HTMLAnchorElement;

  if (!target.id) {
    const pinnedChats = document.querySelector(
      "#chatListContainer"
    ) as HTMLDivElement;
    const pinnedChatsHeight = pinnedChats.offsetHeight;
    requestAnimationFrame(() => {
      if (pinnedChatsHeight < 70) {
        pinnedChats.style.height = "70px";
      }
    });
    const draggableDisplay = createDraggableDisplay("Drag here to pin");
    pinnedChats.appendChild(draggableDisplay);
    pinnedChats.style.transition = "height 0.3s";
    pinnedChats.style.borderStyle = "dashed";

    const chatLink = (event.target as HTMLElement)?.outerHTML || "";
    event.dataTransfer?.setData("text/plain", chatLink);
  } else {
    const chatLink = target.outerHTML || "";
    event.dataTransfer?.setData("text/plain", chatLink);
  }
}
