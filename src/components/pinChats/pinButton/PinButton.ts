import pinButtonElm from "./pinButton.html?raw";

// Function to create the pin button
export default function PinButton(): HTMLDivElement {
  const pinButton: HTMLDivElement = document.createElement("div");
  pinButton.setAttribute("role", "menuitem");
  pinButton.setAttribute("data-orientation", "vertical");
  pinButton.className = "group __menu-item pe-8 gap-1.5";
  pinButton.innerHTML = pinButtonElm;
  return pinButton;
}
