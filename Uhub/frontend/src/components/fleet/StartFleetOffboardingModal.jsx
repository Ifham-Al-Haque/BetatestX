import React, { useEffect, useState } from 'react';
import { X, UserX, Car } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import fleetOffboardingService, { OFFBOARDING_REASONS } from '../../services/fleetOffboardingService';
import { getCarDisplayName } from '../../utils/fleetRecordUtils';

/**
 * Start offboarding for a fleet vehicle. The vehicle is preselected from the
 * Fleet Record, and its details are extracted/shown read-only so the user only
 * has to set the reason, date and notes.
 */
const StartFleetOffboardingModal = ({ isOpen, onClose, vehicle, onSuccess }) => {
  const { userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [form, setForm] = useState({
    reason: '',
    offboarding_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        reason: '',
        offboarding_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [isOpen, vehicle]);

  if (!isOpen || !vehicle) return null;

  const handleSubmit = async () => {
    if (!form.reason) {
      showError('Please select a reason for offboarding');
      return;
    }
    setSubmitting(true);
    try {
      await fleetOffboardingService.startOffboarding({
        vehicle_id: vehicle.id,
        reason: form.reason,
        offboarding_date: form.offboarding_date,
        notes: form.notes,
        started_by: userProfile?.id || null,
      });
      success('Offboarding started for this vehicle');
      onSuccess?.();
      onClose();
    } catch (err) {
      showError(err?.message || 'Failed to start offboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value || '—'}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Start Offboarding</h2>
              <p className="text-xs text-red-100">Retire this vehicle from the active fleet</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Extracted vehicle info */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Vehicle (from Fleet Record)</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <InfoRow label="Vehicle" value={`${getCarDisplayName(vehicle)} (${vehicle.vehicle_number})`} />
              <InfoRow label="License plate" value={vehicle.license_plate} />
              <InfoRow label="Make / Model" value={`${vehicle.make || ''} ${vehicle.model || ''}`.trim()} />
              <InfoRow label="Year" value={vehicle.year} />
              <InfoRow label="Current status" value={vehicle.status} />
              <InfoRow label="Owned by" value={vehicle.owned_by} />
              <InfoRow label="Contract no." value={vehicle.contract_number} />
              <InfoRow label="Mileage" value={vehicle.mileage != null ? `${Number(vehicle.mileage).toLocaleString()} km` : null} />
            </div>
          </div>

          {/* Offboarding inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason for offboarding <span className="text-red-500">*</span>
              </label>
              <select
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Select reason</option>
                {OFFBOARDING_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Offboarding date</label>
              <input
                type="date"
                value={form.offboarding_date}
                onChange={(e) => setForm((f) => ({ ...f, offboarding_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Additional details about why this vehicle is being offboarded..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            A standard return checklist will be created. The vehicle is set to{' '}
            <span className="font-medium">Retired</span> once offboarding is completed.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm flex items-center gap-2"
          >
            <UserX className="w-4 h-4" />
            {submitting ? 'Starting…' : 'Start Offboarding'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartFleetOffboardingModal;
