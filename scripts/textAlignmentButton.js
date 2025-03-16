"use strict";
(async () => {
    const buttonStyles = {
        width: "36px",
        height: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: "solid 1px #b4b4b450",
        borderRadius: "50%",
        backgroundColor: "transparent",
    };
    const formatAlignRightIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#b4b4b4"><path d="M144-744v-72h672v72H144Zm192 150v-72h480v72H336ZM144-444v-72h672v72H144Zm192 150v-72h480v72H336ZM144-144v-72h672v72H144Z"/></svg>`;
    const formatAlignLeftIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#b4b4b4"><path d="M144-144v-72h672v72H144Zm0-150v-72h480v72H144Zm0-150v-72h672v72H144Zm0-150v-72h480v72H144Zm0-150v-72h672v72H144Z"/></svg>`;
    const alignRightText = chrome.i18n.getMessage("alignRight");
    const alignLeftText = chrome.i18n.getMessage("alignLeft");
    try {
        function getComposerBackgroundElement() {
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    const composerBackgroundElement = document.getElementById("composer-background");
                    if (composerBackgroundElement) {
                        clearInterval(interval);
                        resolve(composerBackgroundElement);
                    }
                }, 500);
            });
        }
        async function getAlignState() {
            try {
                const result = await chrome.storage.sync.get("alignState");
                if (result.alignState) {
                    return result.alignState;
                }
                else {
                    await chrome.storage.sync.set({ alignState: "left" });
                    return "left";
                }
            }
            catch (error) {
                console.error(error);
                return "left";
            }
        }
        let alignState = await getAlignState();
        const composerBackgroundElement = await getComposerBackgroundElement();
        const promptTextarea = composerBackgroundElement.querySelector("#prompt-textarea");
        promptTextarea.style.direction = alignState === "left" ? "ltr" : "rtl";
        promptTextarea.style.textAlign = alignState === "left" ? "left" : "right";
        const textareaMenu = composerBackgroundElement.querySelector(".justify-between .text-token-text-primary");
        let alignIconBtn = null;
        if (textareaMenu) {
            alignIconBtn = textareaMenu.querySelector("#align-icon-btn");
            if (!alignIconBtn) {
                addAlignButton(textareaMenu);
            }
        }
        async function toggleAlignment(alignIconBtn) {
            promptTextarea.removeEventListener("input", handleInputEvent);
            alignState = alignState === "left" ? "right" : "left";
            const newTitle = alignState === "left" ? alignRightText : alignLeftText;
            const newSvg = alignState === "left" ? formatAlignRightIcon : formatAlignLeftIcon;
            alignIconBtn.setAttribute("title", newTitle);
            alignIconBtn.innerHTML = newSvg;
            promptTextarea.style.direction = alignState === "left" ? "ltr" : "rtl";
            promptTextarea.style.textAlign = alignState === "left" ? "left" : "right";
            try {
                await chrome.storage.sync.set({ alignState: alignState });
            }
            catch (error) {
                console.error(error);
            }
        }
        function addAlignButton(textareaMenu) {
            alignIconBtn = document.createElement("div");
            alignIconBtn.id = "align-icon-btn";
            alignIconBtn.innerHTML =
                alignState === "left" ? formatAlignRightIcon : formatAlignLeftIcon;
            Object.assign(alignIconBtn.style, buttonStyles);
            alignIconBtn.setAttribute("title", alignState === "left" ? alignRightText : alignLeftText);
            textareaMenu.prepend(alignIconBtn);
            alignIconBtn.addEventListener("mouseover", () => {
                alignIconBtn.style.backgroundColor = "#424242";
            });
            alignIconBtn.addEventListener("mouseout", () => {
                alignIconBtn.style.backgroundColor = "transparent";
            });
            alignIconBtn.addEventListener("click", async () => {
                await toggleAlignment(alignIconBtn);
            });
        }
        function detectDirectionFromChar(char) {
            // Hebrew characters
            const HeRegex = /[\u0590-\u05FF]/;
            // Arabic characters
            const arRegex = /[\u0600-\u06FF]/;
            // Persian characters
            const faRegex = /[\u0750-\u077F]/;
            return HeRegex.test(char) || arRegex.test(char) || faRegex.test(char)
                ? "rtl"
                : "ltr";
        }
        async function setAlignment(newAlign) {
            alignState = newAlign;
            promptTextarea.style.direction = alignState === "left" ? "ltr" : "rtl";
            promptTextarea.style.textAlign = alignState === "left" ? "left" : "right";
            if (alignIconBtn) {
                alignIconBtn.setAttribute("title", alignState === "left" ? alignRightText : alignLeftText);
                alignIconBtn.innerHTML =
                    alignState === "left" ? formatAlignRightIcon : formatAlignLeftIcon;
            }
            try {
                await chrome.storage.sync.set({ alignState: alignState });
            }
            catch (error) {
                console.error(error);
            }
        }
        async function handleInputEvent(e) {
            let contentElement;
            if (e.target.tagName === "P") {
                contentElement = e.target;
            }
            else {
                contentElement = promptTextarea.querySelector("p");
            }
            if (contentElement) {
                const text = contentElement.innerText;
                if (text.trim().length > 0) {
                    const firstChar = text.trim().charAt(0);
                    const detectedDirection = detectDirectionFromChar(firstChar);
                    if (detectedDirection === "rtl") {
                        await setAlignment("right");
                    }
                    else if (detectedDirection === "ltr") {
                        await setAlignment("left");
                    }
                }
            }
        }
        promptTextarea.addEventListener("input", handleInputEvent);
        // const observer = new MutationObserver((mutations) => {
        //   let hasChanged = false;
        //   mutations.forEach(async (mutation) => {
        //     if (
        //       mutation.type === "childList" ||
        //       mutation.type === "characterData"
        //     ) {
        //       const paragraphs = promptTextarea.querySelectorAll("p");
        //       console.log("paragraphs:", paragraphs);
        //       paragraphs.forEach((contentElement) => {
        //         const text = contentElement.innerText.trim();
        //         if (text.length > 0) {
        //           console.log("text:", text);
        //           const firstChar = text.charAt(0);
        //           const detectedDirection = detectDirectionFromChar(firstChar);
        //           console.log("detectedDirection:", detectedDirection);
        //           const newDirection = detectedDirection;
        //           const newAlign = detectedDirection === "rtl" ? "right" : "left";
        //           // Check if the direction or alignment has changed
        //           if (
        //             contentElement.style.direction !== newDirection ||
        //             contentElement.style.textAlign !== newAlign
        //           ) {
        //             // Set the new direction and alignment
        //             console.log(contentElement.style.direction, newDirection);
        //             console.log(contentElement.style.textAlign, newAlign);
        //             contentElement.setAttribute("style", `direction: ${newDirection}; text-align: ${newAlign};`);
        //             contentElement.style.textAlign = newAlign;
        //             //
        //             hasChanged = true;
        //           }
        //         }
        //       });
        //       // Prevent infinite loop
        //       if (hasChanged) {
        //         hasChanged = false;
        //         observer.disconnect();
        //         setTimeout(
        //           () =>
        //             observer.observe(promptTextarea, {
        //               childList: true,
        //               subtree: true,
        //               characterData: true,
        //             }),
        //           0
        //         );
        //       }
        //     }
        //   });
        // });
        // // הפעלת המעקב
        // observer.observe(promptTextarea, {
        //   childList: true,
        //   subtree: true,
        //   characterData: true,
        // });
        // document.addEventListener("keydown", async (e) => {
        //   if (e.shiftKey && e.altKey && !e.repeat) {
        //     console.log("Shift+Alt pressed");
        //     await toggleAlignment();
        //   }
        // });
    }
    catch (error) {
        console.error(error);
    }
})();
