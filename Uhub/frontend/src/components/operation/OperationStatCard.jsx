import React from 'react';

const toneClasses = {
  blue: 'bg-blue-50 border-blue-100 text-blue-900',
  green: 'bg-green-50 border-green-100 text-green-900',
  yellow: 'bg-amber-50 border-amber-100 text-amber-900',
  red: 'bg-red-50 border-red-100 text-red-900',
  indigo: 'bg-indigo-50 border-indigo-100 text-indigo-900',
  slate: 'bg-slate-50 border-slate-200 text-slate-900',
};

const valueTone = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  yellow: 'text-amber-600',
  red: 'text-red-600',
  indigo: 'text-indigo-600',
  slate: 'text-slate-700',
};

const OperationStatCard = ({ label, value, sub, tone = 'blue', icon: Icon }) => (
  <div className={`rounded-xl border p-4 ${toneClasses[tone] || toneClasses.blue}`}>
    <div className="flex items-center justify-between gap-2 mb-1">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      {Icon && <Icon className="w-4 h-4 opacity-60" />}
    </div>
    <p className={`text-2xl font-bold ${valueTone[tone] || valueTone.blue}`}>{value}</p>
    {sub && <p className="text-xs mt-1 opacity-75">{sub}</p>}
  </div>
);

export default OperationStatCard;
