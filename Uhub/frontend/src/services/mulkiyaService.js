import { supabase } from '../supabaseClient';
import fleetService from './fleetService';
import fleetVehicleMediaService from './fleetVehicleMediaService';

function blankToNull(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function mapPgError(error) {
  const message = error?.message || '';
  if (error?.code === '23505') {
    if (message.includes('vehicle_number')) return 'That vehicle number is already in use.';
    if (message.includes('license_plate')) return 'That license plate is already in the fleet.';
    return 'This vehicle already exists (duplicate plate or vehicle number).';
  }
  if (error?.code === '42501' || /row-level security|permission/i.test(message)) {
    return 'You do not have permission to save Mulkiya. Ask an admin to check fleet_vehicles RLS.';
  }
  return message || 'Failed to save Mulkiya.';
}

export async function findVehicleByPlate(licensePlate) {
  const plate = blankToNull(licensePlate);
  if (!plate) return null;
  const { data, error } = await supabase
    .from('fleet_vehicles')
    .select('id, vehicle_number, license_plate, make, model')
    .eq('license_plate', plate)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function findVehicleByNumber(vehicleNumber) {
  const number = blankToNull(vehicleNumber);
  if (!number) return null;
  const { data, error } = await supabase
    .from('fleet_vehicles')
    .select('id, vehicle_number, license_plate, make, model')
    .eq('vehicle_number', number)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Create a new fleet vehicle or update an existing one with Mulkiya fields,
 * then store the uploaded PDF/image in fleet-assets.
 */
export async function saveManualMulkiya({ existingVehicleId, vehicle, file }) {
  const fields = {
    mulkiya_number: blankToNull(vehicle.mulkiya_number),
    registration_expiry: blankToNull(vehicle.registration_expiry),
    owned_by: blankToNull(vehicle.owned_by),
  };

  let saved;
  try {
    if (existingVehicleId) {
      const updates = { ...fields };
      const make = blankToNull(vehicle.make);
      const model = blankToNull(vehicle.model);
      if (make) updates.make = make;
      if (model) updates.model = model;
      if (vehicle.year) updates.year = parseInt(vehicle.year, 10);
      saved = await fleetService.updateVehicle(existingVehicleId, updates);
    } else {
      const duplicatePlate = await findVehicleByPlate(vehicle.license_plate);
      if (duplicatePlate) {
        throw new Error(
          `A fleet vehicle already uses plate ${duplicatePlate.license_plate}. Choose “Existing vehicle” and select it.`
        );
      }
      const duplicateNumber = await findVehicleByNumber(vehicle.vehicle_number);
      if (duplicateNumber) {
        throw new Error(
          `Vehicle number ${duplicateNumber.vehicle_number} is already in the fleet. Choose “Existing vehicle” or use a different number.`
        );
      }

      saved = await fleetService.createVehicle({
        vehicle_number: vehicle.vehicle_number.trim(),
        license_plate: vehicle.license_plate.trim(),
        make: vehicle.make.trim(),
        model: vehicle.model.trim(),
        year: parseInt(vehicle.year, 10) || new Date().getFullYear(),
        status: 'Active',
        fuel_type: vehicle.fuel_type || 'Petrol',
        transmission: vehicle.transmission || 'Automatic',
        mileage: 0,
        ...fields,
      });
    }
  } catch (error) {
    throw new Error(mapPgError(error));
  }

  if (file && saved?.id) {
    try {
      const doc = await fleetVehicleMediaService.addDocument(saved.id, {
        documentType: 'registration_card',
        documentName: 'Mulkiya (Registration card)',
        file,
      });
      if (doc?.file_url) {
        saved = await fleetService.updateVehicle(saved.id, {
          mulkiya_document_url: doc.file_url,
        });
      }
    } catch (uploadError) {
      const reason = uploadError?.message || 'Upload failed';
      throw new Error(
        `Vehicle saved, but the Mulkiya file could not be uploaded: ${reason}`
      );
    }
  }

  return saved;
}
