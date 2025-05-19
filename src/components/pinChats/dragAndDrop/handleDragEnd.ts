export default function handleDragEnd(): void {
  const pinnedChats = document.querySelector(
    "#chatListContainer"
  ) as HTMLDivElement;

  pinnedChats.style.height = "auto";
  pinnedChats.style.transition = "height 0.3s";
  pinnedChats.style.borderStyle = "none";
  pinnedChats.style.backgroundColor = "transparent";

  const draggableDisplay = document.querySelector(
    "#draggableDisplay"
  ) as HTMLDivElement;
  if (draggableDisplay) {
    draggableDisplay.remove();
  }
}
