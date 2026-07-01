interface ShareCardOptions {
  imageUrl: string;
  userName: string;
  userAvatarUrl?: string;
  caption: string;
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const generateShareCard = async (options: ShareCardOptions): Promise<Blob> => {
  const { imageUrl, userName, userAvatarUrl, caption } = options;

  const CARD_WIDTH = 1080;
  const CARD_HEIGHT = 1350; // 4:5 ratio, Instagram-friendly
  const PHOTO_HEIGHT = 1080;
  const FOOTER_HEIGHT = CARD_HEIGHT - PHOTO_HEIGHT;

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  // Background
  ctx.fillStyle = "#2D1B12"; // warm brown, matches brand
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Main post photo — cover-fit into the top section
  const postImg = await loadImage(imageUrl);
  const imgRatio = postImg.width / postImg.height;
  const targetRatio = CARD_WIDTH / PHOTO_HEIGHT;

  let drawWidth, drawHeight, offsetX, offsetY;
  if (imgRatio > targetRatio) {
    drawHeight = PHOTO_HEIGHT;
    drawWidth = postImg.width * (PHOTO_HEIGHT / postImg.height);
    offsetX = (CARD_WIDTH - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = CARD_WIDTH;
    drawHeight = postImg.height * (CARD_WIDTH / postImg.width);
    offsetX = 0;
    offsetY = (PHOTO_HEIGHT - drawHeight) / 2;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, CARD_WIDTH, PHOTO_HEIGHT);
  ctx.clip();
  ctx.drawImage(postImg, offsetX, offsetY, drawWidth, drawHeight);
  ctx.restore();

  // Footer panel background
  ctx.fillStyle = "#2D1B12";
  ctx.fillRect(0, PHOTO_HEIGHT, CARD_WIDTH, FOOTER_HEIGHT);

  const padding = 48;
  const avatarSize = 72;
  const avatarX = padding;
  const avatarY = PHOTO_HEIGHT + (FOOTER_HEIGHT - avatarSize) / 2 - 30;

  // Avatar circle (image or initials)
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (userAvatarUrl) {
    try {
      const avatarImg = await loadImage(userAvatarUrl);
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
    } catch {
      drawInitialsAvatar(ctx, userName, avatarX, avatarY, avatarSize);
    }
  } else {
    drawInitialsAvatar(ctx, userName, avatarX, avatarY, avatarSize);
  }
  ctx.restore();

  // Gold ring around avatar
  ctx.strokeStyle = "#D4A24C";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 2, 0, Math.PI * 2);
  ctx.stroke();

  // Username
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 36px Georgia, serif";
  ctx.textBaseline = "middle";
  ctx.fillText(userName, avatarX + avatarSize + 24, avatarY + avatarSize / 2);

  // Caption snippet
  const captionY = avatarY + avatarSize + 50;
  ctx.fillStyle = "#E8D9C5";
  ctx.font = "28px Arial, sans-serif";
  const truncatedCaption = caption.length > 70 ? caption.slice(0, 70) + "..." : caption;
  wrapText(ctx, truncatedCaption, padding, captionY, CARD_WIDTH - padding * 2, 36);

  // Ngala Africa logo/wordmark, bottom right
  ctx.fillStyle = "#D4A24C";
  ctx.font = "bold 32px Georgia, serif";
  ctx.textAlign = "right";
  ctx.fillText("Ngala Africa", CARD_WIDTH - padding, CARD_HEIGHT - padding);
  ctx.textAlign = "left";

  ctx.fillStyle = "#A89381";
  ctx.font = "20px Arial, sans-serif";
  ctx.fillText("Your Hair is Your Pride", padding, CARD_HEIGHT - padding);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not generate image"));
    }, "image/jpeg", 0.92);
  });
};

function drawInitialsAvatar(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  size: number
) {
  ctx.fillStyle = "#D4A24C";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "#2D1B12";
  ctx.font = `bold ${size * 0.45}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name[0]?.toUpperCase() || "?", x + size / 2, y + size / 2);
  ctx.textAlign = "left";
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
) {
  const words = text.split(" ");
  let line = "";
  let lineCount = 0;
  let currentY = y;

  for (const word of words) {
    const testLine = line + word + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== "") {
      ctx.fillText(line, x, currentY);
      line = word + " ";
      currentY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines) return;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}