/** Export a Recharts container (by DOM id) as a PNG download. */
export async function downloadChartPng(containerId, fileName) {
  try {
    const container = document.getElementById(containerId);
    if (!container) return false;

    const svg = container.querySelector('svg');
    if (!svg) return false;

    const cloned = svg.cloneNode(true);
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    cloned.setAttribute('width', String(width));
    cloned.setAttribute('height', String(height));

    const serialized = new XMLSerializer().serializeToString(cloned);
    const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = blobUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.scale(2, 2);
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#0f1419' : '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(blobUrl);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${fileName}.png`;
    a.click();
    return true;
  } catch (error) {
    console.error('Chart export failed:', error);
    return false;
  }
}
