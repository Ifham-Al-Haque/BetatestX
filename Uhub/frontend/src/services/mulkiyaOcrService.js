import { supabase } from '../supabaseClient';

const SCAN_MAX_EDGE = 3.8 * 1024 * 1024;

export const MULKIYA_SCAN_FIELDS = [
  'license_plate',
  'make',
  'model',
  'year',
  'owned_by',
  'registration_expiry',
  'insurance_expiry',
  'engine_number',
  'chassis_number',
  'mulkiya_number',
];

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not open that image for scanning.'));
    img.src = url;
  });
}

async function compressImage(file) {
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const maxEdge = 1600;
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare the image for scanning.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const jpeg = canvas.toDataURL('image/jpeg', 0.82);
  const base64 = jpeg.replace(/^data:[^;]+;base64,/, '');
  const bytes = Math.ceil((base64.length * 3) / 4);
  if (bytes > SCAN_MAX_EDGE) {
    const smaller = canvas.toDataURL('image/jpeg', 0.65);
    return { mimeType: 'image/jpeg', base64: smaller.replace(/^data:[^;]+;base64,/, '') };
  }
  return { mimeType: 'image/jpeg', base64 };
}

export async function prepareMulkiyaScanPayload(file) {
  if (!file) throw new Error('Attach a Mulkiya file first.');
  if (file.type === 'application/pdf') {
    if (file.size > SCAN_MAX_EDGE) {
      throw new Error('PDF is too large to scan. Attach a photo of the card (under 4 MB).');
    }
    const dataUrl = await readAsDataUrl(file);
    return {
      mimeType: 'application/pdf',
      base64: dataUrl.replace(/^data:[^;]+;base64,/, ''),
    };
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Scan needs a Mulkiya photo or PDF.');
  }
  try {
    return await compressImage(file);
  } catch {
    if (file.size > SCAN_MAX_EDGE) {
      throw new Error('Image is too large to scan. Try a clearer, smaller photo.');
    }
    const dataUrl = await readAsDataUrl(file);
    return {
      mimeType: file.type || 'image/jpeg',
      base64: dataUrl.replace(/^data:[^;]+;base64,/, ''),
    };
  }
}

export function applyMulkiyaScan(form, fields, { overwrite = false } = {}) {
  const next = { ...form };
  const filled = [];
  MULKIYA_SCAN_FIELDS.forEach((key) => {
    const value = fields?.[key];
    if (value == null || String(value).trim() === '') return;
    const current = String(next[key] ?? '').trim();
    if (!overwrite && current) return;
    next[key] = String(value).trim();
    filled.push(key);
  });
  return { form: next, filled };
}

export async function extractMulkiyaFromFile(file) {
  const payload = await prepareMulkiyaScanPayload(file);
  const { data, error } = await supabase.functions.invoke('extract-mulkiya', {
    body: payload,
  });
  if (data?.ok && data.fields) return data;
  const fromBody = data?.error;
  if (fromBody) throw new Error(fromBody);
  if (error) {
    const detail = error.message || 'Scan request failed.';
    if (/not found|404/i.test(detail)) {
      throw new Error('Mulkiya scan function is not deployed yet (extract-mulkiya).');
    }
    throw new Error(detail);
  }
  throw new Error('Could not read that Mulkiya.');
}
