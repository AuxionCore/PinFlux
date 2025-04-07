chrome.runtime.onInstalled.addListener(async ({ reason, previousVersion }) => {
  // if (reason === "install") {
  //   chrome.tabs.create({
  //     url: "welcomePage/welcome.html",
  //   });
  // }

  if (reason === "update" && previousVersion === "1.0.0") {
    await chrome.storage.session.set({ runMigrationOnNextChatGPT: true });
  }

  if (reason === "update") {
    // chrome.tabs.create({
    //   url: "whatsNewPage/whatsNew.html",
    // });
  }
});

// Migrate saved chats from old storage structure in v1.0.0 to new one
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("chatgpt.com")) {
    const { runMigrationOnNextChatGPT } = await chrome.storage.session.get(
      "runMigrationOnNextChatGPT"
    );
    if (runMigrationOnNextChatGPT) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["scripts/helpers/migrateSavedChats.js"],
      });
      await chrome.storage.session.remove("runMigrationOnNextChatGPT");
    }
  }
});
