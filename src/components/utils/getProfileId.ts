/**
 * Retrieves the ChatGPT user ID from local storage by searching for cached user data
 * @returns Promise that resolves to the user's profile ID string
 */
export default async function getProfileId(): Promise<string> {
  return new Promise<string>((resolve) => {
    // Poll local storage every 100ms until we find the user cache
    const interval = setInterval(() => {
      const prefix = "cache/user";
      const matchingKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith(prefix)
      );

      // Extract the user ID from the cache key using regex
      for (const key of matchingKeys) {
        const regex = /cache\/user-([a-zA-Z0-9]+)/;
        const match = key.match(regex);
        if (match) {
          clearInterval(interval);
          resolve(match[1] as string);
        }
      }
    }, 100);
  });
}
