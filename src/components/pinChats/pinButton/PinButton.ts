import { getSidebarClasses } from "@/components/pinChats/helpers/sidebarTheme";
import pinButtonElm from "./pinButton.html?raw";

// Function to create the pin button
export default function PinButton(): HTMLDivElement {
  const pinButton: HTMLDivElement = document.createElement("div");
  pinButton.setAttribute("role", "menuitem");
  pinButton.setAttribute("data-orientation", "vertical");
  pinButton.setAttribute("data-pinflux-pin-button", "true"); // Add tutorial identifier
  pinButton.className = getSidebarClasses().menuItem;
  pinButton.innerHTML = pinButtonElm;

  // ChatGPT's own menu has a native "Pin" item now, so name ours explicitly
  const label = pinButton.querySelector("[data-pinflux-label]");
  const text = browser.i18n.getMessage("pinToPinFlux");
  if (label && text) label.textContent = text;
  return pinButton;
}
