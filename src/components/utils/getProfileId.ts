// Get the chatgpt user ID from local storage
export default async function getProfileId(): Promise<string> {
  return new Promise<string>((resolve) => {
    const interval = setInterval(() => {
      const prefix = "cache/user";
      const matchingKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith(prefix)
      );

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
