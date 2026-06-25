/**
 * Export org chart viewport to PNG without extra dependencies.
 * Uses SVG foreignObject + canvas (works in modern browsers).
 */
export async function exportOrgChartAsPng(viewportEl, filename = 'udrive-org-chart.png') {
  if (!viewportEl) throw new Error('Nothing to export');

  const clone = viewportEl.cloneNode(true);
  const rect = viewportEl.getBoundingClientRect();

  clone.style.position = 'fixed';
  clone.style.left = '-99999px';
  clone.style.top = '0';
  clone.style.width = `${viewportEl.scrollWidth}px`;
  clone.style.height = `${viewportEl.scrollHeight}px`;
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.transform = 'none';
  clone.style.background = '#f8fafc';

  const canvasInner = clone.querySelector('.oc-canvas');
  if (canvasInner) {
    canvasInner.style.transform = 'none';
  }

  document.body.appendChild(clone);

  try {
    const w = viewportEl.scrollWidth;
    const h = viewportEl.scrollHeight;
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('xmlns', svgNs);

    const fo = document.createElementNS(svgNs, 'foreignObject');
    fo.setAttribute('width', '100%');
    fo.setAttribute('height', '100%');
    fo.appendChild(clone);
    svg.appendChild(fo);

    const svgString = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = w * 2;
    canvas.height = h * 2;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);

    URL.revokeObjectURL(url);

    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = pngUrl;
    link.click();
  } finally {
    if (clone.parentNode) clone.parentNode.removeChild(clone);
  }
}
