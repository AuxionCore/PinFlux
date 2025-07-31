/**
 * Array of message keys used for internationalization in the extension
 */
const messageKeys = [
  "welcomeTitle",
  "welcomeHeading", 
  "welcomeMessage",
  "GoToChatGpt",
  "whatsNewTitle",
  "whatsNewMessage",
  "featuresTitle",
  "improvementsTitle",
  "feature1",
  "feature2",
  "feature3",
  "feature3Comment",
  "feature4",
  "improvement1",
  "improvement2",
  "comingSoonTitle",
  "comingSoonMessage",
  "comingSoonFeature1",
  "feedbackTitle",
  "feedbackMessage",
  "feedbackButtonText",
];

/**
 * Object containing all localized messages for the extension
 * Maps message keys to their localized string values from browser.i18n
 */
const messages = messageKeys.reduce((acc, key) => {
  // @ts-ignore - Dynamic key access for i18n messages
  acc[key] = browser.i18n.getMessage(key);
  return acc;
}, {} as Record<string, string>);

export default messages;