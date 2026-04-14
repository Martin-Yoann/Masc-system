export function adminAvatarDataUri(opts?: { text?: string; size?: number }) {
  const text = (opts?.text ?? "ADMIN").slice(0, 10);
  const size = opts?.size ?? 96;
  const bg = "#E33E33";
  const fg = "#FFFFFF";
  const fontSize = Math.round(size * 0.32);
  const safeText = text.replace(/[<>&"]/g, "");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#B80009"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#g)"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}" font-weight="700" fill="${fg}" letter-spacing="1">
    ${safeText}
  </text>
</svg>`;

  const encoded = encodeURIComponent(svg)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

