/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 */

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if high contrast mode is preferred
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Check if dark color scheme is preferred
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Generate a unique ID for accessibility associations
 */
let idCounter = 0;
export function generateA11yId(prefix = 'a11y'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Announce a message to screen readers using aria-live region
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcer = document.getElementById('sr-announcer') || createAnnouncer();
  announcer.setAttribute('aria-live', priority);
  announcer.textContent = '';

  // Use setTimeout to ensure the change is detected
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
}

/**
 * Create a screen reader announcer element
 */
function createAnnouncer(): HTMLElement {
  const announcer = document.createElement('div');
  announcer.id = 'sr-announcer';
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  document.body.appendChild(announcer);
  return announcer;
}

/**
 * Trap focus within an element (for modals, dialogs)
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown);
  firstElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Get WCAG contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance of a color
 */
function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Check if contrast meets WCAG AA requirements
 * Normal text: 4.5:1, Large text: 3:1
 */
export function meetsContrastAA(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * ARIA live region helper for dynamic content
 */
export const liveRegion = {
  polite: (message: string) => announceToScreenReader(message, 'polite'),
  assertive: (message: string) => announceToScreenReader(message, 'assertive'),
};

/**
 * Common ARIA attributes for interactive elements
 */
export const ariaAttributes = {
  button: (label: string, expanded?: boolean) => ({
    role: 'button',
    'aria-label': label,
    ...(expanded !== undefined && { 'aria-expanded': expanded }),
    tabIndex: 0,
  }),

  menu: (label: string, open: boolean) => ({
    role: 'menu',
    'aria-label': label,
    'aria-hidden': !open,
  }),

  menuItem: () => ({
    role: 'menuitem',
    tabIndex: -1,
  }),

  dialog: (label: string, describedBy?: string) => ({
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': label,
    ...(describedBy && { 'aria-describedby': describedBy }),
  }),

  alert: (message: string) => ({
    role: 'alert',
    'aria-live': 'assertive',
    children: message,
  }),

  progressBar: (value: number, max = 100, label?: string) => ({
    role: 'progressbar',
    'aria-valuenow': value,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    ...(label && { 'aria-label': label }),
  }),

  tab: (selected: boolean, controls: string) => ({
    role: 'tab',
    'aria-selected': selected,
    'aria-controls': controls,
    tabIndex: selected ? 0 : -1,
  }),

  tabPanel: (labelledBy: string, hidden: boolean) => ({
    role: 'tabpanel',
    'aria-labelledby': labelledBy,
    hidden,
    tabIndex: 0,
  }),
};

/**
 * Keyboard navigation helpers
 */
export const keyboardNav = {
  isEnterOrSpace: (e: React.KeyboardEvent) =>
    e.key === 'Enter' || e.key === ' ',

  isEscape: (e: React.KeyboardEvent | KeyboardEvent) =>
    e.key === 'Escape',

  isArrowKey: (e: React.KeyboardEvent) =>
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key),

  handleListNavigation: (
    e: React.KeyboardEvent,
    currentIndex: number,
    items: HTMLElement[],
    orientation: 'horizontal' | 'vertical' = 'vertical'
  ): number => {
    const isVertical = orientation === 'vertical';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';

    if (e.key === prevKey) {
      e.preventDefault();
      const newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      items[newIndex]?.focus();
      return newIndex;
    }

    if (e.key === nextKey) {
      e.preventDefault();
      const newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[newIndex]?.focus();
      return newIndex;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
      return 0;
    }

    if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
      return items.length - 1;
    }

    return currentIndex;
  },
};
