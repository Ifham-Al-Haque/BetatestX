import React, { useEffect, useMemo, useState } from 'react';
import { X, Save, FileText, Paperclip, Trash2, Search, Car, ScanLine, Loader2 } from 'lucide-react';
import { getCarDisplayName } from '../../utils/fleetRecordUtils';
import { saveManualMulkiya } from '../../services/mulkiyaService';
import { applyMulkiyaScan, extractMulkiyaFromFile } from '../../services/mulkiyaOcrService';

const MULKIYA_MAX_BYTES = 10 * 1024 * 1024;
const MULKIYA_ACCEPT = 'application/pdf,image/*';

const EMPTY = {
  vehicle_number: '',
  license_plate: '',
  make: '',
  model: '',
  year: String(new Date().getFullYear()),
  owned_by: '',
  registration_expiry: '',
  insurance_expiry: '',
  engine_number: '',
  chassis_number: '',
  mulkiya_number: '',
};

function formFromVehicle(vehicle) {
  if (!vehicle) return { ...EMPTY };
  return {
    vehicle_number: vehicle.vehicle_number || '',
    license_plate: vehicle.license_plate || '',
    make: vehicle.make || '',
    model: vehicle.model || '',
    year: String(vehicle.year || vehicle.model_year || new Date().getFullYear()),
    owned_by: vehicle.owned_by || '',
    registration_expiry: toDateInput(vehicle.registration_expiry),
    insurance_expiry: toDateInput(vehicle.insurance_expiry),
    engine_number: vehicle.engine_number || vehicle.engine_no || '',
    chassis_number: vehicle.vin || vehicle.chassis_number || '',
    mulkiya_number: vehicle.mulkiya_number || '',
  };
}

function toDateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

const inputBase =
  'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

const AddMulkiyaModal = ({ isOpen, onClose, vehicles = [], vehicle = null, onSuccess }) => {
  const [mode, setMode] = useState(vehicle ? 'existing' : 'new');
  const [existingId, setExistingId] = useState(vehicle?.id || '');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState('');
  const [scanWarnings, setScanWarnings] = useState([]);
  const [scannedKeys, setScannedKeys] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    if (vehicle) {
      setMode('existing');
      setExistingId(vehicle.id);
      setForm(formFromVehicle(vehicle));
    } else {
      setMode('new');
      setExistingId('');
      setForm(EMPTY);
    }
    setSearch('');
    setFile(null);
    setPreviewUrl('');
    setErrors({});
    setScanNote('');
    setScanWarnings([]);
    setScannedKeys([]);
    setScanning(false);
  }, [isOpen, vehicle]);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const filteredVehicles = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = vehicles || [];
    if (!q) return list.slice(0, 8);
    return list
      .filter((v) => {
        const blob = `${v.vehicle_number} ${v.license_plate} ${v.make} ${v.model} ${v.car_name || ''}`.toLowerCase();
        return blob.includes(q);
      })
      .slice(0, 8);
  }, [vehicles, search]);

  const applyExisting = (v) => {
    setExistingId(v.id);
    setForm(formFromVehicle(v));
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFile = (e) => {
    const chosen = e.target.files?.[0];
    if (!chosen) {
      setFile(null);
      return;
    }
    const isPdf = chosen.type === 'application/pdf';
    const isImage = chosen.type.startsWith('image/');
    if (!isPdf && !isImage) {
      setErrors((prev) => ({ ...prev, file: 'Please choose a PDF or image file.' }));
      setFile(null);
      return;
    }
    if (chosen.size > MULKIYA_MAX_BYTES) {
      setErrors((prev) => ({ ...prev, file: 'File must be under 10 MB.' }));
      setFile(null);
      return;
    }
    setErrors((prev) => ({ ...prev, file: '' }));
    setFile(chosen);
    runScan(chosen);
  };

  const runScan = async (target = file, { overwrite = false } = {}) => {
    if (!target) {
      setErrors((prev) => ({ ...prev, scan: 'Attach the Mulkiya first.' }));
      return;
    }
    setScanning(true);
    setScanNote('');
    setScanWarnings([]);
    setErrors((prev) => ({ ...prev, scan: '' }));
    try {
      const result = await extractMulkiyaFromFile(target);
      let filled = [];
      setForm((prev) => {
        const applied = applyMulkiyaScan(prev, result.fields, { overwrite });
        filled = applied.filled;
        return applied.form;
      });
      setScannedKeys(filled);
      setScanWarnings(Array.isArray(result.warnings) ? result.warnings : []);
      setScanNote(
        filled.length === 0
          ? 'Nothing new was filled — fields already had values, or the card was unreadable.'
          : `Filled ${filled.length} field${filled.length === 1 ? '' : 's'} from the Mulkiya. Check them before saving.`
      );
    } catch (error) {
      setScanNote('');
      setScannedKeys([]);
      setErrors((prev) => ({ ...prev, scan: error.message || 'Could not scan that Mulkiya.' }));
    } finally {
      setScanning(false);
    }
  };

  const fieldClass = (name) =>
    `${inputBase} ${
      errors[name]
        ? 'border-red-300'
        : scannedKeys.includes(name)
          ? 'border-emerald-400'
          : 'border-gray-300'
    }`;

  const validate = () => {
    const next = {};
    if (mode === 'existing' && !existingId) next.existing = 'Select a fleet vehicle.';
    if (mode === 'new') {
      if (!form.vehicle_number.trim()) next.vehicle_number = 'Vehicle number is required';
      else if (form.vehicle_number.trim().length > 20) next.vehicle_number = 'Max 20 characters';
      if (!form.license_plate.trim()) next.license_plate = 'License plate is required';
      else if (form.license_plate.trim().length > 20) next.license_plate = 'Max 20 characters';
      if (!form.make.trim()) next.make = 'Make is required';
      if (!form.model.trim()) next.model = 'Model is required';
    } else if (!form.license_plate.trim()) {
      next.license_plate = 'License plate is required';
    }
    if (!form.registration_expiry) next.registration_expiry = 'Mulkiya expiry is required';
    if (!form.insurance_expiry) next.insurance_expiry = 'Insurance expiry is required';
    if (!file && !vehicle?.mulkiya_document_url) {
      next.file = 'Attach the Mulkiya PDF or image.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const saved = await saveManualMulkiya({
        existingVehicleId: mode === 'existing' ? existingId : null,
        vehicle: form,
        file,
      });
      onSuccess?.(saved);
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save Mulkiya.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const isEdit = Boolean(vehicle?.id);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{isEdit ? 'Update Mulkiya' : 'Add Mulkiya'}</h2>
              <p className="text-xs text-indigo-100">Plate, vehicle, expiry, and identification as on the card</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="add-mulkiya-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {!isEdit && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              {[
                { id: 'new', label: 'New vehicle' },
                { id: 'existing', label: 'Existing vehicle' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setMode(opt.id);
                    setExistingId('');
                    setForm(EMPTY);
                    setErrors({});
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    mode === opt.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {mode === 'existing' && !isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Find vehicle</label>
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${inputBase} pl-9 border-gray-300`}
                  placeholder="Plate, vehicle number, make…"
                />
              </div>
              <div className="border border-gray-200 rounded-lg divide-y max-h-40 overflow-y-auto">
                {filteredVehicles.length === 0 ? (
                  <p className="text-sm text-gray-500 px-3 py-4 text-center">No matching vehicles.</p>
                ) : (
                  filteredVehicles.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => applyExisting(v)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                        existingId === v.id ? 'bg-indigo-50 text-indigo-800' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Car className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-medium">{getCarDisplayName(v)}</span>
                      <span className="text-gray-400 truncate">
                        {v.vehicle_number} · {v.license_plate}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {errors.existing && <p className="text-red-600 text-xs mt-1">{errors.existing}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mulkiya document (PDF or image)
              {!(isEdit && vehicle?.mulkiya_document_url) && <span className="text-red-500"> *</span>}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Attach a clear photo of the card. We read the print and fill plate, make, model, year, owner, expiry, engine and chassis — you still confirm before save.
            </p>
            {file ? (
              <div className="space-y-2">
                {previewUrl && (
                  <img src={previewUrl} alt="" className="h-28 w-full object-cover rounded-lg border border-gray-200" />
                )}
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 border border-indigo-200 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setScanNote('');
                      setScanWarnings([]);
                      setScannedKeys([]);
                    }}
                    className="text-gray-400 hover:text-red-600"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={scanning}
                  onClick={() => runScan(file, { overwrite: scannedKeys.length > 0 })}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 disabled:opacity-60"
                >
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                  {scanning ? 'Reading card…' : scannedKeys.length ? 'Scan again and replace fields' : 'Scan Mulkiya'}
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40">
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Click to attach PDF or image (max 10 MB)</span>
                <input type="file" accept={MULKIYA_ACCEPT} onChange={handleFile} className="hidden" />
              </label>
            )}
            {!file && vehicle?.mulkiya_document_url && (
              <a
                href={vehicle.mulkiya_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-2"
              >
                <FileText className="w-3.5 h-3.5" /> View current document
              </a>
            )}
            {scanNote && <p className="text-xs text-emerald-800 mt-2">{scanNote}</p>}
            {scanWarnings.map((warning) => (
              <p key={warning} className="text-xs text-amber-800 mt-1">{warning}</p>
            ))}
            {errors.file && <p className="text-red-600 text-xs mt-1">{errors.file}</p>}
            {errors.scan && <p className="text-red-600 text-xs mt-1">{errors.scan}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Vehicle number {mode === 'new' && <span className="text-red-500">*</span>}
              </label>
              <input
                name="vehicle_number"
                value={form.vehicle_number}
                onChange={handleChange}
                disabled={mode === 'existing'}
                maxLength={20}
                className={`${inputBase} ${errors.vehicle_number ? 'border-red-300' : 'border-gray-300'} disabled:bg-gray-50`}
                placeholder="e.g. UD-1042"
              />
              {errors.vehicle_number && <p className="text-red-600 text-xs mt-1">{errors.vehicle_number}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                License plate <span className="text-red-500">*</span>
              </label>
              <input
                name="license_plate"
                value={form.license_plate}
                onChange={handleChange}
                maxLength={20}
                className={`${fieldClass('license_plate')}`}
                placeholder="e.g. A 12345"
              />
              {errors.license_plate && <p className="text-red-600 text-xs mt-1">{errors.license_plate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Car make {mode === 'new' && <span className="text-red-500">*</span>}
              </label>
              <input
                name="make"
                value={form.make}
                onChange={handleChange}
                className={`${fieldClass('make')}`}
                placeholder="Toyota"
              />
              {errors.make && <p className="text-red-600 text-xs mt-1">{errors.make}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Car model {mode === 'new' && <span className="text-red-500">*</span>}
              </label>
              <input
                name="model"
                value={form.model}
                onChange={handleChange}
                className={`${fieldClass('model')}`}
                placeholder="Camry"
              />
              {errors.model && <p className="text-red-600 text-xs mt-1">{errors.model}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Model year</label>
              <input
                type="number"
                name="year"
                value={form.year}
                onChange={handleChange}
                min="1990"
                max={new Date().getFullYear() + 1}
                className={fieldClass('year')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Owned by</label>
              <input
                name="owned_by"
                value={form.owned_by}
                onChange={handleChange}
                className={fieldClass('owned_by')}
                placeholder="UDrive / leasing company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mulkiya expiry <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="registration_expiry"
                value={form.registration_expiry}
                onChange={handleChange}
                className={fieldClass('registration_expiry')}
              />
              {errors.registration_expiry && (
                <p className="text-red-600 text-xs mt-1">{errors.registration_expiry}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Car insurance expiry <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="insurance_expiry"
                value={form.insurance_expiry}
                onChange={handleChange}
                className={fieldClass('insurance_expiry')}
              />
              {errors.insurance_expiry && (
                <p className="text-red-600 text-xs mt-1">{errors.insurance_expiry}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Eng No</label>
              <input
                name="engine_number"
                value={form.engine_number}
                onChange={handleChange}
                className={`${fieldClass('engine_number')} font-mono`}
                placeholder="Engine number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Chassis No</label>
              <input
                name="chassis_number"
                value={form.chassis_number}
                onChange={handleChange}
                maxLength={17}
                className={`${fieldClass('chassis_number')} font-mono`}
                placeholder="Chassis / VIN (17 chars)"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mulkiya number</label>
              <input
                name="mulkiya_number"
                value={form.mulkiya_number}
                onChange={handleChange}
                className={fieldClass('mulkiya_number')}
                placeholder="Registration card no. (optional)"
              />
            </div>
          </div>

          {errors.submit && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errors.submit}
            </div>
          )}
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-mulkiya-form"
            disabled={saving || scanning}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save Mulkiya'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMulkiyaModal;
