export interface HotkeyConfig {
  brush: string;
  fill: string;
  undo: string;
  clear: string;
  swap: string;
}

export const DEFAULT_HOTKEYS: HotkeyConfig = {
  brush: 'B',
  fill: 'F',
  undo: 'U',
  clear: 'C',
  swap: 'S',
};

const STORAGE_KEY = 'skribbl_hotkeys';

export const getHotkeys = (): HotkeyConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        brush: (parsed.brush || DEFAULT_HOTKEYS.brush).toUpperCase(),
        fill: (parsed.fill || DEFAULT_HOTKEYS.fill).toUpperCase(),
        undo: (parsed.undo || DEFAULT_HOTKEYS.undo).toUpperCase(),
        clear: (parsed.clear || DEFAULT_HOTKEYS.clear).toUpperCase(),
        swap: (parsed.swap || DEFAULT_HOTKEYS.swap).toUpperCase(),
      };
    }
  } catch (e) {
    // fallback
  }
  return { ...DEFAULT_HOTKEYS };
};

export const saveHotkeys = (hotkeys: HotkeyConfig): void => {
  try {
    const sanitized: HotkeyConfig = {
      brush: (hotkeys.brush || DEFAULT_HOTKEYS.brush).toUpperCase(),
      fill: (hotkeys.fill || DEFAULT_HOTKEYS.fill).toUpperCase(),
      undo: (hotkeys.undo || DEFAULT_HOTKEYS.undo).toUpperCase(),
      clear: (hotkeys.clear || DEFAULT_HOTKEYS.clear).toUpperCase(),
      swap: (hotkeys.swap || DEFAULT_HOTKEYS.swap).toUpperCase(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new CustomEvent('skribbl_hotkeys_changed', { detail: sanitized }));
  } catch (e) {
    // fallback
  }
};
