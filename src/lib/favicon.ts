// Client-side favicon manager: square-crop + resize an uploaded image,
// store as data URL in localStorage, and apply to <link rel="icon">.

const STORAGE_KEY = "termii-favicon";
const SIZE = 256;

export const loadStoredFavicon = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const applyFavicon = (href: string) => {
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/png";
  link.href = href;
};

export const clearFavicon = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  applyFavicon("/favicon.png");
};

/**
 * Reads an uploaded image File, square-crops it from the center,
 * resizes to 256x256 PNG, persists it, and applies it to the page.
 */
export const generateFaviconFromFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
        try {
          const side = Math.min(img.width, img.height);
          const sx = (img.width - side) / 2;
          const sy = (img.height - side) / 2;

          const canvas = document.createElement("canvas");
          canvas.width = SIZE;
          canvas.height = SIZE;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas not supported");
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);

          const dataUrl = canvas.toDataURL("image/png");
          try {
            localStorage.setItem(STORAGE_KEY, dataUrl);
          } catch {
            /* quota — still apply for this session */
          }
          applyFavicon(dataUrl);
          resolve(dataUrl);
        } catch (e) {
          reject(e instanceof Error ? e : new Error("Failed to process image"));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

/** Apply any previously-saved favicon at app boot. */
export const initFavicon = () => {
  const stored = loadStoredFavicon();
  if (stored) applyFavicon(stored);
};
