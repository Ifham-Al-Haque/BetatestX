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

const MAKES = [
  'MERCEDES-BENZ', 'MERCEDES BENZ', 'ROLLS-ROYCE', 'ROLLS ROYCE', 'LAND ROVER',
  'RANGE ROVER', 'ASTON MARTIN', 'GREAT WALL', 'ALFA ROMEO',
  'TOYOTA', 'NISSAN', 'MITSUBISHI', 'HYUNDAI', 'KIA', 'HONDA', 'MAZDA',
  'CHEVROLET', 'FORD', 'BMW', 'MERCEDES', 'LEXUS', 'GMC', 'ISUZU', 'SUZUKI',
  'VOLKSWAGEN', 'VW', 'JEEP', 'AUDI', 'PORSCHE', 'VOLVO', 'MG', 'GEELY',
  'CHANGAN', 'HAVAL', 'BYD', 'TESLA', 'INFINITI', 'CADILLAC', 'DODGE',
  'MINI', 'PEUGEOT', 'RENAULT', 'FIAT', 'SKODA', 'SEAT', 'GENESIS', 'JAC',
  'FOTON', 'MAXUS', 'CHERY', 'CITROEN', 'OPEL', 'JAGUAR', 'BENTLEY',
  'LAMBORGHINI', 'FERRARI', 'MASERATI', 'SUBARU', 'DAIHATSU',
].sort((a, b) => b.length - a.length);

let workerPromise = null;

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

function toIsoDate(raw) {
  if (!raw) return null;
  const text = String(raw).trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!dmy) return null;
  const day = dmy[1].padStart(2, '0');
  const month = dmy[2].padStart(2, '0');
  let year = dmy[3];
  if (year.length === 2) year = Number(year) > 50 ? `19${year}` : `20${year}`;
  const monthNum = Number(month);
  const dayNum = Number(day);
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) return null;
  return `${year}-${month}-${day}`;
}

function lineValue(line, labels) {
  const cleaned = line.replace(/[:：]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const label of labels) {
    const match = cleaned.match(new RegExp(`(?:^|\\b)${label}\\b\\s*(.+)`, 'i'));
    if (match) {
      return match[1].replace(/^[-–—.|]+/, '').trim();
    }
  }
  return '';
}

function firstLabeledValue(lines, labels) {
  for (const line of lines) {
    const value = lineValue(line, labels);
    if (value) return value;
  }
  return '';
}

function collectDates(text) {
  const found = [];
  const re = /(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/g;
  let match;
  while ((match = re.exec(text))) {
    const iso = toIsoDate(match[1]);
    if (iso) found.push({ iso, index: match.index, raw: match[1] });
  }
  return found;
}

function contextAround(text, index, span = 40) {
  return text.slice(Math.max(0, index - span), Math.min(text.length, index + span)).toLowerCase();
}

export function parseMulkiyaText(rawText, { kind = 'photo' } = {}) {
  const fields = Object.fromEntries(MULKIYA_SCAN_FIELDS.map((k) => [k, null]));
  const warnings = [];
  const text = String(rawText || '').replace(/\u0000/g, ' ');
  const upper = text.toUpperCase();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const vinMatch = upper.match(/\b[A-HJ-NPR-Z0-9]{17}\b/);
  if (vinMatch) fields.chassis_number = vinMatch[0];
  const labeledChassis = firstLabeledValue(lines, [
    'chassis no', 'chassis number', 'chassis', 'chs no', 'vin',
  ]);
  if (!fields.chassis_number && labeledChassis) {
    const compact = labeledChassis.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (compact.length >= 11) fields.chassis_number = compact.slice(0, 17);
  }

  const labeledEngine = firstLabeledValue(lines, [
    'engine no', 'engine number', 'eng no', 'engine',
  ]);
  if (labeledEngine) {
    const compact = labeledEngine.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (compact.length >= 5 && compact.length <= 20) fields.engine_number = compact;
  }

  const labeledPlate = firstLabeledValue(lines, [
    'plate no', 'plate number', 'traffic no', 'traffic number', 'plate',
  ]);
  if (labeledPlate) {
    const plate = labeledPlate.toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    if (plate && plate.length <= 12) fields.license_plate = plate;
  }
  if (!fields.license_plate) {
    const plateMatch = upper.match(/\b([A-Z]{1,3})\s*-?\s*(\d{2,6})\b/);
    if (plateMatch && plateMatch[0].replace(/\s/g, '').length <= 8) {
      fields.license_plate = `${plateMatch[1]} ${plateMatch[2]}`;
    }
  }

  const makeHit = MAKES.find((make) => upper.includes(make));
  if (makeHit) {
    const pretty = {
      VW: 'Volkswagen',
      BMW: 'BMW',
      GMC: 'GMC',
      MG: 'MG',
      BYD: 'BYD',
      JAC: 'JAC',
      'MERCEDES-BENZ': 'Mercedes-Benz',
      'MERCEDES BENZ': 'Mercedes-Benz',
      MERCEDES: 'Mercedes-Benz',
    };
    fields.make = pretty[makeHit] || makeHit.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    const idx = upper.indexOf(makeHit);
    const after = text.slice(idx + makeHit.length, idx + makeHit.length + 40).trim();
    const modelToken = after.split(/[\n,]/)[0].trim().split(/\s{2,}|\s(?=\d{4}\b)/)[0];
    const model = modelToken.replace(/[^A-Za-z0-9 \-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (model && model.length >= 2 && model.length <= 30 && !/^(NO|YEAR|MODEL|COLOR|COLOUR)$/i.test(model)) {
      fields.model = model;
    }
  }
  const labeledMake = firstLabeledValue(lines, ['make', 'manufacturer', 'trade mark']);
  if (!fields.make && labeledMake) fields.make = labeledMake.split(/\s{2,}/)[0].trim();
  const labeledModel = firstLabeledValue(lines, ['model', 'type']);
  if (!fields.model && labeledModel) fields.model = labeledModel.split(/\s{2,}/)[0].trim();

  const labeledYear = firstLabeledValue(lines, ['model year', 'year of make', 'year']);
  const yearFromLabel = labeledYear && labeledYear.match(/(19|20)\d{2}/);
  if (yearFromLabel) fields.year = yearFromLabel[0];
  if (!fields.year) {
    const years = [...upper.matchAll(/\b((?:19|20)\d{2})\b/g)].map((m) => m[1]);
    const now = new Date().getFullYear() + 1;
    const modelYears = years.filter((y) => Number(y) >= 1990 && Number(y) <= now);
    if (modelYears.length) fields.year = modelYears[0];
  }

  const owner = firstLabeledValue(lines, [
    'owner', 'owner name', 'registered owner', 'name of owner', 'name',
  ]);
  if (owner && owner.length >= 3 && owner.length <= 80 && !/^(UAE|DUBAI|SHARJAH)$/i.test(owner)) {
    fields.owned_by = owner.replace(/\s+/g, ' ').trim();
  }

  const tc = firstLabeledValue(lines, [
    'tc no', 't.c. no', 'traffic code', 'registration no', 'reg no', 'certificate no',
  ]);
  if (tc) {
    const compact = tc.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (compact.length >= 4) fields.mulkiya_number = compact.slice(0, 20);
  }

  const dates = collectDates(text);
  dates.forEach((d) => {
    const ctx = contextAround(text, d.index);
    if (!fields.insurance_expiry && /insur|takaful|تأمين/.test(ctx)) {
      fields.insurance_expiry = d.iso;
    } else if (!fields.registration_expiry && /expir|valid|renew|صالح|انتهاء/.test(ctx)) {
      fields.registration_expiry = d.iso;
    }
  });
  if (!fields.registration_expiry && dates.length) {
    const unique = [...new Set(dates.map((d) => d.iso))].sort();
    fields.registration_expiry = unique[unique.length - 1];
  }

  if (!fields.insurance_expiry) {
    warnings.push('Insurance expiry is usually on the insurance certificate, not the Mulkiya. Enter it if needed.');
  }
  const filled = MULKIYA_SCAN_FIELDS.filter((k) => k !== 'insurance_expiry' && fields[k]);
  if (filled.length < 2) {
    warnings.push(
      kind === 'pdf'
        ? 'Could not read much from this PDF. Try a clearer file, or a straight photo of the English side of the card.'
        : 'Could not read much from this photo. Use a straight, well-lit picture of the English side of the card.'
    );
  } else {
    warnings.push('Free on-device scan — please check every field before saving.');
  }

  return { fields, warnings };
}

const MAX_PDF_PAGES = 3;
const MIN_EMBEDDED_FIELDS = 2;

export function isPdfFile(file) {
  if (!file) return false;
  if (file.type === 'application/pdf') return true;
  return /\.pdf$/i.test(file.name || '');
}

function filledScanCount(fields) {
  return MULKIYA_SCAN_FIELDS.filter((key) => key !== 'insurance_expiry' && fields?.[key]).length;
}

async function renderPdfPageToCanvas(page) {
  const base = page.getViewport({ scale: 1 });
  const longest = Math.max(base.width, base.height) || 1;
  const scale = longest < 1100 ? Math.min(2.2, 1600 / longest) : Math.min(2, 1800 / longest);
  const viewport = page.getViewport({ scale });
  const rendered = document.createElement('canvas');
  rendered.width = Math.max(1, Math.round(viewport.width));
  rendered.height = Math.max(1, Math.round(viewport.height));
  const renderCtx = rendered.getContext('2d', { willReadFrequently: true });
  if (!renderCtx) throw new Error('Could not render that PDF page.');
  await page.render({ canvasContext: renderCtx, viewport }).promise;

  const canvas = document.createElement('canvas');
  canvas.width = rendered.width;
  canvas.height = rendered.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return rendered;
  ctx.filter = 'grayscale(100%) contrast(135%) brightness(108%)';
  ctx.drawImage(rendered, 0, 0);
  ctx.filter = 'none';
  return canvas;
}

async function preprocessForOcr(file) {
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const longest = Math.max(img.width, img.height);
  const scale = longest < 1100 ? Math.min(2.2, 1600 / longest) : Math.min(1, 1800 / longest);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not prepare the image for scanning.');
  ctx.filter = 'grayscale(100%) contrast(135%) brightness(108%)';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.filter = 'none';
  return canvas;
}

function isPasswordPdfError(error) {
  return error?.name === 'PasswordException' || /password/i.test(error?.message || '');
}

async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist/build/pdf.js');
  const lib = typeof pdfjs.getDocument === 'function' ? pdfjs : pdfjs.default;
  lib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.js`;
  return lib;
}

async function openPdfDocument(pdfjs, bytes) {
  try {
    return await pdfjs.getDocument({ data: bytes, disableWorker: true }).promise;
  } catch (error) {
    if (isPasswordPdfError(error)) {
      throw new Error('This PDF is password-protected. Unlock it, or attach a photo of the English side instead.');
    }
    if (error?.name === 'InvalidPDFException' || /invalid pdf/i.test(error?.message || '')) {
      throw new Error('That file does not look like a readable PDF. Try another export, or attach a photo of the English side.');
    }
    throw error;
  }
}

async function extractPdfPageText(page) {
  const content = await page.getTextContent();
  const items = Array.isArray(content?.items) ? content.items : [];
  return items
    .map((item) => (typeof item?.str === 'string' ? item.str : ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function recognizeCanvas(canvas) {
  const worker = await getWorker();
  const result = await worker.recognize(canvas);
  return result?.data?.text || '';
}

async function extractMulkiyaFromPdf(file) {
  const pdfjs = await loadPdfjs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  let pdf = null;
  try {
    pdf = await openPdfDocument(pdfjs, bytes);
    const pageCount = Math.min(pdf.numPages || 0, MAX_PDF_PAGES);
    if (!pageCount) throw new Error('That PDF has no pages to scan.');
    const extraPagesNote =
      pdf.numPages > MAX_PDF_PAGES
        ? `Only the first ${MAX_PDF_PAGES} pages were scanned.`
        : '';

    const embeddedParts = [];
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      embeddedParts.push(await extractPdfPageText(page));
    }
    const embeddedText = embeddedParts.filter(Boolean).join('\n');
    const fromEmbedded = parseMulkiyaText(embeddedText, { kind: 'pdf' });
    if (filledScanCount(fromEmbedded.fields) >= MIN_EMBEDDED_FIELDS) {
      return {
        ok: true,
        provider: 'pdfjs',
        fields: fromEmbedded.fields,
        warnings: extraPagesNote ? [extraPagesNote, ...fromEmbedded.warnings] : fromEmbedded.warnings,
        rawText: embeddedText,
      };
    }

    const ocrParts = [];
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const canvas = await renderPdfPageToCanvas(page);
      ocrParts.push(await recognizeCanvas(canvas));
    }
    const ocrText = ocrParts.filter(Boolean).join('\n');
    const parsed = parseMulkiyaText(ocrText, { kind: 'pdf' });
    return {
      ok: true,
      provider: 'tesseract-pdf',
      fields: parsed.fields,
      warnings: extraPagesNote ? [extraPagesNote, ...parsed.warnings] : parsed.warnings,
      rawText: ocrText,
    };
  } catch (error) {
    if (error?.message && /password-protected|no pages/i.test(error.message)) throw error;
    const detail = error?.message || '';
    if (isPasswordPdfError(error)) {
      throw new Error('This PDF is password-protected. Unlock it, or attach a photo of the English side instead.');
    }
    if (/Failed to fetch|NetworkError|Load failed/i.test(detail)) {
      throw new Error('First PDF scan needs a one-time download of the free PDF reader. Check your internet and try once more.');
    }
    throw new Error(detail || 'Could not read that Mulkiya PDF.');
  } finally {
    try {
      await pdf?.destroy?.();
    } catch {
      /* ignore */
    }
  }
}

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_pageseg_mode: '6',
        preserve_interword_spaces: '1',
      });
      return worker;
    })().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
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

/**
 * Free on-device read: PDF.js for digital PDFs, Tesseract OCR for photos and scanned PDFs.
 */
export async function extractMulkiyaFromFile(file) {
  if (!file) throw new Error('Attach a Mulkiya file first.');
  if (isPdfFile(file)) {
    return extractMulkiyaFromPdf(file);
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Scan needs a Mulkiya PDF or photo (JPG or PNG).');
  }

  const canvas = await preprocessForOcr(file);
  let text = '';
  try {
    text = await recognizeCanvas(canvas);
  } catch (error) {
    const detail = error?.message || '';
    if (/Failed to fetch|NetworkError|Load failed/i.test(detail)) {
      throw new Error('First scan needs a one-time download of the free OCR engine. Check your internet and try once more.');
    }
    throw new Error(detail || 'Could not read that Mulkiya photo.');
  }

  const { fields, warnings } = parseMulkiyaText(text);
  return { ok: true, provider: 'tesseract', fields, warnings, rawText: text };
}
