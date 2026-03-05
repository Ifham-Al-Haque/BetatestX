/**
 * VIN decoding via NHTSA vPIC API (free, no key required).
 * https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{vin}?format=json
 */
const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

function get(r, key) {
  const v = r && r[key];
  if (v === undefined || v === null) return '';
  const s = String(v).trim();
  return s;
}

/**
 * Decode VIN and return common fields for fleet vehicle form.
 * @param {string} vin - 17-character VIN (partial with * allowed by API)
 * @returns {Promise<{ make, model, year, engine_size, fuel_type, notes }>}
 */
export async function decodeVin(vin) {
  const cleaned = String(vin).trim().toUpperCase().replace(/\s/g, '');
  if (cleaned.length < 10) {
    throw new Error('VIN must be at least 10 characters (17 recommended)');
  }
  const url = `${NHTSA_BASE}/DecodeVinValues/${encodeURIComponent(cleaned)}?format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('VIN decode request failed');
  const json = await res.json();
  const r = json.Results && json.Results[0] ? json.Results[0] : {};
  const make = get(r, 'Make');
  const model = get(r, 'Model');
  const modelYear = get(r, 'ModelYear');
  const displacementL = get(r, 'DisplacementL');
  const cylinders = get(r, 'EngineCylinders');
  const fuelPrimary = get(r, 'FuelTypePrimary');
  const bodyClass = get(r, 'BodyClass');
  const vehicleType = get(r, 'VehicleType');

  let engine_size = displacementL ? `${displacementL}L` : '';
  if (cylinders && !engine_size) engine_size = `${cylinders} cyl`;

  const noteParts = [];
  if (bodyClass) noteParts.push(`Body: ${bodyClass}`);
  if (vehicleType) noteParts.push(`Type: ${vehicleType}`);
  const notes = noteParts.length ? noteParts.join('; ') : undefined;

  return {
    make,
    model,
    year: modelYear ? parseInt(modelYear, 10) : null,
    engine_size,
    fuel_type: fuelPrimary || '',
    notes,
  };
}

export default { decodeVin };
