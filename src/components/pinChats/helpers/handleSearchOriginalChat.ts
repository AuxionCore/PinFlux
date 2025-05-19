// Handle search original chat button click
export default async function handleSearchOriginalChatButtonClick(
  sidebarElement: HTMLElement,
  urlId: string,
  isDarkMode: boolean
): Promise<void> {
  const scrollContainer = sidebarElement.parentElement;
  if (!scrollContainer) return;

  const findChatUrl = () =>
    sidebarElement.querySelector(`a[href="/c/${urlId}"]`);

  while (!findChatUrl()) {
    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: "smooth",
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  findChatUrl()?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  // Style the chat link for a few seconds
  const chatLink = findChatUrl() as HTMLAnchorElement;
  const chatLinkParent = chatLink.parentElement as HTMLLIElement;
  chatLinkParent.style.transition = "border 0.3s ease-in-out";
  chatLinkParent.style.borderColor = isDarkMode ? "#dedede" : "#000000";
  chatLinkParent.style.borderWidth = "1px";
  chatLinkParent.style.borderStyle = "solid";
  setTimeout(() => {
    chatLinkParent.style.borderColor = "transparent";
    chatLinkParent.style.borderWidth = "0px";
    chatLinkParent.style.borderStyle = "none";
  }, 3000);
}