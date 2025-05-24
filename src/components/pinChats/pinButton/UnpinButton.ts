import unpinButtonElm from "./unpinButton.html?raw";

// Function to create the unpin button
export default function UnpinButton(): HTMLDivElement {
  const unpinButton: HTMLDivElement = document.createElement("div");
  unpinButton.setAttribute("role", "menuitem");
  unpinButton.setAttribute("data-orientation", "vertical");
  unpinButton.className = "group __menu-item pe-8 gap-1.5";
  unpinButton.innerHTML = unpinButtonElm;
  return unpinButton;
}
