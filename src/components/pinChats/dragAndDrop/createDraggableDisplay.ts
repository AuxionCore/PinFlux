import { isDarkMode } from "@/components/utils/styleScheme";

// Function to create a draggable display with text
export default function createDraggableDisplay(text: string): HTMLDivElement {
  const draggableDisplay: HTMLDivElement = document.createElement("div");
  const draggableDisplayText: HTMLSpanElement = document.createElement("span");

  draggableDisplayText.textContent = text;
  draggableDisplay.appendChild(draggableDisplayText);

  draggableDisplay.setAttribute("id", "draggableDisplay");
  draggableDisplayText.style.fontWeight = "500";
  draggableDisplay.style.position = "absolute";
  draggableDisplay.style.border = "2px dashed #dedede";
  draggableDisplay.style.borderRadius = "8px";
  draggableDisplay.style.top = "0";
  draggableDisplay.style.left = "0";
  draggableDisplay.style.zIndex = "1000";
  draggableDisplay.style.backgroundColor = isDarkMode
    ? "rgba(40, 40, 40, 95)"
    : "rgba(230, 230, 230, 95)";
  draggableDisplay.style.color = isDarkMode ? "#dedede" : "#000000";
  draggableDisplay.style.width = "100%";
  draggableDisplay.style.height = "100%";
  draggableDisplay.style.display = "flex";
  draggableDisplay.style.flexDirection = "column";
  draggableDisplay.style.alignItems = "center";
  draggableDisplay.style.justifyContent = "center";

  return draggableDisplay;
}
