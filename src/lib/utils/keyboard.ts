import { browser } from '$app/environment';

export type ShortcutHandler = (event: KeyboardEvent) => void;

interface KeyboardShortcut {
  key: string;
  alt?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  description: string;
  handler: ShortcutHandler;
}

class KeyboardShortcutManager {
  private shortcuts: KeyboardShortcut[] = [];
  private listener: ((e: KeyboardEvent) => void) | null = null;
  private isActive = false;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  register(shortcut: KeyboardShortcut): void {
    this.shortcuts.push(shortcut);
  }

  unregister(key: string, modifiers?: { alt?: boolean; ctrl?: boolean; shift?: boolean }): void {
    this.shortcuts = this.shortcuts.filter(
      (s) => 
        !(s.key === key && 
          (!modifiers || 
            (s.alt === !!modifiers.alt && 
             s.ctrl === !!modifiers.ctrl && 
             s.shift === !!modifiers.shift)))
    );
  }

  activate(): void {
    if (browser && !this.isActive) {
      this.listener = this.handleKeyDown;
      document.addEventListener('keydown', this.listener);
      this.isActive = true;
    }
  }

  deactivate(): void {
    if (browser && this.isActive && this.listener) {
      document.removeEventListener('keydown', this.listener);
      this.isActive = false;
      this.listener = null;
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Skip if the target is an input element or textarea
    if (
      event.target instanceof HTMLInputElement || 
      event.target instanceof HTMLTextAreaElement ||
      (event.target instanceof HTMLElement && event.target.isContentEditable)
    ) {
      return;
    }

    for (const shortcut of this.shortcuts) {
      if (
        event.key === shortcut.key &&
        !!shortcut.alt === event.altKey &&
        !!shortcut.ctrl === event.ctrlKey &&
        !!shortcut.shift === event.shiftKey
      ) {
        event.preventDefault();
        shortcut.handler(event);
        break;
      }
    }
  }

  getShortcuts(): { key: string; modifiers: string; description: string }[] {
    return this.shortcuts.map((s) => ({
      key: s.key,
      modifiers: [
        s.ctrl ? 'Ctrl' : '',
        s.alt ? 'Alt' : '',
        s.shift ? 'Shift' : '',
      ].filter(Boolean).join('+'),
      description: s.description,
    }));
  }
}

export const keyboardManager = new KeyboardShortcutManager();

// Initialize default application shortcuts
export function initializeAppShortcuts() {
  if (browser) {
    keyboardManager.activate();
  }
}