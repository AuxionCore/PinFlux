import messages from "../messages";

const welcomeTitle = messages["welcomeTitle"];
const welcomeMessage = messages["welcomeMessage"];
const GoToChatGptText = messages["GoToChatGpt"];
const featuresTitle = messages["featuresTitle"];
const feature1 = messages["feature1"];
const feature2 = messages["feature2"];
const feature3 = messages["feature3"];
const feature3Comment = messages["feature3Comment"];
const feature4 = messages["feature4"];
const feedbackTitle = messages["feedbackTitle"];
const feedbackMessage = messages["feedbackMessage"];
const feedbackButtonText = messages["feedbackButtonText"];

document.getElementById("title")!.textContent = welcomeTitle;
document.getElementById("heading")!.textContent = welcomeTitle;
document.getElementById("welcomeMessage")!.textContent = welcomeMessage;
document.getElementById("featuresTitle")!.textContent = featuresTitle;
document.getElementById("feature1")!.textContent = feature1;
document.getElementById("feature2")!.textContent = feature2;
document.getElementById("feature3")!.textContent = feature3;
document.getElementById("feature4")!.textContent = feature4;
document.getElementById("feature3Comment")!.textContent = feature3Comment;
document.getElementById("feedbackTitle")!.textContent = feedbackTitle;
document.getElementById("feedbackMessage")!.textContent = feedbackMessage;

const goToChatGptButton = document.getElementById("goToChatGptButton")!;
goToChatGptButton.textContent = GoToChatGptText;

console.log("goToChatGptButton", goToChatGptButton);
console.log("goToChatGptButton.textContent", goToChatGptButton.textContent);

goToChatGptButton.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://chatgpt.com/" });
});

const feedbackButton = document.getElementById("feedbackButton")!;
feedbackButton.textContent = feedbackButtonText;

feedbackButton.addEventListener("click", () => {
  chrome.tabs.create({
    url: "https://chromewebstore.google.com/detail/clhjaenclpjlpjickcmhebbhghjffhah/support",
  });
});
