/**
 * Waits for and retrieves the chat history element from the DOM
 * @returns Promise that resolves to the history HTMLDivElement once it's available
 */
export default async function getHistoryElement() {
  return new Promise<HTMLDivElement>((resolve) => {
    // Poll the DOM every 100ms until the history element is found
    const interval = setInterval(() => {
      const historyElement = document.getElementById(
        "history"
      ) as HTMLDivElement;

      if (historyElement) {
        clearInterval(interval);
        resolve(historyElement);
      }
    }, 100);
  });
}
