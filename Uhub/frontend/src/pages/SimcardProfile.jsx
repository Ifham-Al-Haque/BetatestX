import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Phone, User, Building, BadgeInfo, CalendarDays,
  CreditCard, Edit, Clock, Mail, ExternalLink, AlertTriangle,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSimCardById } from '../hooks/useSimCards';
import { supabase } from '../supabaseClient';
import { getDepartmentLabel } from '../config/departments';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getDepartmentBadgeClasses,
  getExpiryBadgeClasses,
  getExpiryInfo,
  getStatusColor,
  isUnassigned,
} from '../utils/simCardUtils';
import { canManageSimCards, resolveUserRole } from '../utils/simCardPermissions';

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-700 last:border-0">
    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{label}</p>
    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 text-right max-w-[60%] break-words">
      {value || '-'}
    </p>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35 }}
    className="rounded-2xl border p-6 bg-white/90 dark:bg-slate-800/90 border-gray-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow"
  >
    <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 inline-flex items-center gap-2">
      <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
      {title}
    </h2>
    {children}
  </motion.div>
);

export default function SimcardProfile() {
  const { id } = useParams();
  const { isDark } = useTheme();
  const { user, userProfile } = useAuth();
  const { data: simCard, isLoading, error } = useSimCardById(id);

  const userRole = resolveUserRole(user, userProfile);
  const canEdit = canManageSimCards(userRole);

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
          className="inline-flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:underline"
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

  const expiryInfo = getExpiryInfo(simCard.expiry_date);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/30'}`}>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            to="/simcards"
            className="inline-flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to SIM Cards
          </Link>
          {canEdit && (
            <Link
              to={`/simcards?edit=${simCard.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white shadow-md"
            >
              <Edit className="w-4 h-4" />
              Edit SIM Card
            </Link>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-6 lg:p-8 bg-white/90 dark:bg-slate-800/90 border-gray-200/80 dark:border-slate-700/80 shadow-lg"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shrink-0">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100 font-mono tracking-tight">
                {simCard.sim_number}
              </h1>
              <p className="text-base text-gray-600 dark:text-slate-300 mt-1">{simCard.package_name}</p>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(simCard.status)}`}>
                  {simCard.status || 'Unknown'}
                </span>
                {simCard.package_type && (
                  <span className="px-3 py-1 text-xs font-bold rounded-full border bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-700/50">
                    {simCard.package_type}
                  </span>
                )}
                {expiryInfo && (
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border inline-flex items-center gap-1 ${getExpiryBadgeClasses(expiryInfo.tone)}`}>
                    <Clock className="w-3 h-3" />
                    {expiryInfo.label}
                  </span>
                )}
                {simCard.department && (
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${getDepartmentBadgeClasses(simCard.department)}`}>
                    {getDepartmentLabel(simCard.department)}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Monthly Cost</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">AED {simCard.monthly_cost || 0}</p>
            </div>
          </div>

          {expiryInfo?.tone === 'red' && (
            <div className="mt-5 flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-200">
                This SIM card expired on {simCard.expiry_date}. Consider renewing or updating its status.
              </p>
            </div>
          )}
          {expiryInfo?.tone === 'amber' && (
            <div className="mt-5 flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Expires on {simCard.expiry_date} — {expiryInfo.label}. Plan renewal before service interruption.
              </p>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="SIM Details" icon={BadgeInfo} delay={0.05}>
            <InfoRow label="Package Type" value={simCard.package_type} />
            <InfoRow label="Data Limit" value={simCard.data_limit} />
            <InfoRow label="Voice Minutes" value={simCard.voice_minutes} />
            <InfoRow label="SMS Limit" value={simCard.sms_limit} />
            {simCard.package_benefits && (
              <div className="pt-3">
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Package Benefits</p>
                <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{simCard.package_benefits}</p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Assignment" icon={User} delay={0.1}>
            <InfoRow label="Current User" value={simCard.current_user || 'Unassigned'} />
            <InfoRow label="Previous User" value={simCard.previous_user} />
            <InfoRow label="Designation" value={simCard.designation} />

            {employee ? (
              <div className="mt-4 rounded-xl p-4 border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Linked employee</p>
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  {employee.full_name} {employee.employee_id ? `(${employee.employee_id})` : ''}
                </p>
                {employee.email && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {employee.email}
                  </p>
                )}
                <Link
                  to={`/employee/${employee.id}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 dark:text-teal-300 hover:underline"
                >
                  View employee profile
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : !isUnassigned(simCard) && simCard.assigned_employee_name ? (
              <div className="mt-4 rounded-xl p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50">
                <p className="text-sm text-gray-600 dark:text-slate-300">{simCard.assigned_employee_name}</p>
                {simCard.assigned_employee_email && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{simCard.assigned_employee_email}</p>
                )}
              </div>
            ) : null}
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Department" icon={Building} delay={0.15}>
            <InfoRow label="Department" value={simCard.department ? getDepartmentLabel(simCard.department) : ''} />
          </SectionCard>

          <SectionCard title="Lifecycle" icon={CalendarDays} delay={0.2}>
            <InfoRow label="Activation Date" value={simCard.activation_date} />
            <InfoRow label="Expiry Date" value={simCard.expiry_date} />
            <InfoRow label="Created At" value={simCard.created_at ? new Date(simCard.created_at).toLocaleString() : ''} />
            <InfoRow label="Updated At" value={simCard.updated_at ? new Date(simCard.updated_at).toLocaleString() : ''} />
          </SectionCard>
        </div>

        {simCard.notes ? (
          <SectionCard title="Notes" icon={CreditCard} delay={0.25}>
            <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{simCard.notes}</p>
          </SectionCard>
        ) : null}
      </div>
    </div>
  );
}
