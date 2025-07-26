import navMenuHtml from './navigation-menu.html?raw'

export function injectNavigationMenu(target: HTMLElement) {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = navMenuHtml.trim()

  const menu = wrapper.firstElementChild as HTMLElement
  if (!menu) return

  const trigger = menu.querySelector(
    '.chatgpt-nav-trigger'
  ) as HTMLButtonElement
  const content = menu.querySelector('.chatgpt-nav-content') as HTMLDivElement

  if (trigger && content) {
    trigger.addEventListener('click', () => {
      content.classList.toggle('show')
    })

    document.addEventListener('click', e => {
      if (!menu.contains(e.target as Node)) {
        content.classList.remove('show')
      }
    })
  }

  // הכנס לסביבת היעד (למשל nav או toolbar באתר)
  target.appendChild(menu)

  injectStylesOnce()
}

function injectStylesOnce() {
  if (document.querySelector('style[data-chatgpt-nav-style]')) return

  const style = document.createElement('style')
  style.setAttribute('data-chatgpt-nav-style', 'true')
  style.textContent = `
    .chatgpt-nav-menu {
      position: relative;
      display: inline-block;
      font-family: sans-serif;
    }

    .chatgpt-nav-trigger {
      padding: 0.4rem 0.8rem;
      background-color: #f3f3f3;
      border: 1px solid #ccc;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    .chatgpt-nav-content {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 0.5rem;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      min-width: 180px;
      padding: 0.5rem 0;
      display: none;
    }

    .chatgpt-nav-content.show {
      display: block;
    }

    .chatgpt-nav-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      color: black;
      text-decoration: none;
      font-size: 14px;
    }

    .chatgpt-nav-link:hover {
      background: #f0f0f0;
    }

    .chatgpt-icon {
      width: 1.2em;
    }
  `
  document.head.appendChild(style)
}
