import { getSidebarClasses } from "@/components/pinChats/helpers/sidebarTheme";
import unpinButtonElm from "./unpinButton.html?raw";

// Function to create the unpin button
export default function UnpinButton(): HTMLDivElement {
  const unpinButton: HTMLDivElement = document.createElement("div");
  unpinButton.setAttribute("role", "menuitem");
  unpinButton.setAttribute("data-orientation", "vertical");
  unpinButton.setAttribute("data-pinflux-unpin-button", "true"); // Add tutorial identifier
  unpinButton.className = getSidebarClasses().menuItem;
  unpinButton.innerHTML = unpinButtonElm;

  // ChatGPT's own menu has a native "Pin" item now, so name ours explicitly
  const label = unpinButton.querySelector("[data-pinflux-label]");
  const text = browser.i18n.getMessage("unpinFromPinFlux");
  if (label && text) label.textContent = text;
  return unpinButton;
}
