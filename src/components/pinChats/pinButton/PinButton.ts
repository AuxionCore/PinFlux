import pinButtonElm from "./pinButton.html?raw";

// Function to create the pin button
export default function PinButton(): HTMLDivElement {
  const pinButton: HTMLDivElement = document.createElement("div");
  pinButton.innerHTML = pinButtonElm;
  return pinButton;
}
