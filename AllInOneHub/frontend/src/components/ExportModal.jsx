import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, FileText, FileSpreadsheet, 
  Loader2, BarChart3
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { exportFilteredData, getExportStats } from '../utils/exportUtils';

const ExportModal = ({ 
  isOpen, 
  onClose, 
  simCards, 
  filters = {},
  onExportComplete 
}) => {
  const { isDark } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [exportScope, setExportScope] = useState('filtered'); // 'all' or 'filtered'
  const [includeStats, setIncludeStats] = useState(true);

  const stats = getExportStats(simCards);
  const filteredCount = simCards.filter(simCard => {
    const { searchTerm, statusFilter, departmentFilter, packageTypeFilter } = filters;
    const matchesSearch = simCard.sim_number.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         simCard.package_name.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (simCard.current_user && simCard.current_user.toLowerCase().includes((searchTerm || '').toLowerCase()));
    const matchesStatus = !statusFilter || simCard.status === statusFilter;
    const matchesDepartment = !departmentFilter || simCard.department === departmentFilter;
    const matchesPackageType = !packageTypeFilter || simCard.package_type === packageTypeFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesPackageType;
  }).length;

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const dataToExport = exportScope === 'all' ? simCards : simCards;
      const filtersToUse = exportScope === 'all' ? {} : filters;
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
      
      exportFilteredData(dataToExport, filtersToUse, exportFormat);
      
      if (onExportComplete) {
        onExportComplete({
          format: exportFormat,
          scope: exportScope,
          count: exportScope === 'all' ? simCards.length : filteredCount,
          includeStats
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`rounded-2xl shadow-2xl w-full max-w-2xl border transition-all duration-300 ${
              isDark 
                ? 'bg-slate-800/90 border-slate-700/50' 
                : 'bg-white border-gray-200/20'
            }`}
          >
            {/* Header */}
            <div className={`p-6 border-b rounded-t-2xl transition-all duration-300 ${
              isDark 
                ? 'border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-700' 
                : 'border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl transition-all duration-300 ${
                    isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                  }`}>
                    <Download className={`w-6 h-6 transition-colors duration-300 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Export SIM Cards
                    </h2>
                    <p className={`mt-1 transition-colors duration-300 ${
                      isDark ? 'text-slate-300' : 'text-gray-600'
                    }`}>
                      Choose format and export options
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isExporting}
                  className={`p-2 rounded-xl transition-all duration-300 ${
                    isDark 
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 disabled:opacity-50' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50'
                  }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Export Statistics */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${
                isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className={`w-5 h-5 transition-colors duration-300 ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                  <h3 className={`font-semibold transition-colors duration-300 ${
                    isDark ? 'text-slate-200' : 'text-gray-900'
                  }`}>Export Summary</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className={`transition-colors duration-300 ${
                      isDark ? 'text-slate-300' : 'text-gray-600'
                    }`}>Total SIM Cards:</span>
                    <span className={`font-semibold transition-colors duration-300 ${
                      isDark ? 'text-slate-100' : 'text-gray-900'
                    }`}>{stats.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`transition-colors duration-300 ${
                      isDark ? 'text-slate-300' : 'text-gray-600'
                    }`}>Filtered Results:</span>
                    <span className={`font-semibold transition-colors duration-300 ${
                      isDark ? 'text-slate-100' : 'text-gray-900'
                    }`}>{filteredCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`transition-colors duration-300 ${
                      isDark ? 'text-slate-300' : 'text-gray-600'
                    }`}>Active SIM Cards:</span>
                    <span className={`font-semibold transition-colors duration-300 ${
                      isDark ? 'text-slate-100' : 'text-gray-900'
                    }`}>{stats.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`transition-colors duration-300 ${
                      isDark ? 'text-slate-300' : 'text-gray-600'
                    }`}>Total Monthly Cost:</span>
                    <span className={`font-semibold transition-colors duration-300 ${
                      isDark ? 'text-slate-100' : 'text-gray-900'
                    }`}>{stats.totalCost}</span>
                  </div>
                </div>
              </div>

              {/* Export Scope */}
              <div>
                <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Export Scope
                </label>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                    exportScope === 'all' 
                      ? (isDark ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-300')
                      : (isDark ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-600/50' : 'bg-gray-50 border-gray-200 hover:bg-gray-100')
                  }`}>
                    <input
                      type="radio"
                      name="exportScope"
                      value="all"
                      checked={exportScope === 'all'}
                      onChange={(e) => setExportScope(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className={`font-medium transition-colors duration-300 ${
                        isDark ? 'text-slate-200' : 'text-gray-900'
                      }`}>All SIM Cards</div>
                      <div className={`text-sm transition-colors duration-300 ${
                        isDark ? 'text-slate-400' : 'text-gray-600'
                      }`}>Export all {stats.total} SIM cards</div>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                    exportScope === 'filtered' 
                      ? (isDark ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-300')
                      : (isDark ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-600/50' : 'bg-gray-50 border-gray-200 hover:bg-gray-100')
                  }`}>
                    <input
                      type="radio"
                      name="exportScope"
                      value="filtered"
                      checked={exportScope === 'filtered'}
                      onChange={(e) => setExportScope(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className={`font-medium transition-colors duration-300 ${
                        isDark ? 'text-slate-200' : 'text-gray-900'
                      }`}>Filtered Results</div>
                      <div className={`text-sm transition-colors duration-300 ${
                        isDark ? 'text-slate-400' : 'text-gray-600'
                      }`}>Export {filteredCount} filtered SIM cards</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Export Format */}
              <div>
                <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    exportFormat === 'excel' 
                      ? (isDark ? 'bg-green-900/30 border-green-500' : 'bg-green-50 border-green-300')
                      : (isDark ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-600/50' : 'bg-gray-50 border-gray-200 hover:bg-gray-100')
                  }`}>
                    <input
                      type="radio"
                      name="exportFormat"
                      value="excel"
                      checked={exportFormat === 'excel'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="w-4 h-4 text-green-600"
                    />
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className={`w-6 h-6 transition-colors duration-300 ${
                        exportFormat === 'excel' 
                          ? (isDark ? 'text-green-400' : 'text-green-600')
                          : (isDark ? 'text-slate-400' : 'text-gray-500')
                      }`} />
                      <div>
                        <div className={`font-medium transition-colors duration-300 ${
                          isDark ? 'text-slate-200' : 'text-gray-900'
                        }`}>Excel (CSV)</div>
                        <div className={`text-xs transition-colors duration-300 ${
                          isDark ? 'text-slate-400' : 'text-gray-600'
                        }`}>Spreadsheet format</div>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    exportFormat === 'pdf' 
                      ? (isDark ? 'bg-red-900/30 border-red-500' : 'bg-red-50 border-red-300')
                      : (isDark ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-600/50' : 'bg-gray-50 border-gray-200 hover:bg-gray-100')
                  }`}>
                    <input
                      type="radio"
                      name="exportFormat"
                      value="pdf"
                      checked={exportFormat === 'pdf'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="w-4 h-4 text-red-600"
                    />
                    <div className="flex items-center gap-3">
                      <FileText className={`w-6 h-6 transition-colors duration-300 ${
                        exportFormat === 'pdf' 
                          ? (isDark ? 'text-red-400' : 'text-red-600')
                          : (isDark ? 'text-slate-400' : 'text-gray-500')
                      }`} />
                      <div>
                        <div className={`font-medium transition-colors duration-300 ${
                          isDark ? 'text-slate-200' : 'text-gray-900'
                        }`}>PDF Report</div>
                        <div className={`text-xs transition-colors duration-300 ${
                          isDark ? 'text-slate-400' : 'text-gray-600'
                        }`}>Formatted report</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Additional Options */}
              <div>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                  isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={includeStats}
                    onChange={(e) => setIncludeStats(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <div className={`font-medium transition-colors duration-300 ${
                      isDark ? 'text-slate-200' : 'text-gray-900'
                    }`}>Include Statistics</div>
                    <div className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-slate-400' : 'text-gray-600'
                    }`}>Add summary statistics to the export</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end gap-4 p-6 border-t transition-all duration-300 ${
              isDark ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isExporting}
                className={`px-6 py-3 border rounded-xl transition-all duration-300 font-medium disabled:opacity-50 ${
                  isDark 
                    ? 'border-slate-600 text-slate-300 hover:bg-slate-700/50' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl flex items-center gap-2 transition-all duration-300 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl ${
                  isDark ? 'shadow-blue-500/25' : 'shadow-blue-500/20'
                }`}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export {exportFormat === 'excel' ? 'Excel' : 'PDF'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExportModal;
