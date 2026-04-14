import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Phone, User, Building, BadgeInfo, CalendarDays, CreditCard } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSimCardById } from '../hooks/useSimCards';
import { supabase } from '../supabaseClient';
import { getDepartmentLabel } from '../config/departments';
import LoadingSpinner from '../components/LoadingSpinner';

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-700">
    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{label}</p>
    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 text-right max-w-[60%] break-words">
      {value || '-'}
    </p>
  </div>
);

export default function SimcardProfile() {
  const { id } = useParams();
  const { isDark } = useTheme();
  const { data: simCard, isLoading, error } = useSimCardById(id);

  const { data: employee } = useQuery({
    queryKey: ['simCardEmployee', simCard?.assigned_employee_id],
    queryFn: async () => {
      if (!simCard?.assigned_employee_id) return null;
      const assigneeId = String(simCard.assigned_employee_id);
      let response = await supabase
        .from('employees')
        .select('id, full_name, employee_id, email, department, position')
        .eq('employee_id', assigneeId)
        .maybeSingle();

      if (response?.data) return response.data;

      response = await supabase
        .from('employees')
        .select('id, full_name, employee_id, email, department, position')
        .eq('id', assigneeId)
        .maybeSingle();

      return response?.data || null;
    },
    enabled: !!simCard?.assigned_employee_id,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading SIM profile..." />
      </div>
    );
  }

  if (error || !simCard) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/simcards"
          className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to SIM Cards
        </Link>
        <div className="mt-6 rounded-xl border border-red-300 bg-red-50 text-red-700 p-4 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300">
          Unable to load this SIM card profile.
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/simcards"
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to SIM Cards
          </Link>
        </div>

        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{simCard.sim_number}</h1>
              <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">{simCard.package_name}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Status: {simCard.status || 'Unknown'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3 inline-flex items-center gap-2">
              <BadgeInfo className="w-5 h-5" />
              SIM Details
            </h2>
            <InfoRow label="Package Type" value={simCard.package_type} />
            <InfoRow label="Monthly Cost" value={`AED ${simCard.monthly_cost || 0}`} />
            <InfoRow label="Data Limit" value={simCard.data_limit} />
            <InfoRow label="Voice Minutes" value={simCard.voice_minutes} />
            <InfoRow label="SMS Limit" value={simCard.sms_limit} />
          </div>

          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3 inline-flex items-center gap-2">
              <User className="w-5 h-5" />
              Assignment
            </h2>
            <InfoRow label="Current User" value={simCard.current_user || 'Unassigned'} />
            <InfoRow label="Linked Employee ID" value={simCard.assigned_employee_id} />
            <InfoRow label="Linked Employee Name" value={simCard.assigned_employee_name} />
            <InfoRow label="Linked Employee Email" value={simCard.assigned_employee_email} />
            {employee ? (
              <div className="mt-4 rounded-lg p-3 border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Employee record matched</p>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-1">
                  {employee.full_name} {employee.employee_id ? `(${employee.employee_id})` : ''}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">{employee.email || '-'}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3 inline-flex items-center gap-2">
              <Building className="w-5 h-5" />
              Department & Role
            </h2>
            <InfoRow label="Department" value={simCard.department ? getDepartmentLabel(simCard.department) : ''} />
            <InfoRow label="Designation" value={simCard.designation} />
            <InfoRow label="Previous User" value={simCard.previous_user} />
          </div>

          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3 inline-flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Lifecycle
            </h2>
            <InfoRow label="Activation Date" value={simCard.activation_date} />
            <InfoRow label="Expiry Date" value={simCard.expiry_date} />
            <InfoRow label="Created At" value={simCard.created_at ? new Date(simCard.created_at).toLocaleString() : ''} />
            <InfoRow label="Updated At" value={simCard.updated_at ? new Date(simCard.updated_at).toLocaleString() : ''} />
          </div>
        </div>

        {simCard.notes ? (
          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3 inline-flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Notes
            </h2>
            <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{simCard.notes}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
