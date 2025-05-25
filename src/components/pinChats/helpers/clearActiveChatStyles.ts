export default function clearActiveChatStyles() {
  const allAnchorElements = document
    .querySelector("#chatListContainer")
    ?.querySelectorAll("a");
  for (const element of allAnchorElements || []) {
    element.removeAttribute("data-active");
  }
}
