import { motion } from 'framer-motion';

export default function AdminStatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  accentColor = '#3b82f6',
  iconBg = 'rgba(59, 130, 246, 0.12)',
  delay = 0,
}) {
  return (
    <motion.div
      className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="p-2.5 rounded-xl"
          style={{ background: iconBg }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
      <div
        className="mt-3 h-1 rounded-full opacity-30"
        style={{ background: accentColor }}
      />
    </motion.div>
  );
}
