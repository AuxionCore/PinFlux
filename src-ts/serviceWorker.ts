chrome.runtime.onInstalled.addListener(async ({ reason, previousVersion }) => {
  // if (reason === "install") {
  //   chrome.tabs.create({
  //     url: "welcomePage/welcome.html",
  //   });
  // }

  if (reason === "update" && previousVersion === "1.0.0") {
    // Migrate saved chats from old storage structure to new one
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
      if (
        changeInfo.status === "complete" &&
        changeInfo.url &&
        changeInfo.url.includes("chatgpt.com")
      ) {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["scripts/helpers/migrateSavedChats.js"],
        });
      }
    });
  }

  if (reason === "update") {
    // chrome.tabs.create({
    //   url: "whatsNewPage/whatsNew.html",
    // });
  }
});
