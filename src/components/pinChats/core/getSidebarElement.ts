// Function to get the sidebar element
export default function getSidebarElement(): Promise<HTMLElement> {
  return new Promise<HTMLElement>((resolve, reject) => {
    const maxRetries = 20;
    let attempts = 0;

    const interval = setInterval(() => {
      const sidebarElement = document.querySelector(
        ".bg-token-sidebar-surface-primary"
      ) as HTMLElement | null;
      if (sidebarElement) {
        clearInterval(interval);
        resolve(sidebarElement);
      }

      attempts++;
      if (attempts >= maxRetries) {
        clearInterval(interval);
        reject(new Error("Sidebar element not fully ready"));
      }
    }, 200);
  });
}
