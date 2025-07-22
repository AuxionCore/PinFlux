export function showTooltipOnce() {
  const tooltip = document.createElement("div");
  const tooltipTitle = document.createElement("strong");
  const tooltipBody = document.createElement("p");
  tooltipTitle.textContent = browser.i18n.getMessage(
    "pinShortcutNotificationTitle"
  );
  tooltipBody.textContent = browser.i18n.getMessage(
    "pinShortcutNotificationMessage",
    ["Alt+Shift+P"]
  );

  Object.assign(tooltip.style, {
    position: "fixed",
    bottom: "20px",
    left: "20px",
    backgroundColor: "#333",
    padding: "10px 15px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
    zIndex: "9999",
    maxWidth: "300px",
    lineHeight: "1.5",
  });

  Object.assign(tooltipTitle.style, {
    color: "#fff",
    fontSize: "16px",
    marginBottom: "5px",
  });

  Object.assign(tooltipBody.style, {
    color: "#ccc",
    fontSize: "14px",
    margin: "0",
  });

  tooltip.appendChild(tooltipTitle);
  tooltip.appendChild(tooltipBody);
  document.body.appendChild(tooltip);

  setTimeout(() => {
    tooltip.style.transition = "opacity 0.5s";
    tooltip.style.opacity = "0";
    setTimeout(() => tooltip.remove(), 500);
  }, 10000);
}

export function showPinShortcutTooltip() {
  const tooltip = document.createElement("div");
  const tooltipTitle = document.createElement("strong");
  const tooltipBody = document.createElement("p");
  tooltipTitle.textContent = browser.i18n.getMessage(
    "pinShortcutNotificationTitle"
  );
  tooltipBody.textContent = browser.i18n.getMessage(
    "pinShortcutNotificationMessage",
    ["Alt+Shift+P"]
  );

  Object.assign(tooltip.style, {
    position: "static",
    backgroundColor: "#333",
    margin: "10px auto",
    padding: "10px 15px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
    zIndex: "9999",
    maxWidth: "300px",
    lineHeight: "1.5",
  });

  Object.assign(tooltipTitle.style, {
    color: "#fff",
    fontSize: "16px",
    marginBottom: "5px",
  });

  Object.assign(tooltipBody.style, {
    color: "#ccc",
    fontSize: "14px",
    margin: "0",
  });

  tooltip.appendChild(tooltipTitle);
  tooltip.appendChild(tooltipBody);
  const toastContainer = document.getElementById("toastContainer");

  toastContainer?.appendChild(tooltip);

  // setTimeout(() => {
  //   tooltip.style.transition = "opacity 0.5s";
  //   tooltip.style.opacity = "0";
  //   setTimeout(() => tooltip.remove(), 500);
  // }, 10000);
}
