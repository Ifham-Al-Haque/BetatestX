import { supabase } from '../supabaseClient';

const BUCKET = 'expense-receipts';
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXT = /\.(pdf|jpe?g|png|webp)$/i;

export function validateExpenseReceiptFile(file) {
  if (!file) return null;
  if (file.size > MAX_SIZE_BYTES) {
    return 'Receipt must be under 10 MB.';
  }
  const typeOk = ALLOWED_MIME.has(file.type);
  const extOk = ALLOWED_EXT.test(file.name || '');
  if (!typeOk && !extOk) {
    return 'Receipt must be a PDF or image (JPG, PNG, WEBP).';
  }
  return null;
}

export async function uploadExpenseReceipt(userId, file) {
  const validationError = validateExpenseReceiptFile(file);
  if (validationError) throw new Error(validationError);
  if (!userId) throw new Error('User not authenticated');

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    if (error.message?.includes('Bucket') || error.message?.includes('not found')) {
      throw new Error(
        'Storage bucket "expense-receipts" is missing. Create a public bucket named expense-receipts in Supabase Storage.'
      );
    }
    throw error;
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return {
    receipt_url: urlData.publicUrl,
    receipt_file_name: file.name,
  };
}
