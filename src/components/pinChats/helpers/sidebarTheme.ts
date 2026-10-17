// Class sets for the markup we inject into ChatGPT's sidebar, one per ChatGPT
// generation. We ship no CSS for these — every class must already be used by
// ChatGPT itself, or it won't exist in their stylesheet. The 2026 set is taken
// from the native rows, section headers and menus of the Oct 2026 app shell;
// avoid its hashed classes (e.g. `itemBase-Uk8vyp`), which change per build.

export interface SidebarClasses {
  sectionExpanded: string
  sectionCollapsed: string
  headerButton: string
  headerContent: string
  headerTitle: string
  row: string
  rowTitleOuter: string
  rowTitleInner: string
  rowTrailingOuter: string
  rowTrailing: string
  trailingButton: string
  menu: string
  menuItem: string
}

// 2025 sidebar (`#history`, `__menu-item` components)
const LEGACY: SidebarClasses = {
  sectionExpanded:
    'group/sidebar-expando-section mb-[var(--sidebar-expanded-section-margin-bottom)]',
  sectionCollapsed:
    'group/sidebar-expando-section mb-[var(--sidebar-collapsed-section-margin-bottom)]',
  headerButton: 'group __menu-item hoverable',
  headerContent:
    'text-token-text-tertiary flex w-full items-center justify-start gap-0.5',
  headerTitle: '__menu-label',
  row: 'group __menu-item hoverable',
  rowTitleOuter: 'flex min-w-0 grow items-center gap-2.5',
  rowTitleInner: 'truncate',
  rowTrailingOuter: 'text-token-text-tertiary flex items-center self-stretch',
  rowTrailing: 'trailing highlight',
  trailingButton: '__menu-item-trailing-btn',
  menu: 'z-50 max-w-xs rounded-2xl popover bg-clip-padding bg-token-main-surface-primary shadow-lg will-change-[opacity,transform] radix-side-bottom:animate-slideUpAndFade radix-side-left:animate-slideRightAndFade radix-side-right:animate-slideLeftAndFade radix-side-top:animate-slideDownAndFade border hires:border-token-border-heavy py-1.5 border-thin max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto select-none',
  menuItem:
    'group __menu-item pe-8 gap-1.5 hover:bg-token-main-surface-secondary transition-colors duration-200 cursor-pointer',
}

// Oct 2026 app shell (`nav[aria-label="Chat history"]` with
// `data-sidebar-project-container-id` sections)
const APP_SHELL_2026: SidebarClasses = {
  sectionExpanded: 'relative px-row-x group/nav-section',
  sectionCollapsed: 'relative px-row-x group/nav-section',
  headerButton:
    'group/nav-section-title flex min-h-[var(--height-token-row)] items-center justify-between gap-2 ps-2 pe-1.5 cursor-interaction',
  headerContent:
    'flex min-w-0 flex-1 items-center gap-1 text-base font-medium text-tertiary',
  headerTitle: 'min-w-0 truncate',
  row: 'group relative flex items-center gap-2 cursor-interaction text-sm rounded-lg hover:bg-primary-ghost-hover data-[app-action-sidebar-thread-selected=true]:bg-primary-ghost-hover h-[var(--height-token-row)] sidebar-item py-row-y pe-row-y ps-[var(--padding-row-cell-x,var(--padding-row-x))]',
  rowTitleOuter: 'flex min-w-0 flex-1 items-center gap-2',
  rowTitleInner: 'min-w-0 flex-1 truncate text-base leading-5 text-default',
  rowTrailingOuter:
    'flex items-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 has-[[data-state=open]]:opacity-100',
  rowTrailing: 'flex items-center',
  trailingButton: 'flex items-center cursor-interaction rounded-lg',
  menu: 'z-50 m-px flex select-none flex-col overflow-y-auto bg-surface-elevated-secondary/90 text-default ring-(--color-border-overlay) ring-(length:--dropdown-overlay-ring-width) shadow-(--shadow-dropdown-overlay) backdrop-blur-sm rounded-2xl p-[var(--app-menu-gutter,var(--spacing))] min-w-[160px]',
  menuItem:
    'flex items-center gap-1.5 rounded-xl text-default cursor-interaction hover:bg-primary-ghost-hover h-[var(--height-token-row)] ps-2 pe-1.5',
}

export function isAppShell2026(): boolean {
  return !!document.querySelector(
    '[data-sidebar-project-container-id], [data-app-action-sidebar-scroll]'
  )
}

export function getSidebarClasses(): SidebarClasses {
  return isAppShell2026() ? APP_SHELL_2026 : LEGACY
}

// `data-active` drives the 2025 highlight; the 2026 row classes key off the
// same attribute ChatGPT sets on its own selected row
export function setChatActive(anchor: HTMLElement, active: boolean): void {
  if (active) {
    anchor.setAttribute('data-active', '')
    anchor.setAttribute('data-app-action-sidebar-thread-selected', 'true')
  } else {
    anchor.removeAttribute('data-active')
    anchor.removeAttribute('data-app-action-sidebar-thread-selected')
  }
}

/**
 * Makes one of our menu items look like the native items of the menu it is
 * injected into. The native classes are hashed per build, so they're read off
 * a live sibling rather than hardcoded. Radix only highlights its own items,
 * so hover is mirrored onto `data-highlighted` by hand.
 */
export function matchNativeMenuItem(item: HTMLElement, menu: Element): void {
  const native = menu.querySelector<HTMLElement>(
    '[role="menuitem"]:not([data-pinflux-pin-button]):not([data-pinflux-unpin-button])'
  )
  if (!native || !native.querySelector('[data-menu-row-content]')) return

  item.className = native.className
  const row = document.createElement('div')
  row.setAttribute('data-menu-row-content', 'true')
  row.className = 'flex w-full min-w-0 items-center gap-1.5'
  row.append(...Array.from(item.childNodes))
  item.append(row)

  item.addEventListener('mouseenter', () =>
    item.setAttribute('data-highlighted', '')
  )
  item.addEventListener('mouseleave', () =>
    item.removeAttribute('data-highlighted')
  )
}

/**
 * Closes a ChatGPT (Radix) menu the way a user would. Removing the node
 * ourselves pulls it out from under React, which can crash ChatGPT's next
 * render; Radix listens for Escape on the document and closes cleanly.
 */
export function closeNativeMenu(menu: Element | null | undefined): void {
  if (!menu?.isConnected) return
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
  )
}
