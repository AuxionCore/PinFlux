import { removePinChatFromStorage } from "../../utils/storage";

// Handle unpin chat button click
export default async function handleUnpinChatBottomClick(
  li: HTMLLIElement,
  profileId: string
): Promise<void> {
  try {
    const urlId = li.querySelector("a")?.getAttribute("id");
    if (!urlId || !profileId) {
      throw new Error("URL ID or Profile ID not found");
    }

    li.remove(); // Remove the pinned chat element from the DOM
    await removePinChatFromStorage(profileId, urlId);
  } catch (error) {
    console.error(error);
  }
}
