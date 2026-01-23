import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download, FileText, FileSpreadsheet, FileJson, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { itServicesApi } from '../services/itServicesApi';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';

const ITDataExport = ({ onClose, initialData = null, dataType = 'requests' }) => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();

  const [exportType, setExportType] = useState('csv'); // csv, excel, json
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    category: '',
    priority: ''
  });
  const [selectedFields, setSelectedFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(initialData || []);

  // Field options based on data type
  const fieldOptions = useMemo(() => ({
    requests: [
      { id: 'id', label: 'ID', default: true },
      { id: 'request_number', label: 'Request Number', default: true },
      { id: 'title', label: 'Title', default: true },
      { id: 'description', label: 'Description', default: true },
      { id: 'status', label: 'Status', default: true },
      { id: 'category', label: 'Category', default: true },
      { id: 'priority', label: 'Priority', default: true },
      { id: 'requester', label: 'Requester', default: true },
      { id: 'assigned_to', label: 'Assigned To', default: false },
      { id: 'created_at', label: 'Created Date', default: true },
      { id: 'updated_at', label: 'Updated Date', default: false },
      { id: 'resolved_at', label: 'Resolved Date', default: false }
    ],
    assets: [
      { id: 'id', label: 'ID', default: true },
      { id: 'asset_tag', label: 'Asset Tag', default: true },
      { id: 'name', label: 'Name', default: true },
      { id: 'type', label: 'Type', default: true },
      { id: 'model', label: 'Model', default: false },
      { id: 'serial_number', label: 'Serial Number', default: false },
      { id: 'manufacturer', label: 'Manufacturer', default: false },
      { id: 'status', label: 'Status', default: true },
      { id: 'location', label: 'Location', default: true },
      { id: 'purchase_date', label: 'Purchase Date', default: false },
      { id: 'warranty_expiry', label: 'Warranty Expiry', default: false }
    ],
    tickets: [
      { id: 'id', label: 'ID', default: true },
      { id: 'ticket_number', label: 'Ticket Number', default: true },
      { id: 'title', label: 'Title', default: true },
      { id: 'description', label: 'Description', default: true },
      { id: 'status', label: 'Status', default: true },
      { id: 'priority', label: 'Priority', default: true },
      { id: 'assigned_to', label: 'Assigned To', default: true },
      { id: 'created_at', label: 'Created Date', default: true },
      { id: 'resolved_at', label: 'Resolved Date', default: false }
    ]
  }), [dataType]);

  // Initialize selected fields with defaults
  useEffect(() => {
    const defaults = fieldOptions[dataType]?.filter(f => f.default).map(f => f.id) || [];
    setSelectedFields(defaults);
  }, [dataType, fieldOptions]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let result;
      
      if (dataType === 'requests') {
        result = await itServicesApi.requests.getAll(filters, user?.id, userProfile?.role);
      } else if (dataType === 'assets') {
        result = await itServicesApi.assets.getAll(filters);
      } else if (dataType === 'tickets') {
        result = await itServicesApi.tickets.getAll(filters);
      }

      setData(result?.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [dataType, filters, user?.id, userProfile?.role, showError]);

  // Fetch data if not provided
  useEffect(() => {
    if (!initialData && data.length === 0) {
      fetchData();
    }
  }, [filters, initialData, data.length, fetchData]);

  const toggleField = (fieldId) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const selectAllFields = () => {
    const allFields = fieldOptions[dataType]?.map(f => f.id) || [];
    setSelectedFields(allFields);
  };

  const deselectAllFields = () => {
    setSelectedFields([]);
  };

  const formatValue = (value, field) => {
    if (value === null || value === undefined) return '';
    
    if (typeof value === 'object') {
      if (field === 'category' || field === 'priority') {
        return value.name || JSON.stringify(value);
      }
      if (field === 'requester' || field === 'assigned_to') {
        return value.full_name || JSON.stringify(value);
      }
      return JSON.stringify(value);
    }
    
    if (field.includes('date') || field.includes('_at')) {
      return new Date(value).toLocaleString();
    }
    
    return String(value);
  };

  const exportToCSV = () => {
    if (data.length === 0) {
      showError('No data to export');
      return;
    }

    const fields = fieldOptions[dataType]?.filter(f => selectedFields.includes(f.id)) || [];
    
    // Headers
    const headers = fields.map(f => f.label);
    
    // Rows
    const rows = data.map(item => {
      return fields.map(field => {
        const value = item[field.id] || '';
        return formatValue(value, field.id);
      });
    });

    // Combine
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `it-${dataType}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    success('Data exported as CSV');
  };

  const exportToJSON = () => {
    if (data.length === 0) {
      showError('No data to export');
      return;
    }

    const fields = fieldOptions[dataType]?.filter(f => selectedFields.includes(f.id)) || [];
    
    const jsonData = data.map(item => {
      const exportItem = {};
      fields.forEach(field => {
        exportItem[field.label] = item[field.id] || null;
      });
      return exportItem;
    });

    const jsonContent = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `it-${dataType}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    success('Data exported as JSON');
  };

  const exportToExcel = () => {
    // For Excel, we'll export as CSV with .xlsx extension
    // In a real implementation, you'd use a library like xlsx
    showError('Excel export requires additional library. Exporting as CSV instead.');
    exportToCSV();
  };

  const handleExport = () => {
    if (selectedFields.length === 0) {
      showError('Please select at least one field to export');
      return;
    }

    switch (exportType) {
      case 'csv':
        exportToCSV();
        break;
      case 'json':
        exportToJSON();
        break;
      case 'excel':
        exportToExcel();
        break;
      default:
        showError('Invalid export format');
    }
  };

  const currentFields = fieldOptions[dataType] || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Export Data</h2>
              <p className="text-sm text-gray-600 mt-1">
                Export {dataType} data in your preferred format
              </p>
            </div>
            <Button variant="ghost" onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Export Format */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Export Format
            </Label>
            <div className="flex gap-4">
              <button
                onClick={() => setExportType('csv')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  exportType === 'csv'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
                CSV
              </button>
              <button
                onClick={() => setExportType('json')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  exportType === 'json'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileJson className="w-5 h-5" />
                JSON
              </button>
              <button
                onClick={() => setExportType('excel')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  exportType === 'excel'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-5 h-5" />
                Excel
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Filters (Optional)
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {dataType === 'requests' && (
                <>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">All Status</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </>
              )}
              <div>
                <Label className="text-xs">Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Date To</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="mt-3"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </Button>
          </div>

          {/* Field Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-gray-700">
                Select Fields to Export ({selectedFields.length} selected)
              </Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllFields}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllFields}>
                  Deselect All
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-3 border border-gray-200 rounded-lg">
              {currentFields.map(field => (
                <label
                  key={field.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field.id)}
                    onChange={() => toggleField(field.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Data Preview */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Preview ({data.length} records)
            </Label>
            <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
              {data.length === 0 ? (
                <p className="text-gray-500 text-sm">No data available</p>
              ) : (
                <div className="text-xs font-mono">
                  {JSON.stringify(data.slice(0, 2), null, 2)}
                  {data.length > 2 && <p className="text-gray-500 mt-2">... and {data.length - 2} more</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {data.length} record{data.length !== 1 ? 's' : ''} ready to export
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={selectedFields.length === 0 || data.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export {exportType.toUpperCase()}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ITDataExport;
