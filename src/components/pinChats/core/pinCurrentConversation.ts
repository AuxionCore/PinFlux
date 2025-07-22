import handlePinChat from "./handlePinChat";

export default async function pinCurrentConversation() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const path = window.location.pathname.replace(/\/+$/, "");
  const conversationId = path.split("/").pop() || "";
  const title = document.querySelector("title")?.textContent || "";

  try {
    await handlePinChat(conversationId, title);
  } catch (error) {
    console.error("Failed to pin conversation:", error);
  }
}