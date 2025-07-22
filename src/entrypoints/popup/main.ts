import { showPinShortcutTooltip } from "@/components/pinChats/helpers/showTooltipOnce";

const elements = {
  closePopup: "closePopup",
  errorToast: "errorToast",
  errorToastTitle: "errorToastTitle",
  errorToastMessage: "errorToastMessage",
  closeErrorToastButton: "closeErrorToastButton",
  newReleaseToast: "newReleaseToast",
  newReleaseToastTitle: "newReleaseToastTitle",
  newReleaseToastMessage: "newReleaseToastMessage",
  newReleaseToastLink: "newReleaseToastLink",
  closeNewReleaseToastButton: "closeNewReleaseToastButton",
  authorLink: "authorLink",
  buyMeACoffee: "buyMeACoffee",
  versionLink: "versionLink",
  feedbackLink: "feedbackLink",
  rateUsLink: "rateUsLink",
  rateUsLinkText: "rateUsLinkText",
};

async function popupScript() {
  try {
    const newReleaseTitle = browser.i18n.getMessage("newReleaseTitle");
    const versionNumber = browser.runtime.getManifest().version;
    const extensionWasUpdated = browser.i18n.getMessage("extensionWasUpdated", [
      versionNumber,
      `🎉`,
    ]);
    const storageData = await browser.storage.sync.get([
      "showWhatsNewToast",
      "showErrorToast",
    ]);
    const showWhatsNewToast = storageData?.showWhatsNewToast;
    const showErrorToast = storageData?.showErrorToast;

    async function setupPopup() {
      setClosePopupButton();
      setGeneralEventListeners();
      if (import.meta.env.CHROME) {
        setBrowserSpecificEventListeners();
        setFeedbackLink();
        setRateUsLinkText();
      }
      setVersion();
      if (showErrorToast) await setErrorToast();
      if (showWhatsNewToast) await setWhatsNewToast();
    }

    const notification = await browser.storage.sync.get(
      "showShortcutsNotification"
    );
    if (notification.showShortcutsNotification) {
      showPinShortcutTooltip();

      browser.storage.sync.set({
        showShortcutsNotification: false,
      });
    }

    async function setWhatsNewToast() {
      const newReleaseToast = document.getElementById(
        elements.newReleaseToast
      )!;
      const closeToastButton = document.getElementById(
        elements.closeNewReleaseToastButton
      )!;
      const newReleaseToastTitle = document.getElementById(
        elements.newReleaseToastTitle
      )!;
      const newReleaseToastMessage = document.getElementById(
        elements.newReleaseToastMessage
      )!;
      const newReleaseToastLink = document.getElementById(
        elements.newReleaseToastLink
      )!;

      newReleaseToastTitle.textContent = newReleaseTitle;
      newReleaseToastMessage.textContent = extensionWasUpdated;

      newReleaseToast.classList.add("show");
      newReleaseToastLink.addEventListener(
        "click",
        async () => await openTab("whatsNewPage.html")
      );

      closeToastButton.addEventListener("click", async () => {
        newReleaseToast.classList.remove("show");
        await browser.runtime.sendMessage({
          action: "closeToast",
          type: "whatsNew",
        });
      });
    }

    async function setErrorToast() {
      const errorToast = document.getElementById(elements.errorToast)!;
      const closeToastButton = document.getElementById(
        elements.closeErrorToastButton
      )!;
      const errorToastTitle = document.getElementById(
        elements.errorToastTitle
      )!;
      const errorToastMessage = document.getElementById(
        elements.errorToastMessage
      )!;
      const storageData = await browser.storage.sync.get("errorToastMessage");
      const errorToastMessageText = storageData.errorToastMessage;

      errorToastTitle.textContent =
        browser.i18n.getMessage("errorToastTitle") || "Error Alert";
      errorToastMessage.textContent = errorToastMessageText;

      errorToast.classList.add("show");
      closeToastButton.addEventListener("click", async () => {
        errorToast.classList.remove("show");
        await browser.runtime.sendMessage({
          action: "closeToast",
          type: "error",
        });
      });
    }

    function setClosePopupButton() {
      const closePopup = document.getElementById(elements.closePopup)!;
      closePopup.setAttribute(
        "title",
        browser.i18n.getMessage("popupCloseButton")
      );
      closePopup.addEventListener("click", () => window.close());
    }

    function setGeneralEventListeners() {
      const links = [
        { id: elements.authorLink, url: "https://github.com/Yedidya10" },
        {
          id: elements.buyMeACoffee,
          url: "https://ko-fi.com/yedidyadev",
        },
        {
          id: elements.versionLink,
          url: import.meta.env.CHROME
            ? `#`
            : import.meta.env.FIREFOX
            ? `https://addons.mozilla.org/en-US/firefox/addon/pinflux/versions/`
            : "#",
        },
      ];

      links.forEach((link) => {
        const element = document.getElementById(link.id)!;
        element.addEventListener("click", async () => {
          await openTab(link.url);
        });
      });
    }

    function setBrowserSpecificEventListeners() {
      const extensionId = browser.runtime.id;
      const links = [
        {
          id: elements.feedbackLink,
          url: import.meta.env.CHROME
            ? `https://chromewebstore.google.com/detail/pinflux-pin-chatgpt-chats/${extensionId}/support`
            : import.meta.env.FIREFOX
            ? `https://addons.mozilla.org/en-US/firefox/addon/rtlify-gpt/`
            : "",
        },
        {
          id: elements.rateUsLink,
          url: import.meta.env.CHROME
            ? `https://chromewebstore.google.com/detail/pinflux-pin-chatgpt-chats/${extensionId}/reviews`
            : import.meta.env.FIREFOX
            ? `https://addons.mozilla.org/en-US/firefox/addon/pinflux/`
            : "",
        },
      ];

      links.forEach((link) => {
        const element = document.getElementById(link.id)!;
        element.addEventListener("click", async () => {
          await openTab(link.url);
        });
      });
    }

    function setFeedbackLink() {
      const feedbackLink = document.getElementById(elements.feedbackLink)!;
      const feedbackText = browser.i18n.getMessage("feedbackTitle");
      const bagReportText = browser.i18n.getMessage("bugReportTitle");
      feedbackLink.title = `${feedbackText} / ${bagReportText}`;
    }

    function setVersion() {
      const versionElement = document.getElementById(elements.versionLink)!;
      versionElement.textContent = `v${versionNumber}`;
    }

    function setRateUsLinkText() {
      const rateUsLink = document.getElementById(elements.rateUsLink)!;
      const rateUsTitle = browser.i18n.getMessage("rateUsTitle", [
        import.meta.env.CHROME
          ? "Chrome"
          : import.meta.env.FIREFOX
          ? "Firefox"
          : "Browser",
      ]);
      rateUsLink.title = rateUsTitle;
    }

    async function openTab(url: string): Promise<void> {
      await browser.tabs.create({ url });
    }

    await setupPopup();
  } catch (error) {
    console.error("Error in popup script:", error);
  }
}
popupScript();
