export default async function getHistoryElement() {
  return new Promise<HTMLDivElement>((resolve) => {
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
