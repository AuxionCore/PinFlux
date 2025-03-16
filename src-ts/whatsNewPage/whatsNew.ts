import messages from "../messages";

const whatsNewTitle = messages["whatsNewTitle"];
const whatsNewMessage = messages["whatsNewMessage"];
const featuresTitle = messages["featuresTitle"];
const feature3 = messages["feature3"];
const feature3Comment = messages["feature3Comment"];
const feature4 = messages["feature4"];
const improvementsTitle = messages["improvementsTitle"];
const improvement1 = messages["improvement1"];
const improvement2 = messages["improvement2"];
const comingSoonTitle = messages["comingSoonTitle"];
const comingSoonFeature1 = messages["comingSoonFeature1"];
const feedbackTitle = messages["feedbackTitle"];
const feedbackMessage = messages["feedbackMessage"];
const feedbackButtonText = messages["feedbackButtonText"];

document.getElementById("title")!.textContent = whatsNewTitle;
document.getElementById("heading")!.textContent = whatsNewTitle;
document.getElementById("whatsNewMessage")!.textContent = whatsNewMessage;
document.getElementById("featuresTitle")!.textContent = featuresTitle;
document.getElementById("feature3")!.textContent = feature3;
document.getElementById("feature3Comment")!.textContent = feature3Comment;
document.getElementById("feature4")!.textContent = feature4;
document.getElementById("improvementsTitle")!.textContent = improvementsTitle;
document.getElementById("improvement1")!.textContent = improvement1;
document.getElementById("improvement2")!.textContent = improvement2;
document.getElementById("comingSoonTitle")!.textContent = comingSoonTitle;
document.getElementById("comingSoonFeature1")!.textContent = comingSoonFeature1;
document.getElementById("feedbackTitle")!.textContent = feedbackTitle;
document.getElementById("feedbackMessage")!.textContent = feedbackMessage;

const feedbackButton = document.getElementById("feedbackButton")!;
feedbackButton.textContent = feedbackButtonText;

feedbackButton.addEventListener("click", () => {
  chrome.tabs.create({
    url: "https://chromewebstore.google.com/detail/clhjaenclpjlpjickcmhebbhghjffhah/support",
  });
});
