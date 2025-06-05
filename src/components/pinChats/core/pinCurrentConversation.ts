import handlePinChat from "./handlePinChat";

export default async function pinCurrentConversation() {
  await handlePinChat(
    window.location.pathname.split("/").pop() || "",
    document.querySelector("title")?.textContent || ""
  );
}
