import React, { useState, useEffect } from 'react';
import {
  X, Save, Car, Search, Info, Settings2, FileSignature, ShieldCheck, StickyNote,
  Paperclip, FileText, Trash2,
} from 'lucide-react';
import fleetService from '../../services/fleetService';
import fleetVehicleMediaService from '../../services/fleetVehicleMediaService';
import { decodeVin } from '../../services/vinDecodeService';
import { BODY_TYPES, POWERTRAIN_TYPES, BUSINESS_TYPES } from '../../utils/fleetRecordUtils';

const MULKIYA_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MULKIYA_ACCEPT = 'application/pdf,image/*';

const EMPTY_FORM = {
  vehicle_number: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  license_plate: '',
  vin: '',
  color: '',
  fuel_type: 'Petrol',
  transmission: 'Manual',
  engine_size: '',
  mileage: 0,
  status: 'Active',
  owned_by: '',
  contract_number: '',
  contract_expiry: '',
  mulkiya_number: '',
  mulkiya_document_url: '',
  purchase_date: '',
  purchase_price: '',
  insurance_expiry: '',
  registration_expiry: '',
  last_service_date: '',
  next_service_date: '',
  fuel_efficiency: '',
  notes: '',
  car_name: '',
  body_type: '',
  powertrain_type: '',
  seat_count: '',
  fuel_tank_capacity_liters: '',
  business_type: '',
  iot_device_id: '',
};

const inputBase =
  'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

const Section = ({ icon: Icon, title, description, children }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
    {children}
  </div>
);

const Label = ({ children, required }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1.5">
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const VehicleModal = ({ isOpen, onClose, vehicle = null, onSuccess }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinError, setVinError] = useState('');
  const [errors, setErrors] = useState({});
  const [mulkiyaFile, setMulkiyaFile] = useState(null);
  const [mulkiyaError, setMulkiyaError] = useState('');

  const isEditMode = !!vehicle;

  useEffect(() => {
    if (!isOpen) return;
    if (vehicle) {
      setFormData({
        ...EMPTY_FORM,
        ...Object.fromEntries(
          Object.keys(EMPTY_FORM).map((k) => [k, vehicle[k] ?? EMPTY_FORM[k]])
        ),
        year: vehicle.year || new Date().getFullYear(),
        seat_count: vehicle.seat_count ?? '',
        fuel_tank_capacity_liters: vehicle.fuel_tank_capacity_liters ?? '',
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setErrors({});
    setVinError('');
    setMulkiyaFile(null);
    setMulkiyaError('');
  }, [isOpen, vehicle]);

  const handleMulkiyaSelect = (e) => {
    const file = e.target.files?.[0];
    setMulkiyaError('');
    if (!file) {
      setMulkiyaFile(null);
      return;
    }
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      setMulkiyaError('Please choose a PDF or image file.');
      setMulkiyaFile(null);
      return;
    }
    if (file.size > MULKIYA_MAX_BYTES) {
      setMulkiyaError('File must be under 10 MB.');
      setMulkiyaFile(null);
      return;
    }
    setMulkiyaFile(file);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.vehicle_number.trim()) newErrors.vehicle_number = 'Vehicle number is required';
    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Valid year is required';
    }
    if (!formData.license_plate.trim()) newErrors.license_plate = 'License plate is required';
    if (formData.vin && formData.vin.length !== 17) newErrors.vin = 'VIN must be 17 characters';
    if (formData.mileage < 0) newErrors.mileage = 'Mileage cannot be negative';
    if (formData.purchase_price && formData.purchase_price < 0) {
      newErrors.purchase_price = 'Purchase price cannot be negative';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDecodeVin = async () => {
    if (!formData.vin || formData.vin.trim().length < 10) {
      setVinError('Enter at least 10 characters to decode');
      return;
    }
    setVinDecoding(true);
    setVinError('');
    try {
      const decoded = await decodeVin(formData.vin);
      setFormData((prev) => ({
        ...prev,
        make: decoded.make || prev.make,
        model: decoded.model || prev.model,
        year: decoded.year || prev.year,
        engine_size: decoded.engine_size || prev.engine_size,
        fuel_type: decoded.fuel_type || prev.fuel_type,
        notes: decoded.notes ? (prev.notes ? `${prev.notes}; ${decoded.notes}` : decoded.notes) : prev.notes,
      }));
    } catch (err) {
      setVinError(err?.message || 'Decode failed');
    } finally {
      setVinDecoding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        seat_count:
          formData.seat_count === '' || formData.seat_count == null
            ? null
            : parseInt(formData.seat_count, 10),
        fuel_tank_capacity_liters:
          formData.fuel_tank_capacity_liters === '' || formData.fuel_tank_capacity_liters == null
            ? null
            : parseFloat(formData.fuel_tank_capacity_liters),
        car_name: formData.car_name?.trim() || null,
        body_type: formData.body_type || null,
        powertrain_type: formData.powertrain_type || null,
        business_type: formData.business_type || null,
        iot_device_id: formData.iot_device_id?.trim() || null,
        owned_by: formData.owned_by?.trim() || null,
        contract_number: formData.contract_number?.trim() || null,
        contract_expiry: formData.contract_expiry || null,
        mulkiya_number: formData.mulkiya_number?.trim() || null,
      };
      const saved = isEditMode
        ? await fleetService.updateVehicle(vehicle.id, payload)
        : await fleetService.createVehicle(payload);

      const savedId = saved?.id || vehicle?.id;
      if (mulkiyaFile && savedId) {
        try {
          const doc = await fleetVehicleMediaService.addDocument(savedId, {
            documentType: 'registration_card',
            documentName: 'Mulkiya (Registration card)',
            file: mulkiyaFile,
          });
          if (doc?.file_url) {
            await fleetService.updateVehicle(savedId, { mulkiya_document_url: doc.file_url });
          }
        } catch (uploadErr) {
          console.error('Mulkiya upload failed:', uploadErr);
          setErrors({ submit: `Vehicle saved, but the Mulkiya file could not be uploaded: ${uploadErr.message}` });
          setLoading(false);
          onSuccess();
          return;
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      setErrors({ submit: 'Failed to save vehicle. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
    setVinError('');
    setMulkiyaFile(null);
    setMulkiyaError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
              <p className="text-xs text-blue-100">
                {isEditMode ? 'Update the fleet record details' : 'Create a new fleet record'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Identity & status */}
          <Section icon={Info} title="Identity & status" description="How this vehicle is identified in the fleet">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Vehicle Number</Label>
                <input
                  type="text"
                  name="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={handleInputChange}
                  className={`${inputBase} ${errors.vehicle_number ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="e.g., UD-001"
                />
                {errors.vehicle_number && <p className="text-red-600 text-xs mt-1">{errors.vehicle_number}</p>}
              </div>
              <div>
                <Label required>License Plate</Label>
                <input
                  type="text"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleInputChange}
                  className={`${inputBase} ${errors.license_plate ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="e.g., A 12345"
                />
                {errors.license_plate && <p className="text-red-600 text-xs mt-1">{errors.license_plate}</p>}
              </div>
              <div>
                <Label>Car name</Label>
                <input
                  type="text"
                  name="car_name"
                  value={formData.car_name}
                  onChange={handleInputChange}
                  className={`${inputBase} border-gray-300`}
                  placeholder="Display name (optional)"
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`${inputBase} border-gray-300`}
                >
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Out of Service">Out of Service</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Vehicle details */}
          <Section icon={Car} title="Vehicle details" description="Make, model and specifications">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Make</Label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  className={`${inputBase} ${errors.make ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="e.g., Toyota"
                />
                {errors.make && <p className="text-red-600 text-xs mt-1">{errors.make}</p>}
              </div>
              <div>
                <Label required>Model</Label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className={`${inputBase} ${errors.model ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="e.g., Hiace"
                />
                {errors.model && <p className="text-red-600 text-xs mt-1">{errors.model}</p>}
              </div>
              <div>
                <Label required>Year</Label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className={`${inputBase} ${errors.year ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.year && <p className="text-red-600 text-xs mt-1">{errors.year}</p>}
              </div>
              <div>
                <Label>Color</Label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className={`${inputBase} border-gray-300`}
                  placeholder="e.g., White"
                />
              </div>
              <div className="md:col-span-2">
                <Label>VIN</Label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="vin"
                    value={formData.vin}
                    onChange={(e) => { handleInputChange(e); setVinError(''); }}
                    maxLength="17"
                    className={`flex-1 ${inputBase} ${errors.vin ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="17-character VIN (optional)"
                  />
                  <button
                    type="button"
                    onClick={handleDecodeVin}
                    disabled={vinDecoding}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 text-sm"
                    title="Decode VIN to fill Make, Model, Year"
                  >
                    <Search className="w-4 h-4" />
                    {vinDecoding ? '…' : 'Decode'}
                  </button>
                </div>
                {(errors.vin || vinError) && <p className="text-red-600 text-xs mt-1">{errors.vin || vinError}</p>}
              </div>
              <div>
                <Label>Model type</Label>
                <select name="body_type" value={formData.body_type} onChange={handleInputChange} className={`${inputBase} border-gray-300`}>
                  <option value="">Select</option>
                  {BODY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>Vehicle type</Label>
                <select name="powertrain_type" value={formData.powertrain_type} onChange={handleInputChange} className={`${inputBase} border-gray-300`}>
                  <option value="">Select</option>
                  {POWERTRAIN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>Business type</Label>
                <select name="business_type" value={formData.business_type} onChange={handleInputChange} className={`${inputBase} border-gray-300`}>
                  <option value="">Select</option>
                  {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>Seats</Label>
                <input type="number" name="seat_count" value={formData.seat_count} onChange={handleInputChange} min="1" className={`${inputBase} border-gray-300`} placeholder="e.g., 7" />
              </div>
              <div>
                <Label>Current mileage (km)</Label>
                <input
                  type="number"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                  min="0"
                  className={`${inputBase} ${errors.mileage ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="0"
                />
                {errors.mileage && <p className="text-red-600 text-xs mt-1">{errors.mileage}</p>}
              </div>
            </div>
          </Section>

          {/* Engine & performance */}
          <Section icon={Settings2} title="Engine & performance" description="Powertrain and efficiency">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Fuel type</Label>
                <select name="fuel_type" value={formData.fuel_type} onChange={handleInputChange} className={`${inputBase} border-gray-300`}>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="LPG">LPG</option>
                </select>
              </div>
              <div>
                <Label>Transmission</Label>
                <select name="transmission" value={formData.transmission} onChange={handleInputChange} className={`${inputBase} border-gray-300`}>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                  <option value="CVT">CVT</option>
                </select>
              </div>
              <div>
                <Label>Engine size</Label>
                <input type="text" name="engine_size" value={formData.engine_size} onChange={handleInputChange} className={`${inputBase} border-gray-300`} placeholder="e.g., 2.0L" />
              </div>
              <div>
                <Label>Fuel tank (L)</Label>
                <input type="number" name="fuel_tank_capacity_liters" value={formData.fuel_tank_capacity_liters} onChange={handleInputChange} step="0.1" className={`${inputBase} border-gray-300`} />
              </div>
              <div>
                <Label>Fuel efficiency (km/l)</Label>
                <input type="number" name="fuel_efficiency" value={formData.fuel_efficiency} onChange={handleInputChange} min="0" step="0.1" className={`${inputBase} border-gray-300`} placeholder="0.0" />
              </div>
              <div>
                <Label>IoT device ID</Label>
                <input type="text" name="iot_device_id" value={formData.iot_device_id} onChange={handleInputChange} className={`${inputBase} border-gray-300`} />
              </div>
            </div>
          </Section>

          {/* Ownership & contract */}
          <Section icon={FileSignature} title="Ownership & contract" description="Who owns the car and contract details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Car owned by</Label>
                <input
                  type="text"
                  name="owned_by"
                  value={formData.owned_by}
                  onChange={handleInputChange}
                  className={`${inputBase} border-gray-300`}
                  placeholder="e.g., UDrive / Leasing company"
                />
              </div>
              <div>
                <Label>Contract number</Label>
                <input
                  type="text"
                  name="contract_number"
                  value={formData.contract_number}
                  onChange={handleInputChange}
                  className={`${inputBase} border-gray-300`}
                  placeholder="e.g., CN-2026-0142"
                />
              </div>
              <div>
                <Label>Contract expiry</Label>
                <input type="date" name="contract_expiry" value={formData.contract_expiry} onChange={handleInputChange} className={`${inputBase} border-gray-300`} />
              </div>
              <div>
                <Label>Purchase date</Label>
                <input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleInputChange} className={`${inputBase} border-gray-300`} />
              </div>
              <div>
                <Label>Purchase price</Label>
                <input
                  type="number"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`${inputBase} ${errors.purchase_price ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="0.00"
                />
                {errors.purchase_price && <p className="text-red-600 text-xs mt-1">{errors.purchase_price}</p>}
              </div>
            </div>
          </Section>

          {/* Compliance & service */}
          <Section icon={ShieldCheck} title="Compliance & service" description="Mulkiya, insurance, registration and service dates">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Mulkiya number</Label>
                <input
                  type="text"
                  name="mulkiya_number"
                  value={formData.mulkiya_number}
                  onChange={handleInputChange}
                  className={`${inputBase} border-gray-300`}
                  placeholder="Registration card no."
                />
              </div>
              <div>
                <Label>Registration / Mulkiya expiry</Label>
                <input type="date" name="registration_expiry" value={formData.registration_expiry} onChange={handleInputChange} className={`${inputBase} border-gray-300`} />
              </div>
              <div>
                <Label>Insurance expiry</Label>
                <input type="date" name="insurance_expiry" value={formData.insurance_expiry} onChange={handleInputChange} className={`${inputBase} border-gray-300`} />
              </div>
              <div>
                <Label>Last service date</Label>
                <input type="date" name="last_service_date" value={formData.last_service_date} onChange={handleInputChange} className={`${inputBase} border-gray-300`} />
              </div>
              <div>
                <Label>Next service date</Label>
                <input type="date" name="next_service_date" value={formData.next_service_date} onChange={handleInputChange} className={`${inputBase} border-gray-300`} />
              </div>
            </div>

            {/* Mulkiya attachment */}
            <div className="mt-4">
              <Label>Mulkiya document (PDF or image)</Label>
              {mulkiyaFile ? (
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 border border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{mulkiyaFile.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      ({(mulkiyaFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setMulkiyaFile(null); setMulkiyaError(''); }}
                    className="text-gray-400 hover:text-red-600 flex-shrink-0"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Click to attach the Mulkiya (PDF or image, max 10 MB)</span>
                  <input type="file" accept={MULKIYA_ACCEPT} onChange={handleMulkiyaSelect} className="hidden" />
                </label>
              )}
              {mulkiyaError && <p className="text-red-600 text-xs mt-1">{mulkiyaError}</p>}
              {isEditMode && formData.mulkiya_document_url && !mulkiyaFile && (
                <a
                  href={formData.mulkiya_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2"
                >
                  <FileText className="w-3.5 h-3.5" /> View current Mulkiya document
                </a>
              )}
            </div>
          </Section>

          {/* Notes */}
          <Section icon={StickyNote} title="Notes" description="Anything else worth recording">
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className={`${inputBase} border-gray-300`}
              placeholder="Additional notes about the vehicle..."
            />
          </Section>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : isEditMode ? 'Update Vehicle' : 'Add Vehicle'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleModal;
