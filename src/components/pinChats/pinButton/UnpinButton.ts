import unpinButtonElm from "./unpinButton.html?raw";

// Function to create the unpin button
export default function UnpinButton(): HTMLDivElement {
  const unpinButton: HTMLDivElement = document.createElement("div");
  unpinButton.innerHTML = unpinButtonElm;
  return unpinButton;
}
