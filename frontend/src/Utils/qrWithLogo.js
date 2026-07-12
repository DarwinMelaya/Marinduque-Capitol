import QRCode from "qrcode";

const LOGO_SRC = "/img/logo.png";

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

/**
 * Generate a QR data URL with the Marinduque seal centered
 * and the transaction code printed below the QR.
 * Uses high error correction so the logo does not break scanning.
 */
export const generateQrWithLogo = async (
  text,
  {
    size = 512,
    margin = 2,
    dark = "#3f5168",
    light = "#ffffff",
    logoSrc = LOGO_SRC,
    /** Logo diameter as fraction of QR size (keep ~0.18–0.22 for scan reliability). */
    logoRatio = 0.22,
    /** Show transaction code under the QR (baked into the image). */
    showCodeLabel = true,
  } = {},
) => {
  const qrDataUrl = await QRCode.toDataURL(text, {
    width: size,
    margin,
    errorCorrectionLevel: "H",
    color: { dark, light },
  });

  const labelHeight = showCodeLabel ? Math.round(size * 0.16) : 0;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size + labelHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return qrDataUrl;
  }

  ctx.fillStyle = light;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const qrImage = await loadImage(qrDataUrl);
  ctx.drawImage(qrImage, 0, 0, size, size);

  try {
    const logo = await loadImage(logoSrc);
    const logoSize = Math.round(size * logoRatio);
    const pad = Math.round(logoSize * 0.12);
    const box = logoSize + pad * 2;
    const x = (size - box) / 2;
    const y = (size - box) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const radius = box / 2;

    // White circular cushion so logo modules stay readable
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, x + pad, y + pad, logoSize, logoSize);
    ctx.restore();
  } catch {
    // Fall back to plain QR if logo cannot load
  }

  if (showCodeLabel && text) {
    const fontSize = Math.max(18, Math.round(size * 0.055));
    ctx.fillStyle = dark;
    ctx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, size / 2, size + labelHeight / 2, size - 24);
  }

  return canvas.toDataURL("image/png");
};
