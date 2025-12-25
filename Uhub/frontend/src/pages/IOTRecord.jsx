import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Cpu, Plus, Edit, Trash2, Search, Download, Upload,
  X, Save, CheckCircle, AlertCircle, FileText, RefreshCw, XCircle, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import iotService from '../services/iotService';
import * as XLSX from 'xlsx';

const IOTRecord = () => {
  const [records, setRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]); // Store all records for client-side filtering
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    vehicle_id: '',
    hardware_id: '',
    title: '',
    sim_number: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const importFileInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    vehicle_id: '',
    hardware_id: '',
    title: '',
    sim_number: ''
  });

  // Fetch all records on component mount
  useEffect(() => {
    fetchRecords();
  }, []);

  // Debounced search and filter effect - fetches from server when search term or filters change
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search/filter
    searchTimeoutRef.current = setTimeout(() => {
      fetchRecords();
    }, 500);

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, filters]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      // Build filters object
      const apiFilters = {};
      
      // Add search term if present
      if (searchTerm.trim()) {
        apiFilters.search = searchTerm.trim();
      }
      
      // Add individual filter parameters
      if (filters.vehicle_id.trim()) {
        apiFilters.vehicle_id = filters.vehicle_id.trim();
      }
      if (filters.hardware_id.trim()) {
        apiFilters.hardware_id = filters.hardware_id.trim();
      }
      if (filters.title.trim()) {
        apiFilters.title = filters.title.trim();
      }
      if (filters.sim_number.trim()) {
        apiFilters.sim_number = filters.sim_number.trim();
      }
      
      const data = await iotService.getIOTRecords(apiFilters);
      setRecords(data || []);
      setAllRecords(data || []); // Store all records
    } catch (error) {
      showError('Error', `Failed to fetch records: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtered records for instant UI updates (combines search and filters)
  const filteredRecords = useMemo(() => {
    let filtered = [...records];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(record => 
        (record.vehicle_id && record.vehicle_id.toLowerCase().includes(searchLower)) ||
        (record.hardware_id && record.hardware_id.toLowerCase().includes(searchLower)) ||
        (record.title && record.title.toLowerCase().includes(searchLower)) ||
        (record.sim_number && record.sim_number.toLowerCase().includes(searchLower))
      );
    }

    // Apply individual filters
    if (filters.vehicle_id.trim()) {
      const filterLower = filters.vehicle_id.toLowerCase().trim();
      filtered = filtered.filter(record => 
        record.vehicle_id && record.vehicle_id.toLowerCase().includes(filterLower)
      );
    }
    
    if (filters.hardware_id.trim()) {
      const filterLower = filters.hardware_id.toLowerCase().trim();
      filtered = filtered.filter(record => 
        record.hardware_id && record.hardware_id.toLowerCase().includes(filterLower)
      );
    }
    
    if (filters.title.trim()) {
      const filterLower = filters.title.toLowerCase().trim();
      filtered = filtered.filter(record => 
        record.title && record.title.toLowerCase().includes(filterLower)
      );
    }
    
    if (filters.sim_number.trim()) {
      const filterLower = filters.sim_number.toLowerCase().trim();
      filtered = filtered.filter(record => 
        record.sim_number && record.sim_number.toLowerCase().includes(filterLower)
      );
    }

    return filtered;
  }, [records, searchTerm, filters]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      vehicle_id: '',
      hardware_id: '',
      title: '',
      sim_number: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value.trim() !== '');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.vehicle_id || !formData.hardware_id || !formData.title || !formData.sim_number) {
      showError('Validation Error', 'Please fill in all fields');
      return;
    }

    try {
      if (editingRecord) {
        await iotService.updateIOTRecord(editingRecord.id, formData);
        success('Success', 'IOT record updated successfully');
      } else {
        await iotService.createIOTRecord(formData);
        success('Success', 'IOT record created successfully');
      }
      
      resetForm();
      fetchRecords();
    } catch (error) {
      showError('Error', `Failed to save record: ${error.message}`);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      vehicle_id: record.vehicle_id || '',
      hardware_id: record.hardware_id || '',
      title: record.title || '',
      sim_number: record.sim_number || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      await iotService.deleteIOTRecord(id);
      success('Success', 'IOT record deleted successfully');
      fetchRecords();
    } catch (error) {
      showError('Error', `Failed to delete record: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      hardware_id: '',
      title: '',
      sim_number: ''
    });
    setEditingRecord(null);
    setShowForm(false);
  };

  // File Import Functions (CSV and Excel)
  const handleImportFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      const isCSV = fileName.endsWith('.csv');
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      
      if (!isCSV && !isExcel) {
        showError('Invalid File', 'Please select a CSV or Excel file (.csv, .xlsx, .xls)');
        return;
      }
      
      setImportFile(file);
      
      if (isCSV) {
        parseCSVFile(file);
      } else {
        parseExcelFile(file);
      }
    }
  };

  // Parse CSV file
  const parseCSVFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          showError('Invalid CSV', 'CSV file must have at least a header row and one data row');
          return;
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        
        const parsedData = parseDataFromHeaders(headers, lines.slice(1), 'CSV');
        
        if (parsedData.length === 0) {
          showError('No Data', 'No valid data rows found in CSV file');
          return;
        }

        setImportPreview(parsedData);
        setImportModalOpen(true);
      } catch (error) {
        showError('Parse Error', `Failed to parse CSV: ${error.message}`);
      }
    };
    reader.onerror = () => {
      showError('File Error', 'Failed to read file');
    };
    reader.readAsText(file);
  };

  // Parse Excel file
  const parseExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          showError('Invalid Excel', 'Excel file must have at least a header row and one data row');
          return;
        }

        // Parse header (first row)
        const headers = jsonData[0].map(h => String(h || '').trim().toLowerCase());
        
        // Parse data rows (skip first row)
        const parsedData = parseDataFromHeaders(headers, jsonData.slice(1), 'Excel');
        
        if (parsedData.length === 0) {
          showError('No Data', 'No valid data rows found in Excel file');
          return;
        }

        setImportPreview(parsedData);
        setImportModalOpen(true);
      } catch (error) {
        showError('Parse Error', `Failed to parse Excel file: ${error.message}`);
      }
    };
    reader.onerror = () => {
      showError('File Error', 'Failed to read file');
    };
    reader.readAsArrayBuffer(file);
  };

  // Common function to parse data from headers (works for both CSV and Excel)
  const parseDataFromHeaders = (headers, dataRows, fileType) => {
    // Map headers to our field names
    const headerMap = {
      'vehicle id': 'vehicle_id',
      'vehicle_id': 'vehicle_id',
      'hardware id': 'hardware_id',
      'hardware_id': 'hardware_id',
      'title': 'title',
      'sim number': 'sim_number',
      'sim_number': 'sim_number',
      'sim': 'sim_number'
    };

    // Find column indices
    const vehicleIdIndex = headers.findIndex(h => headerMap[h] === 'vehicle_id');
    const hardwareIdIndex = headers.findIndex(h => headerMap[h] === 'hardware_id');
    const titleIndex = headers.findIndex(h => headerMap[h] === 'title');
    const simNumberIndex = headers.findIndex(h => headerMap[h] === 'sim_number');

    if (vehicleIdIndex === -1 || hardwareIdIndex === -1 || titleIndex === -1 || simNumberIndex === -1) {
      showError(
        `Invalid ${fileType} Format`, 
        `${fileType} must contain columns: vehicle_id (or vehicle id), hardware_id (or hardware id), title, sim_number (or sim number or sim)`
      );
      return [];
    }

    // Parse data rows
    const parsedData = [];
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      // Handle both CSV (string array) and Excel (mixed array) formats
      const values = Array.isArray(row) 
        ? row.map(v => String(v || '').trim())
        : [];
      
      if (values.length >= Math.max(vehicleIdIndex, hardwareIdIndex, titleIndex, simNumberIndex) + 1) {
        parsedData.push({
          vehicle_id: values[vehicleIdIndex] || '',
          hardware_id: values[hardwareIdIndex] || '',
          title: values[titleIndex] || '',
          sim_number: values[simNumberIndex] || ''
        });
      }
    }

    return parsedData;
  };

  const handleImportConfirm = async () => {
    if (!importPreview || importPreview.length === 0) {
      showError('No Data', 'No data to import');
      return;
    }

    setImporting(true);
    try {
      // Filter out empty records
      const validRecords = importPreview.filter(record => 
        record.vehicle_id && record.hardware_id && record.title && record.sim_number
      );

      if (validRecords.length === 0) {
        showError('Invalid Data', 'No valid records found. All fields must be filled.');
        setImporting(false);
        return;
      }

      await iotService.bulkInsertIOTRecords(validRecords);
      success('Success', `Successfully imported ${validRecords.length} record(s)`);
      
      // Reset import state
      setImportFile(null);
      setImportPreview(null);
      setImportModalOpen(false);
      if (importFileInputRef.current) {
        importFileInputRef.current.value = '';
      }
      
      // Refresh records
      fetchRecords();
    } catch (error) {
      showError('Import Error', `Failed to import records: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  // CSV Export Function - Export filtered results if search is active, otherwise all records
  const handleExport = () => {
    const recordsToExport = filteredRecords.length > 0 ? filteredRecords : records;
    
    if (recordsToExport.length === 0) {
      showError('No Data', 'No records to export');
      return;
    }

    // Create CSV headers
    const headers = ['Vehicle ID', 'Hardware ID', 'Title', 'SIM Number'];
    
    // Create CSV rows
    const csvRows = recordsToExport.map(record => [
      record.vehicle_id || '',
      record.hardware_id || '',
      record.title || '',
      record.sim_number || ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = searchTerm 
      ? `iot_records_filtered_${new Date().toISOString().split('T')[0]}.csv`
      : `iot_records_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    success('Success', `Exported ${recordsToExport.length} record(s) successfully`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Cpu className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">IOT Record</h1>
                <p className="text-gray-600 mt-1">Manage and track IoT device records</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={filteredRecords.length === 0}
                title={(searchTerm || hasActiveFilters) ? `Export ${filteredRecords.length} filtered record(s)` : 'Export all records'}
              >
                <Download className="w-4 h-4" />
                {(searchTerm || hasActiveFilters) ? `Export (${filteredRecords.length})` : 'Export CSV'}
              </button>
              <button
                onClick={() => {
                  setImportModalOpen(true);
                  setTimeout(() => importFileInputRef.current?.click(), 100);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import File
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Record
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by vehicle ID, hardware ID, title, or SIM number..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear search"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                hasActiveFilters 
                  ? 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Toggle filters"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {Object.values(filters).filter(v => v.trim()).length}
                </span>
              )}
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={fetchRecords}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Refresh records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Vehicle ID Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Filter by Vehicle ID..."
                        value={filters.vehicle_id}
                        onChange={(e) => handleFilterChange('vehicle_id', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      {filters.vehicle_id && (
                        <button
                          onClick={() => handleFilterChange('vehicle_id', '')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hardware ID Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hardware ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Filter by Hardware ID..."
                        value={filters.hardware_id}
                        onChange={(e) => handleFilterChange('hardware_id', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      {filters.hardware_id && (
                        <button
                          onClick={() => handleFilterChange('hardware_id', '')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Filter by Title..."
                        value={filters.title}
                        onChange={(e) => handleFilterChange('title', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      {filters.title && (
                        <button
                          onClick={() => handleFilterChange('title', '')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SIM Number Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SIM Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Filter by SIM Number..."
                        value={filters.sim_number}
                        onChange={(e) => handleFilterChange('sim_number', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      {filters.sim_number && (
                        <button
                          onClick={() => handleFilterChange('sim_number', '')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear All Filters
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search/Filter Results Summary */}
          {(searchTerm || hasActiveFilters) && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredRecords.length}</span> result{filteredRecords.length !== 1 ? 's' : ''}
                {searchTerm && ` for "${searchTerm}"`}
                {hasActiveFilters && ` with ${Object.values(filters).filter(v => v.trim()).length} filter${Object.values(filters).filter(v => v.trim()).length !== 1 ? 's' : ''}`}
              </span>
              {filteredRecords.length === 0 && records.length > 0 && (
                <span className="text-orange-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  No matches found
                </span>
              )}
            </div>
          )}
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading && !records.length ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {(searchTerm || hasActiveFilters) ? 'No records found matching your search/filters' : 'No records found'}
              </p>
              {(searchTerm || hasActiveFilters) && (
                <div className="flex items-center gap-3 justify-center">
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Clear search
                    </button>
                  )}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hardware ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SIM Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => {
                    const searchLower = searchTerm.toLowerCase();
                    const highlightText = (text, search) => {
                      if (!search || !text) return text;
                      const parts = text.split(new RegExp(`(${search})`, 'gi'));
                      return parts.map((part, i) => 
                        part.toLowerCase() === search.toLowerCase() ? (
                          <mark key={i} className="bg-yellow-200 text-gray-900 px-1 rounded">
                            {part}
                          </mark>
                        ) : part
                      );
                    };

                    return (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {searchTerm ? highlightText(record.vehicle_id, searchTerm) : record.vehicle_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {searchTerm ? highlightText(record.hardware_id, searchTerm) : record.hardware_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {searchTerm ? highlightText(record.title, searchTerm) : record.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {searchTerm ? highlightText(record.sim_number, searchTerm) : record.sim_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Edit record"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={resetForm}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingRecord ? 'Edit IOT Record' : 'Add New IOT Record'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle ID *
                    </label>
                    <input
                      type="text"
                      name="vehicle_id"
                      value={formData.vehicle_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hardware ID *
                    </label>
                    <input
                      type="text"
                      name="hardware_id"
                      value={formData.hardware_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SIM Number *
                    </label>
                    <input
                      type="text"
                      name="sim_number"
                      value={formData.sim_number}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingRecord ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Import Modal */}
        <AnimatePresence>
          {importModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => {
                if (!importing) {
                  setImportModalOpen(false);
                  setImportPreview(null);
                  setImportFile(null);
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Import File (CSV/Excel)</h2>
                  <button
                    onClick={() => {
                      if (!importing) {
                        setImportModalOpen(false);
                        setImportPreview(null);
                        setImportFile(null);
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={importing}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleImportFileSelect}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {importFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{importFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(importFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">
                          Click to select CSV or Excel file or drag and drop
                        </p>
                        <p className="text-sm text-gray-500 mb-2">
                          Supported formats: .csv, .xlsx, .xls
                        </p>
                        <p className="text-sm text-gray-500">
                          File must contain: vehicle_id, hardware_id, title, sim_number
                        </p>
                        <button
                          onClick={() => importFileInputRef.current?.click()}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Select File
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {importPreview && importPreview.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Preview ({importPreview.length} records)
                    </h3>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Vehicle ID</th>
                            <th className="px-4 py-2 text-left">Hardware ID</th>
                            <th className="px-4 py-2 text-left">Title</th>
                            <th className="px-4 py-2 text-left">SIM Number</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {importPreview.slice(0, 10).map((record, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2">{record.vehicle_id}</td>
                              <td className="px-4 py-2">{record.hardware_id}</td>
                              <td className="px-4 py-2">{record.title}</td>
                              <td className="px-4 py-2">{record.sim_number}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importPreview.length > 10 && (
                        <p className="p-4 text-sm text-gray-500 text-center">
                          Showing first 10 of {importPreview.length} records
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      if (!importing) {
                        setImportModalOpen(false);
                        setImportPreview(null);
                        setImportFile(null);
                      }
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={importing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportConfirm}
                    disabled={!importPreview || importing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Import {importPreview?.length || 0} Records
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
// hi there, munib was here

export default IOTRecord;
