// Debug flag for drag-and-drop logging
// Set to true to enable detailed logging
export const DND_DEBUG = false;

export const dndLog = (...args: any[]) => {
  if (DND_DEBUG) {
    console.log('[DnD]', ...args);
  }
};

export const dndWarn = (...args: any[]) => {
  if (DND_DEBUG) {
    console.warn('[DnD]', ...args);
  }
};

export const dndError = (...args: any[]) => {
  // Always log errors
  console.error('[DnD]', ...args);
};

