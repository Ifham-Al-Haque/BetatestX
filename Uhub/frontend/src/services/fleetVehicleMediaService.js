import { supabase } from '../supabaseClient';

const BUCKET = 'fleet-assets';

export const FLEET_DOCUMENT_TYPES = [
  { value: 'registration_card', label: 'Registration card (Mulkiya)' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'passing_certificate', label: 'Passing certificate' },
  { value: 'ownership', label: 'Ownership document' },
  { value: 'other', label: 'Other' },
];

/** Patterns matching seed/sample rows in SQL scripts */
export const SAMPLE_FLEET_PATTERNS = {
  vehicleNumberRegex: /^(FLEET-|FL-)/i,
  licensePlates: new Set(['ABC-123', 'XYZ-456', 'XYZ-789', 'DEF-456', 'GHI-789', 'JKL-012']),
};

export function isSampleFleetVehicle(vehicle) {
  if (!vehicle) return false;
  if (vehicle.vehicle_number && SAMPLE_FLEET_PATTERNS.vehicleNumberRegex.test(vehicle.vehicle_number)) {
    return true;
  }
  if (vehicle.license_plate && SAMPLE_FLEET_PATTERNS.licensePlates.has(vehicle.license_plate)) {
    return true;
  }
  return false;
}

class FleetVehicleMediaService {
  async getDocuments(vehicleId) {
    const { data, error } = await supabase
      .from('fleet_vehicle_documents')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') return [];
      throw error;
    }
    return data || [];
  }

  async uploadFile(vehicleId, file, subfolder = 'documents') {
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const filePath = `fleet/${vehicleId}/${subfolder}/${fileName}`;

    const { data, error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      if (error.message?.includes('not found') || error.message?.includes('Bucket')) {
        throw new Error(
          'Storage bucket "fleet-assets" is missing. Create a public bucket named fleet-assets in Supabase Storage, then run create_fleet_vehicle_media_schema.sql.'
        );
      }
      throw error;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return {
      path: data.path,
      publicUrl: urlData.publicUrl,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    };
  }

  async updateFleetImage(vehicleId, imageUrl) {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .update({ fleet_image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async uploadFleetPhoto(vehicleId, file) {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please choose an image file for the fleet photo.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image must be under 5 MB.');
    }
    const uploaded = await this.uploadFile(vehicleId, file, 'photo');
    return this.updateFleetImage(vehicleId, uploaded.publicUrl);
  }

  async addDocument(vehicleId, { documentType, documentName, file, notes, uploadedBy }) {
    const uploaded = await this.uploadFile(vehicleId, file, 'documents');
    const label =
      documentName ||
      FLEET_DOCUMENT_TYPES.find((t) => t.value === documentType)?.label ||
      file.name;

    const { data, error } = await supabase
      .from('fleet_vehicle_documents')
      .insert({
        vehicle_id: vehicleId,
        document_type: documentType || 'other',
        document_name: label,
        file_url: uploaded.publicUrl,
        file_name: uploaded.fileName,
        mime_type: uploaded.mimeType,
        file_size_bytes: uploaded.size,
        notes: notes || null,
        uploaded_by: uploadedBy || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDocument(documentId) {
    const { error } = await supabase.from('fleet_vehicle_documents').delete().eq('id', documentId);
    if (error) throw error;
    return true;
  }
}

const fleetVehicleMediaService = new FleetVehicleMediaService();
export default fleetVehicleMediaService;
