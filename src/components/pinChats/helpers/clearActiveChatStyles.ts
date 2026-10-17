import { setChatActive } from "./sidebarTheme";

export default function clearActiveChatStyles() {
  const allAnchorElements = document
    .querySelector("#chatListContainer")
    ?.querySelectorAll("a");
  for (const element of allAnchorElements || []) {
    setChatActive(element, false);
  }
}
