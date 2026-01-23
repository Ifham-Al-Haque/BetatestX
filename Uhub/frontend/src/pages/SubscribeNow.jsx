import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Bell, 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  UserCheck,
  FileText,
  TrendingUp,
  ChevronRight,
  Eye,
  Edit,
  Trash,
  Download,
  Upload,
  Target,
  Award,
  Building,
  Shield,
  Monitor,
  Briefcase,
  Key,
  CreditCard,
  AlertTriangle,
  Clock,
  Star,
  Heart,
  Zap,
  BarChart3,
  Car,
  Users,
  Truck,
  Settings,
  Activity,
  RefreshCw,
  SlidersHorizontal,
  MapPin,
  Circle,
  DollarSign,
  Phone,
  Mail,
  User,
  CheckCircle,
  XCircle,
  Loader,
  PieChart as PieChartIcon,
  X,
  Save,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import subscribeNowService from '../services/subscribeNowService';
import ltrReportingService from '../services/ltrReportingService';
import RentalAgreementModal from '../components/subscribeNow/RentalAgreementModal';
import DeliveryChecklistModal from '../components/subscribeNow/DeliveryChecklistModal';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const SubscribeNow = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('fleet-delivery');
  const [rentalAgreements, setRentalAgreements] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [fleetServices, setFleetServices] = useState([]);
  const [serviceStatistics, setServiceStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [agreementStatusFilter, setAgreementStatusFilter] = useState('');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // LTR Reporting state
  const [ltrRecords, setLtrRecords] = useState([]);
  const [ltrLoading, setLtrLoading] = useState(false);
  const [ltrSearchTerm, setLtrSearchTerm] = useState('');
  const [ltrShowFilters, setLtrShowFilters] = useState(false);
  const [ltrFilters, setLtrFilters] = useState({
    customer_id: '',
    name: '',
    plate_reservation: '',
    title: '',
    period: ''
  });
  const [ltrShowForm, setLtrShowForm] = useState(false);
  const [ltrEditingRecord, setLtrEditingRecord] = useState(null);
  const [ltrImportModalOpen, setLtrImportModalOpen] = useState(false);
  const [ltrImportFile, setLtrImportFile] = useState(null);
  const [ltrImportPreview, setLtrImportPreview] = useState(null);
  const [ltrImporting, setLtrImporting] = useState(false);
  const ltrFileInputRef = useRef(null);
  const ltrImportFileInputRef = useRef(null);
  const ltrSearchTimeoutRef = useRef(null);
  
  const { success, error: showError } = useToast();

  const [ltrFormData, setLtrFormData] = useState({
    customer_id: '',
    name: '',
    plate_reservation: '',
    title: '',
    amount: '',
    period: '',
    start_time: ''
  });

  useEffect(() => {
    // Check for URL hash to set active tab
    const hash = window.location.hash;
    if (hash === '#ltr-reporting') {
      setActiveTab('ltr-reporting');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'fleet-delivery') {
      loadFleetDeliveryData();
    } else if (activeTab === 'services') {
      loadFleetServiceData();
    } else if (activeTab === 'ltr-reporting') {
      fetchLTRRecords();
    }
  }, [activeTab]);

  // Debounced search and filter effect for LTR Reporting
  useEffect(() => {
    if (activeTab === 'ltr-reporting') {
      if (ltrSearchTimeoutRef.current) {
        clearTimeout(ltrSearchTimeoutRef.current);
      }
      ltrSearchTimeoutRef.current = setTimeout(() => {
        fetchLTRRecords();
      }, 500);
      return () => {
        if (ltrSearchTimeoutRef.current) {
          clearTimeout(ltrSearchTimeoutRef.current);
        }
      };
    }
  }, [ltrSearchTerm, ltrFilters, activeTab]);

  useEffect(() => {
    if (activeTab === 'fleet-delivery') {
      const delayedSearch = setTimeout(() => {
        if (searchTerm || agreementStatusFilter || deliveryStatusFilter || customerTypeFilter || dateFrom || dateTo) {
          loadRentalAgreements();
        }
      }, 300);

      return () => clearTimeout(delayedSearch);
    }
  }, [searchTerm, agreementStatusFilter, deliveryStatusFilter, customerTypeFilter, dateFrom, dateTo, activeTab]);

  const loadFleetDeliveryData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadRentalAgreements(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Error loading fleet delivery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRentalAgreements = async () => {
    try {
      const filters = {
        agreement_status: agreementStatusFilter,
        delivery_status: deliveryStatusFilter,
        customer_type: customerTypeFilter,
        search: searchTerm,
        date_from: dateFrom,
        date_to: dateTo
      };

      const data = await subscribeNowService.getRentalAgreements(filters);
      setRentalAgreements(data);
    } catch (error) {
      console.error('Error loading rental agreements:', error);
      setRentalAgreements([]);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await subscribeNowService.getDeliveryStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadFleetServiceData = async () => {
    try {
      setLoading(true);
      const serviceData = await subscribeNowService.getFleetServiceDetails();
      setFleetServices(serviceData.services);
      setServiceStatistics(serviceData.statistics);
    } catch (error) {
      console.error('Error loading fleet service data:', error);
      setFleetServices([]);
      setServiceStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'fleet-delivery') {
      await loadFleetDeliveryData();
    } else if (activeTab === 'services') {
      await loadFleetServiceData();
    }
    setRefreshing(false);
  };

  const handleCreateRental = () => {
    setSelectedRental(null);
    setShowCreateModal(true);
  };

  const handleEditRental = (rental) => {
    setSelectedRental(rental);
    setShowCreateModal(true);
  };

  const handleViewChecklist = (rental) => {
    setSelectedRental(rental);
    setShowChecklistModal(true);
  };

  const handleModalSuccess = () => {
    setShowCreateModal(false);
    setShowChecklistModal(false);
    setSelectedRental(null);
    if (activeTab === 'fleet-delivery') {
      loadFleetDeliveryData();
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setAgreementStatusFilter('');
    setDeliveryStatusFilter('');
    setCustomerTypeFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const getAgreementStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending approval': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDeliveryStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return CheckCircle;
      case 'in progress': return Settings;
      case 'pending': return Clock;
      case 'failed': return XCircle;
      case 'approved': return CheckCircle;
      case 'active': return Activity;
      default: return Clock;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format currency for LTR Reporting (AED)
  const formatCurrencyAED = (amount) => {
    if (!amount) return 'AED 0.00';
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // LTR Reporting Functions
  const fetchLTRRecords = async () => {
    setLtrLoading(true);
    try {
      const apiFilters = {};
      if (ltrSearchTerm.trim()) {
        apiFilters.search = ltrSearchTerm.trim();
      }
      if (ltrFilters.customer_id.trim()) {
        apiFilters.customer_id = ltrFilters.customer_id.trim();
      }
      if (ltrFilters.name.trim()) {
        apiFilters.name = ltrFilters.name.trim();
      }
      if (ltrFilters.plate_reservation.trim()) {
        apiFilters.plate_reservation = ltrFilters.plate_reservation.trim();
      }
      if (ltrFilters.title.trim()) {
        apiFilters.title = ltrFilters.title.trim();
      }
      if (ltrFilters.period.trim()) {
        apiFilters.period = ltrFilters.period.trim();
      }
      
      const data = await ltrReportingService.getLTRRecords(apiFilters);
      setLtrRecords(data || []);
    } catch (error) {
      showError('Error', `Failed to fetch LTR records: ${error.message}`);
    } finally {
      setLtrLoading(false);
    }
  };

  // Client-side filtered records for instant UI updates
  const filteredLTRRecords = useMemo(() => {
    let filtered = [...ltrRecords];

    if (ltrSearchTerm.trim()) {
      const searchLower = ltrSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(record => 
        (record.customer_id && record.customer_id.toLowerCase().includes(searchLower)) ||
        (record.name && record.name.toLowerCase().includes(searchLower)) ||
        (record.plate_reservation && record.plate_reservation.toLowerCase().includes(searchLower)) ||
        (record.title && record.title.toLowerCase().includes(searchLower)) ||
        (record.period && record.period.toLowerCase().includes(searchLower))
      );
    }

    if (ltrFilters.customer_id.trim()) {
      const filterLower = ltrFilters.customer_id.toLowerCase().trim();
      filtered = filtered.filter(record => 
        record.customer_id && record.customer_id.toLowerCase().includes(filterLower)
      );
    }
    if (ltrFilters.name.trim()) {
      const filterLower = ltrFilters.name.toLowerCase().trim();
      filtered = filtered.filter(record => 
        record.name && record.name.toLowerCase().includes(filterLower)
      );
    }
    if (ltrFilters.plate_reservation.trim()) {
      const filterLower = ltrFilters.plate_reservation.toLowerCase().trim();
      filtered = filtered.filter(record => 
        record.plate_reservation && record.plate_reservation.toLowerCase().includes(filterLower)
      );
    }
    if (ltrFilters.title.trim()) {
      const filterLower = ltrFilters.title.toLowerCase().trim();
      filtered = filtered.filter(record => 
        record.title && record.title.toLowerCase().includes(filterLower)
      );
    }
    if (ltrFilters.period.trim()) {
      const filterLower = ltrFilters.period.toLowerCase().trim();
      filtered = filtered.filter(record => 
        record.period && record.period.toLowerCase().includes(filterLower)
      );
    }

    return filtered;
  }, [ltrRecords, ltrSearchTerm, ltrFilters]);

  // Normalize period string to handle variations (e.g., "6 months", "6 Months", "6 month" -> "6 Months")
  const normalizePeriod = (period) => {
    if (!period || period.trim() === '') return 'Not Specified';
    
    const normalized = period.trim();
    
    // Handle common variations
    const periodMap = {
      'monthly': 'Monthly',
      '1 month': '1 Month',
      '1 months': '1 Month',
      '3 month': '3 Months',
      '3 months': '3 Months',
      '6 month': '6 Months',
      '6 months': '6 Months',
      '12 month': '12 Months',
      '12 months': '12 Months',
      '<1 month': '<1 Month',
      '1-3 months': '1-3 Months',
      '3-6 months': '3-6 Months',
      '6-12 months': '6-12 Months',
      '>12 months': '>12 Months'
    };

    // Check for exact match (case-insensitive)
    const lowerPeriod = normalized.toLowerCase();
    if (periodMap[lowerPeriod]) {
      return periodMap[lowerPeriod];
    }

    // Try to match patterns (e.g., "X month(s)")
    const monthMatch = normalized.match(/^(\d+)\s*month(s)?$/i);
    if (monthMatch) {
      const num = monthMatch[1];
      return `${num} Month${parseInt(num) > 1 ? 's' : ''}`;
    }

    // Capitalize first letter of each word if not already normalized
    return normalized.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Process period data for chart visualization with normalization
  const periodChartData = useMemo(() => {
    if (!ltrRecords || ltrRecords.length === 0) return [];

    // Group records by normalized period
    const periodCounts = {};
    const periodAmounts = {};

    ltrRecords.forEach(record => {
      const normalizedPeriod = normalizePeriod(record.period);
      periodCounts[normalizedPeriod] = (periodCounts[normalizedPeriod] || 0) + 1;
      periodAmounts[normalizedPeriod] = (periodAmounts[normalizedPeriod] || 0) + (parseFloat(record.amount) || 0);
    });

    // Convert to array format for chart
    const chartData = Object.keys(periodCounts).map(period => ({
      period: period,
      count: periodCounts[period],
      totalAmount: periodAmounts[period],
      percentage: ((periodCounts[period] / ltrRecords.length) * 100).toFixed(1)
    }));

    // Sort by count (descending)
    return chartData.sort((a, b) => b.count - a.count);
  }, [ltrRecords]);

  // Enhanced chart colors with gradients
  const CHART_COLORS = [
    '#8B5CF6', // Purple
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#84CC16', // Lime
    '#6366F1', // Indigo
    '#A855F7'  // Violet
  ];

  const hasActiveLTRFilters = Object.values(ltrFilters).some(v => v.trim());

  const handleLTRSearch = (e) => {
    setLtrSearchTerm(e.target.value);
  };

  const clearLTRSearch = () => {
    setLtrSearchTerm('');
  };

  const handleLTRFilterChange = (field, value) => {
    setLtrFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearLTRFilters = () => {
    setLtrFilters({
      customer_id: '',
      name: '',
      plate_reservation: '',
      title: '',
      period: ''
    });
  };

  const handleLTRSubmit = async (e) => {
    e.preventDefault();
    try {
      // Parse start_time if provided (handles datetime-local input format)
      let startTimeValue = null;
      if (ltrFormData.start_time) {
        // If it's already in ISO format from datetime-local input, use it directly
        if (ltrFormData.start_time.includes('T')) {
          startTimeValue = new Date(ltrFormData.start_time).toISOString();
        } else {
          // Otherwise, parse it using our date parser
          startTimeValue = parseDateToISO(ltrFormData.start_time);
        }
      }

      const recordData = {
        customer_id: ltrFormData.customer_id,
        name: ltrFormData.name,
        plate_reservation: ltrFormData.plate_reservation || null,
        title: ltrFormData.title || null,
        amount: ltrFormData.amount ? parseFloat(ltrFormData.amount) : null,
        period: ltrFormData.period || null,
        start_time: startTimeValue
      };

      if (ltrEditingRecord) {
        await ltrReportingService.updateLTRRecord(ltrEditingRecord.id, recordData);
        success('Success', 'LTR record updated successfully');
      } else {
        await ltrReportingService.createLTRRecord(recordData);
        success('Success', 'LTR record created successfully');
      }
      
      resetLTRForm();
      fetchLTRRecords();
    } catch (error) {
      showError('Error', `Failed to save record: ${error.message}`);
    }
  };

  const handleLTREdit = (record) => {
    setLtrEditingRecord(record);
    setLtrFormData({
      customer_id: record.customer_id || '',
      name: record.name || '',
      plate_reservation: record.plate_reservation || '',
      title: record.title || '',
      amount: record.amount ? String(record.amount) : '',
      period: record.period || '',
      start_time: record.start_time ? new Date(record.start_time).toISOString().slice(0, 16) : ''
    });
    setLtrShowForm(true);
  };

  const handleLTRDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      await ltrReportingService.deleteLTRRecord(id);
      success('Success', 'LTR record deleted successfully');
      fetchLTRRecords();
    } catch (error) {
      showError('Error', `Failed to delete record: ${error.message}`);
    }
  };

  const resetLTRForm = () => {
    setLtrFormData({
      customer_id: '',
      name: '',
      plate_reservation: '',
      title: '',
      amount: '',
      period: '',
      start_time: ''
    });
    setLtrEditingRecord(null);
    setLtrShowForm(false);
  };

  // Helper function to parse and normalize date strings to ISO 8601 format
  const parseDateToISO = (dateString) => {
    if (!dateString || typeof dateString !== 'string') {
      return null;
    }

    const trimmed = dateString.trim();
    if (!trimmed) {
      return null;
    }

    // If already in ISO format, return as is
    if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(trimmed)) {
      // If it's just a date, add time component
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return `${trimmed}T00:00:00`;
      }
      return trimmed;
    }

    // Try to parse various date formats
    let parsedDate = null;

    // Handle DD/MM/YYYY or DD-MM-YYYY format (e.g., "22/04/2024" or "22-04-2024")
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(\s+(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10);
      const year = parseInt(ddmmyyyyMatch[3], 10);
      const hour = ddmmyyyyMatch[5] ? parseInt(ddmmyyyyMatch[5], 10) : 0;
      const minute = ddmmyyyyMatch[6] ? parseInt(ddmmyyyyMatch[6], 10) : 0;
      const second = ddmmyyyyMatch[8] ? parseInt(ddmmyyyyMatch[8], 10) : 0;
      
      // Check if day > 12, then it's definitely DD/MM/YYYY, otherwise assume DD/MM/YYYY
      if (day > 12 || month > 12) {
        parsedDate = new Date(year, month - 1, day, hour, minute, second);
      } else {
        // Ambiguous - try DD/MM/YYYY first (more common internationally)
        parsedDate = new Date(year, month - 1, day, hour, minute, second);
        if (isNaN(parsedDate.getTime())) {
          // If invalid, try MM/DD/YYYY
          parsedDate = new Date(year, day - 1, month, hour, minute, second);
        }
      }
    }

    // Handle MM/DD/YYYY or MM-DD-YYYY format (e.g., "04/22/2024")
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      const mmddyyyyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(\s+(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?/);
      if (mmddyyyyMatch) {
        const month = parseInt(mmddyyyyMatch[1], 10);
        const day = parseInt(mmddyyyyMatch[2], 10);
        const year = parseInt(mmddyyyyMatch[3], 10);
        const hour = mmddyyyyMatch[5] ? parseInt(mmddyyyyMatch[5], 10) : 0;
        const minute = mmddyyyyMatch[6] ? parseInt(mmddyyyyMatch[6], 10) : 0;
        const second = mmddyyyyMatch[8] ? parseInt(mmddyyyyMatch[8], 10) : 0;
        parsedDate = new Date(year, month - 1, day, hour, minute, second);
      }
    }

    // Try standard Date parsing as fallback
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      parsedDate = new Date(trimmed);
    }

    // If still invalid, return null
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      return null;
    }

    // Convert to ISO 8601 format
    return parsedDate.toISOString();
  };

  // File Import Functions (CSV and Excel)
  const handleLTRImportFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      const isCSV = fileName.endsWith('.csv');
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      
      if (!isCSV && !isExcel) {
        showError('Invalid File', 'Please select a CSV or Excel file (.csv, .xlsx, .xls)');
        return;
      }
      
      setLtrImportFile(file);
      
      if (isCSV) {
        parseLTRCSVFile(file);
      } else {
        parseLTRExcelFile(file);
      }
    }
  };

  const parseLTRCSVFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Use XLSX to parse CSV properly (handles quoted values, commas in fields, etc.)
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          showError('Invalid CSV', 'CSV file must have at least a header row and one data row');
          return;
        }

        const headers = jsonData[0].map(h => String(h || '').trim().toLowerCase());
        const parsedData = parseLTRDataFromHeaders(headers, jsonData.slice(1), 'CSV');
        
        if (parsedData.length === 0) {
          showError('No Data', 'No valid data rows found in CSV file. Please ensure your CSV has customer_id and name columns.');
          return;
        }

        setLtrImportPreview(parsedData);
        setLtrImportModalOpen(true);
      } catch (error) {
        showError('Parse Error', `Failed to parse CSV: ${error.message}`);
      }
    };
    reader.onerror = () => {
      showError('File Error', 'Failed to read file');
    };
    reader.readAsArrayBuffer(file);
  };

  const parseLTRExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          showError('Invalid Excel', 'Excel file must have at least a header row and one data row');
          return;
        }

        const headers = jsonData[0].map(h => String(h || '').trim().toLowerCase());
        const parsedData = parseLTRDataFromHeaders(headers, jsonData.slice(1), 'Excel');
        
        if (parsedData.length === 0) {
          showError('No Data', 'No valid data rows found in Excel file');
          return;
        }

        setLtrImportPreview(parsedData);
        setLtrImportModalOpen(true);
      } catch (error) {
        showError('Parse Error', `Failed to parse Excel file: ${error.message}`);
      }
    };
    reader.onerror = () => {
      showError('File Error', 'Failed to read file');
    };
    reader.readAsArrayBuffer(file);
  };

  const parseLTRDataFromHeaders = (headers, dataRows, fileType) => {
    const headerMap = {
      'customer id': 'customer_id',
      'customer_id': 'customer_id',
      'customerid': 'customer_id',
      'name': 'name',
      'plate reservation': 'plate_reservation',
      'plate_reservation': 'plate_reservation',
      'platereservation': 'plate_reservation',
      'plate': 'plate_reservation',
      'title': 'title',
      'amount': 'amount',
      'period': 'period',
      'start time': 'start_time',
      'start_time': 'start_time',
      'starttime': 'start_time',
      'start': 'start_time'
    };

    // Find column indices using headerMap
    const customerIdIndex = headers.findIndex(h => {
      const normalized = h.trim().toLowerCase();
      return headerMap[normalized] === 'customer_id';
    });
    const nameIndex = headers.findIndex(h => {
      const normalized = h.trim().toLowerCase();
      return headerMap[normalized] === 'name' || normalized === 'name';
    });
    const plateReservationIndex = headers.findIndex(h => {
      const normalized = h.trim().toLowerCase();
      return headerMap[normalized] === 'plate_reservation';
    });
    const titleIndex = headers.findIndex(h => {
      const normalized = h.trim().toLowerCase();
      return headerMap[normalized] === 'title' || normalized === 'title';
    });
    const amountIndex = headers.findIndex(h => {
      const normalized = h.trim().toLowerCase();
      return headerMap[normalized] === 'amount' || normalized === 'amount';
    });
    const periodIndex = headers.findIndex(h => {
      const normalized = h.trim().toLowerCase();
      return headerMap[normalized] === 'period' || normalized === 'period';
    });
    const startTimeIndex = headers.findIndex(h => {
      const normalized = h.trim().toLowerCase();
      return headerMap[normalized] === 'start_time';
    });

    if (customerIdIndex === -1 || nameIndex === -1) {
      showError(
        `Invalid ${fileType} Format`, 
        `${fileType} must contain columns: customer_id (or customer id), name. Found columns: ${headers.join(', ')}`
      );
      return [];
    }

    const parsedData = [];
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      // Ensure row is an array
      const values = Array.isArray(row) 
        ? row.map(v => {
            // Handle null, undefined, and convert to string
            if (v === null || v === undefined) return '';
            return String(v).trim();
          })
        : [];
      
      // Skip empty rows
      if (values.length === 0 || values.every(v => !v)) {
        continue;
      }
      
      // Check if we have enough columns
      const maxIndex = Math.max(customerIdIndex, nameIndex);
      if (values.length > maxIndex) {
        const customerId = values[customerIdIndex] || '';
        const name = values[nameIndex] || '';
        
        // Only add record if both required fields have values
        if (customerId && name) {
          const record = {
            customer_id: customerId,
            name: name
          };
          
          if (plateReservationIndex !== -1 && values.length > plateReservationIndex && values[plateReservationIndex]) {
            record.plate_reservation = values[plateReservationIndex];
          }
          if (titleIndex !== -1 && values.length > titleIndex && values[titleIndex]) {
            record.title = values[titleIndex];
          }
          if (amountIndex !== -1 && values.length > amountIndex && values[amountIndex]) {
            const amount = parseFloat(values[amountIndex]);
            record.amount = isNaN(amount) ? null : amount;
          }
          if (periodIndex !== -1 && values.length > periodIndex && values[periodIndex]) {
            record.period = values[periodIndex];
          }
          if (startTimeIndex !== -1 && values.length > startTimeIndex && values[startTimeIndex]) {
            const dateValue = values[startTimeIndex];
            // Parse and normalize the date to ISO 8601 format
            const normalizedDate = parseDateToISO(dateValue);
            if (normalizedDate) {
              record.start_time = normalizedDate;
            } else {
              // If date parsing fails, skip this field (don't add invalid date)
              // You could also log a warning here
            }
          }
          
          parsedData.push(record);
        }
      }
    }

    return parsedData;
  };

  const handleLTRImportConfirm = async () => {
    if (!ltrImportPreview || ltrImportPreview.length === 0) {
      showError('No Data', 'No data to import');
      return;
    }

    setLtrImporting(true);
    try {
      const validRecords = ltrImportPreview.filter(record => 
        record.customer_id && record.name
      );

      if (validRecords.length === 0) {
        showError('Invalid Data', 'No valid records found. Customer ID and Name are required.');
        setLtrImporting(false);
        return;
      }

      await ltrReportingService.bulkInsertLTRRecords(validRecords);
      success('Success', `Successfully imported ${validRecords.length} record(s)`);
      
      setLtrImportFile(null);
      setLtrImportPreview(null);
      setLtrImportModalOpen(false);
      if (ltrImportFileInputRef.current) {
        ltrImportFileInputRef.current.value = '';
      }
      
      fetchLTRRecords();
    } catch (error) {
      showError('Import Error', `Failed to import records: ${error.message}`);
    } finally {
      setLtrImporting(false);
    }
  };

  // Export Functions (CSV and Excel)
  const handleLTRExport = (format = 'csv') => {
    const recordsToExport = filteredLTRRecords.length > 0 ? filteredLTRRecords : ltrRecords;
    
    if (recordsToExport.length === 0) {
      showError('No Data', 'No records to export');
      return;
    }

    if (format === 'csv') {
      const headers = ['Customer ID', 'Name', 'Plate Reservation', 'Title', 'Amount', 'Period', 'Start Time'];
      const csvRows = recordsToExport.map(record => [
        record.customer_id || '',
        record.name || '',
        record.plate_reservation || '',
        record.title || '',
        record.amount || '',
        record.period || '',
        record.start_time ? new Date(record.start_time).toLocaleString() : ''
      ]);

      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const fileName = ltrSearchTerm || hasActiveLTRFilters
        ? `ltr_reporting_filtered_${new Date().toISOString().split('T')[0]}.csv`
        : `ltr_reporting_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      success('Success', `Exported ${recordsToExport.length} record(s) as CSV`);
    } else if (format === 'excel') {
      const headers = ['Customer ID', 'Name', 'Plate Reservation', 'Title', 'Amount', 'Period', 'Start Time'];
      const data = recordsToExport.map(record => [
        record.customer_id || '',
        record.name || '',
        record.plate_reservation || '',
        record.title || '',
        record.amount || '',
        record.period || '',
        record.start_time ? new Date(record.start_time).toLocaleString() : ''
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'LTR Reporting');
      
      const fileName = ltrSearchTerm || hasActiveLTRFilters
        ? `ltr_reporting_filtered_${new Date().toISOString().split('T')[0]}.xlsx`
        : `ltr_reporting_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      XLSX.writeFile(workbook, fileName);
      success('Success', `Exported ${recordsToExport.length} record(s) as Excel`);
    }
  };

  if (loading && activeTab === 'fleet-delivery') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <Truck className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-700 font-medium">Loading Subscribe Now...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header with Tabs */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-3 rounded-2xl mr-4">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                Subscribe Now Department
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Fleet delivery management and subscription services
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {activeTab === 'fleet-delivery' && (
                <>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl border border-gray-300 flex items-center transition-all shadow-sm"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl border border-gray-300 flex items-center transition-all shadow-sm"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </button>
                  <button
                    onClick={handleCreateRental}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl flex items-center transition-all shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    New Rental
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('fleet-delivery')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'fleet-delivery'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Truck className="w-4 h-4 inline mr-2" />
                  Fleet Delivery
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'services'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Bell className="w-4 h-4 inline mr-2" />
                  Subscription Services
                </button>
                <button
                  onClick={() => setActiveTab('ltr-reporting')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'ltr-reporting'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  LTR Reporting
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'fleet-delivery' && (
          <div>
            {/* Enhanced Stats Cards for Fleet Delivery */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Rentals</p>
                    <p className="text-3xl font-bold text-gray-900">{statistics?.totalRentals || rentalAgreements.length}</p>
                    <p className="text-sm text-purple-600 mt-1">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      All time
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-100">
                    <FileText className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Delivered</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {statistics?.deliveryStatusBreakdown?.Completed || rentalAgreements.filter(r => r.delivery_status === 'Completed').length}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Successfully delivered
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-green-100">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {statistics?.deliveryStatusBreakdown?.['In Progress'] || rentalAgreements.filter(r => r.delivery_status === 'In Progress').length}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      <Activity className="w-4 h-4 inline mr-1" />
                      Active deliveries
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-100">
                    <Settings className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(statistics?.totalRevenue || rentalAgreements.reduce((sum, r) => sum + (r.confirmed_amount || 0), 0))}
                    </p>
                    <p className="text-sm text-orange-600 mt-1">
                      <BarChart3 className="w-4 h-4 inline mr-1" />
                      Confirmed amount
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-orange-100">
                    <DollarSign className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Enhanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search rentals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Agreement Status</label>
                        <select
                          value={agreementStatusFilter}
                          onChange={(e) => setAgreementStatusFilter(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="">All Status</option>
                          <option value="Draft">Draft</option>
                          <option value="Pending Approval">Pending Approval</option>
                          <option value="Approved">Approved</option>
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Status</label>
                        <select
                          value={deliveryStatusFilter}
                          onChange={(e) => setDeliveryStatusFilter(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="">All Status</option>
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
                        <select
                          value={customerTypeFilter}
                          onChange={(e) => setCustomerTypeFilter(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="">All Types</option>
                          <option value="Individual">Individual</option>
                          <option value="Corporate">Corporate</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={clearFilters}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        Clear Filters
                      </button>
                      <span className="text-sm text-gray-500">
                        Showing {rentalAgreements.length} rental agreements
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Rental Agreements List */}
            <div className="space-y-4">
              {rentalAgreements.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl shadow-lg p-12 text-center"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No rental agreements found</h3>
                  <p className="text-gray-600 mb-6">Start by creating your first rental agreement for a customer.</p>
                  <button
                    onClick={handleCreateRental}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl flex items-center mx-auto transition-all"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create First Rental
                  </button>
                </motion.div>
              ) : (
                rentalAgreements.map((rental, index) => {
                  const AgreementStatusIcon = getStatusIcon(rental.agreement_status);
                  const DeliveryStatusIcon = getStatusIcon(rental.delivery_status);
                  
                  return (
                    <motion.div
                      key={rental.rental_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">
                                {rental.rental_agreement_id}
                              </h3>
                              <p className="text-gray-600 mt-1">
                                {rental.customer_name} ({rental.customer_code})
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {rental.email}
                                </span>
                                <span className="flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {rental.phone}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getAgreementStatusColor(rental.agreement_status)}`}>
                              <AgreementStatusIcon className="w-4 h-4 inline mr-1" />
                              {rental.agreement_status}
                            </span>
                            
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDeliveryStatusColor(rental.delivery_status)}`}>
                              <DeliveryStatusIcon className="w-4 h-4 inline mr-1" />
                              {rental.delivery_status}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Delivery Progress</span>
                            <span className="text-sm text-gray-500">{rental.delivery_progress || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${rental.delivery_progress || 0}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Desired Fleet</p>
                              <p className="font-medium text-gray-900">{rental.desired_fleet_type}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Rental Amount</p>
                              <div className="font-medium text-gray-900">
                                {rental.original_rental_amount !== rental.confirmed_amount ? (
                                  <>
                                    <span className="line-through text-gray-500 text-sm">{formatCurrency(rental.original_rental_amount)}</span>
                                    <span className="ml-2 text-green-600">{formatCurrency(rental.confirmed_amount)}</span>
                                  </>
                                ) : (
                                  <span>{formatCurrency(rental.confirmed_amount)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Duration</p>
                              <p className="font-medium text-gray-900">{rental.rental_duration_months} months</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Customer Type</p>
                              <p className="font-medium text-gray-900">{rental.customer_type}</p>
                            </div>
                          </div>
                        </div>

                        {/* Vehicle Assignment */}
                        {rental.vehicle_number && (
                          <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Assigned Vehicle</h4>
                            <p className="text-blue-800 font-medium">
                              {rental.vehicle_number} - {rental.vehicle_make} {rental.vehicle_model}
                            </p>
                          </div>
                        )}

                        {/* Rental Contract */}
                        {rental.rental_contract_url && (
                          <div className="mb-4 p-4 bg-green-50 rounded-xl">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-green-800">
                                <FileText className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">
                                  Contract uploaded - Signed: {formatDate(rental.contract_signed_date)}
                                </span>
                              </div>
                              <a 
                                href={rental.rental_contract_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                View Contract
                              </a>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => handleViewChecklist(rental)}
                              className="text-purple-600 hover:text-purple-800 flex items-center text-sm font-medium transition-colors"
                            >
                              <CheckSquare className="w-4 h-4 mr-1" />
                              Delivery Checklist
                            </button>
                            <button 
                              onClick={() => handleEditRental(rental)}
                              className="text-gray-600 hover:text-gray-800 flex items-center text-sm font-medium transition-colors"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button className="text-gray-600 hover:text-gray-800 flex items-center text-sm font-medium transition-colors">
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </button>
                          </div>
                          
                          {rental.all_items_completed && (
                            <div className="flex items-center text-green-600 text-sm font-medium">
                              <Award className="w-4 h-4 mr-1" />
                              Ready for Delivery
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            {/* Coming Soon Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100"
            >
              <div className="max-w-2xl mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <Bell className="w-12 h-12 text-white" />
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Subscription Services
                </h2>
                
                <p className="text-xl text-gray-600 mb-8">
                  Coming Soon
                </p>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
                  <p className="text-gray-700 leading-relaxed">
                    We're developing comprehensive subscription service management features. 
                    This section will include service catalog management, subscription tracking, 
                    customer service analytics, and automated billing once the service parameters are finalized.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Bell className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Management</h3>
                    <p className="text-gray-600 text-sm">
                      Complete subscription service catalog and management system
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Analytics</h3>
                    <p className="text-gray-600 text-sm">
                      Detailed customer subscription patterns and service usage analytics
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <CheckSquare className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Automated Billing</h3>
                    <p className="text-gray-600 text-sm">
                      Streamlined billing processes and payment tracking for subscriptions
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-yellow-800 text-sm">
                    <Clock className="w-4 h-4 inline mr-2" />
                    <strong>Status:</strong> Awaiting service parameters and requirements to be finalized
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'ltr-reporting' && (
          <div>
            {/* LTR Reporting Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">LTR Reporting</h1>
                    <p className="text-gray-600 mt-1">Manage and track Long-Term Rental reporting records</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      onClick={() => handleLTRExport('csv')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={filteredLTRRecords.length === 0}
                      title={(ltrSearchTerm || hasActiveLTRFilters) ? `Export ${filteredLTRRecords.length} filtered record(s) as CSV` : 'Export all records as CSV'}
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => handleLTRExport('excel')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={filteredLTRRecords.length === 0}
                      title={(ltrSearchTerm || hasActiveLTRFilters) ? `Export ${filteredLTRRecords.length} filtered record(s) as Excel` : 'Export all records as Excel'}
                    >
                      <Download className="w-4 h-4" />
                      Export Excel
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setLtrImportModalOpen(true);
                      setTimeout(() => ltrImportFileInputRef.current?.click(), 100);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Import File
                  </button>
                  <button
                    onClick={() => setLtrShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
                    placeholder="Search by customer ID, name, plate reservation, title, or period..."
                    value={ltrSearchTerm}
                    onChange={handleLTRSearch}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                  {ltrSearchTerm && (
                    <button
                      onClick={clearLTRSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear search"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setLtrShowFilters(!ltrShowFilters)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    hasActiveLTRFilters 
                      ? 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Toggle filters"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {hasActiveLTRFilters && (
                    <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {Object.values(ltrFilters).filter(v => v.trim()).length}
                    </span>
                  )}
                  {ltrShowFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={fetchLTRRecords}
                  disabled={ltrLoading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Refresh records"
                >
                  <RefreshCw className={`w-4 h-4 ${ltrLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Filter Panel */}
              <AnimatePresence>
                {ltrShowFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Customer ID</label>
                        <input
                          type="text"
                          value={ltrFilters.customer_id}
                          onChange={(e) => handleLTRFilterChange('customer_id', e.target.value)}
                          placeholder="Filter by customer ID..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          value={ltrFilters.name}
                          onChange={(e) => handleLTRFilterChange('name', e.target.value)}
                          placeholder="Filter by name..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Plate Reservation</label>
                        <input
                          type="text"
                          value={ltrFilters.plate_reservation}
                          onChange={(e) => handleLTRFilterChange('plate_reservation', e.target.value)}
                          placeholder="Filter by plate..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input
                          type="text"
                          value={ltrFilters.title}
                          onChange={(e) => handleLTRFilterChange('title', e.target.value)}
                          placeholder="Filter by title..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                        <input
                          type="text"
                          value={ltrFilters.period}
                          onChange={(e) => handleLTRFilterChange('period', e.target.value)}
                          placeholder="Filter by period..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>
                    {hasActiveLTRFilters && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={clearLTRFilters}
                          className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Period Distribution Chart - Enhanced */}
            {ltrRecords.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30 rounded-2xl shadow-lg border border-purple-100 p-8 mb-6"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Rental Period Distribution</h2>
                      <p className="text-sm text-gray-600 mt-1">Comprehensive visualization of rental terms by period</p>
                    </div>
                  </div>
                </div>

                {periodChartData.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Enhanced Bar Chart */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Rental Count by Period
                      </h3>
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={periodChartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                            <defs>
                              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#6366F1" stopOpacity={0.7} />
                              </linearGradient>
                              <filter id="barShadow">
                                <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.2"/>
                              </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.4} />
                            <XAxis
                              dataKey="period"
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              tick={{ fontSize: 11, fill: '#6B7280', fontWeight: '500' }}
                              axisLine={{ stroke: '#D1D5DB', strokeWidth: 1.5 }}
                              tickLine={{ stroke: '#D1D5DB' }}
                              interval={0}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: '#6B7280', fontWeight: '500' }}
                              axisLine={{ stroke: '#D1D5DB', strokeWidth: 1.5 }}
                              tickLine={{ stroke: '#D1D5DB' }}
                              label={{ 
                                value: 'Number of Rentals', 
                                angle: -90, 
                                position: 'insideLeft', 
                                style: { textAnchor: 'middle', fill: '#374151', fontWeight: '600', fontSize: '13px' } 
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '2px solid #8B5CF6',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.3)',
                                padding: '12px'
                              }}
                              cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                              formatter={(value, name, props) => {
                                if (name === 'count') {
                                  const percentage = props.payload.percentage;
                                  return [
                                    <div key="tooltip" className="space-y-1">
                                      <div className="font-bold text-purple-600 text-lg">{value}</div>
                                      <div className="text-sm text-gray-600">Rentals ({percentage}%)</div>
                                      {props.payload.totalAmount > 0 && (
                                        <div className="text-xs text-gray-500">
                                          Total: {formatCurrencyAED(props.payload.totalAmount)}
                                        </div>
                                      )}
                                    </div>,
                                    ''
                                  ];
                                }
                                return value;
                              }}
                              labelStyle={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}
                            />
                            <Bar
                              dataKey="count"
                              radius={[12, 12, 0, 0]}
                              name="Number of Rentals"
                              filter="url(#barShadow)"
                            >
                              {periodChartData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                                  style={{ transition: 'opacity 0.3s' }}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Enhanced Pie Chart */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        Period Distribution
                      </h3>
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <defs>
                              <filter id="pieShadow">
                                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
                              </filter>
                            </defs>
                            <Pie
                              data={periodChartData}
                              cx="50%"
                              cy="45%"
                              labelLine={false}
                              label={({ period, percentage, count }) => {
                                // Only show labels for segments > 3%
                                if (parseFloat(percentage) > 3) {
                                  return `${period}\n${percentage}%`;
                                }
                                return '';
                              }}
                              outerRadius={110}
                              innerRadius={40}
                              fill="#8884d8"
                              dataKey="count"
                              paddingAngle={2}
                              filter="url(#pieShadow)"
                            >
                              {periodChartData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                                  stroke="#fff"
                                  strokeWidth={2}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '2px solid #6366F1',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.3)',
                                padding: '12px'
                              }}
                              formatter={(value, name, props) => {
                                if (name === 'count') {
                                  const percentage = props.payload.percentage;
                                  return [
                                    <div key="tooltip" className="space-y-1">
                                      <div className="font-bold text-indigo-600 text-lg">{value}</div>
                                      <div className="text-sm text-gray-600">Rentals ({percentage}%)</div>
                                      {props.payload.totalAmount > 0 && (
                                        <div className="text-xs text-gray-500">
                                          Total: {formatCurrencyAED(props.payload.totalAmount)}
                                        </div>
                                      )}
                                    </div>,
                                    ''
                                  ];
                                }
                                return value;
                              }}
                            />
                            <Legend
                              verticalAlign="bottom"
                              height={60}
                              iconType="circle"
                              wrapperStyle={{ paddingTop: '20px' }}
                              formatter={(value) => {
                                const item = periodChartData.find(d => d.period === value);
                                if (item) {
                                  return (
                                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                                      {value} <span style={{ color: '#6B7280' }}>({item.count})</span>
                                    </span>
                                  );
                                }
                                return value;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white/50 rounded-xl">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No period data available for visualization</p>
                  </div>
                )}

                {/* Enhanced Summary Statistics */}
                {periodChartData.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-purple-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg text-white relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                          <p className="text-purple-100 text-sm font-medium mb-2">Total Rentals</p>
                          <p className="text-4xl font-bold">{ltrRecords.length.toLocaleString()}</p>
                          <p className="text-purple-100 text-xs mt-2">All rental records</p>
                        </div>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 shadow-lg text-white relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                          <p className="text-blue-100 text-sm font-medium mb-2">Unique Periods</p>
                          <p className="text-4xl font-bold">{periodChartData.length}</p>
                          <p className="text-blue-100 text-xs mt-2">Different rental terms</p>
                        </div>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 shadow-lg text-white relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                          <p className="text-green-100 text-sm font-medium mb-2">Most Common Period</p>
                          <p className="text-2xl font-bold mb-1">
                            {periodChartData[0]?.period || 'N/A'}
                          </p>
                          <p className="text-green-100 text-sm">
                            {periodChartData[0]?.count || 0} rentals ({periodChartData[0]?.percentage || 0}%)
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Records Table */}
            {ltrLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading LTR records...</p>
              </div>
            ) : filteredLTRRecords.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No LTR records found</h3>
                <p className="text-gray-600 mb-6">Start by adding your first LTR record or importing data from a file.</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setLtrShowForm(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Record
                  </button>
                  <button
                    onClick={() => {
                      setLtrImportModalOpen(true);
                      setTimeout(() => ltrImportFileInputRef.current?.click(), 100);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Import File
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plate Reservation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLTRRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.customer_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.plate_reservation || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.title || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.amount ? formatCurrencyAED(record.amount) : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.period || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.start_time ? new Date(record.start_time).toLocaleString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleLTREdit(record)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleLTRDelete(record.id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Delete"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {filteredLTRRecords.length} of {ltrRecords.length} record(s)
                    {(ltrSearchTerm || hasActiveLTRFilters) && ' (filtered)'}
                  </p>
                </div>
              </div>
            )}

            {/* Add/Edit Form Modal */}
            <AnimatePresence>
              {ltrShowForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                  onClick={() => resetLTRForm()}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  >
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">
                          {ltrEditingRecord ? 'Edit LTR Record' : 'Add New LTR Record'}
                        </h2>
                        <button
                          onClick={resetLTRForm}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                    <form onSubmit={handleLTRSubmit} className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Customer ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={ltrFormData.customer_id}
                            onChange={(e) => setLtrFormData({ ...ltrFormData, customer_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={ltrFormData.name}
                            onChange={(e) => setLtrFormData({ ...ltrFormData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Plate Reservation</label>
                          <input
                            type="text"
                            value={ltrFormData.plate_reservation}
                            onChange={(e) => setLtrFormData({ ...ltrFormData, plate_reservation: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                          <input
                            type="text"
                            value={ltrFormData.title}
                            onChange={(e) => setLtrFormData({ ...ltrFormData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            value={ltrFormData.amount}
                            onChange={(e) => setLtrFormData({ ...ltrFormData, amount: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                          <input
                            type="text"
                            value={ltrFormData.period}
                            onChange={(e) => setLtrFormData({ ...ltrFormData, period: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                          <input
                            type="datetime-local"
                            value={ltrFormData.start_time}
                            onChange={(e) => setLtrFormData({ ...ltrFormData, start_time: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      </div>
                      <div className="mt-6 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={resetLTRForm}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {ltrEditingRecord ? 'Update' : 'Create'} Record
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Import Modal */}
            <AnimatePresence>
              {ltrImportModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                  onClick={() => {
                    if (!ltrImporting) {
                      setLtrImportModalOpen(false);
                      setLtrImportPreview(null);
                      setLtrImportFile(null);
                    }
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                  >
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Import LTR Records</h2>
                        <button
                          onClick={() => {
                            if (!ltrImporting) {
                              setLtrImportModalOpen(false);
                              setLtrImportPreview(null);
                              setLtrImportFile(null);
                            }
                          }}
                          disabled={ltrImporting}
                          className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      {!ltrImportPreview ? (
                        <div className="text-center py-8">
                          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">Select a CSV or Excel file to import</p>
                          <input
                            ref={ltrImportFileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleLTRImportFileSelect}
                            className="hidden"
                          />
                          <button
                            onClick={() => ltrImportFileInputRef.current?.click()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Choose File
                          </button>
                          {ltrImportFile && (
                            <p className="mt-4 text-sm text-gray-600">Selected: {ltrImportFile.name}</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                              Preview: {ltrImportPreview.length} record(s) found
                            </p>
                            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                  <tr>
                                    <th className="px-4 py-2 text-left border-b">Customer ID</th>
                                    <th className="px-4 py-2 text-left border-b">Name</th>
                                    <th className="px-4 py-2 text-left border-b">Plate Reservation</th>
                                    <th className="px-4 py-2 text-left border-b">Title</th>
                                    <th className="px-4 py-2 text-left border-b">Amount</th>
                                    <th className="px-4 py-2 text-left border-b">Period</th>
                                    <th className="px-4 py-2 text-left border-b">Start Time</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ltrImportPreview.slice(0, 10).map((record, index) => (
                                    <tr key={index} className="border-b">
                                      <td className="px-4 py-2">{record.customer_id || '-'}</td>
                                      <td className="px-4 py-2">{record.name || '-'}</td>
                                      <td className="px-4 py-2">{record.plate_reservation || '-'}</td>
                                      <td className="px-4 py-2">{record.title || '-'}</td>
                                      <td className="px-4 py-2">{record.amount || '-'}</td>
                                      <td className="px-4 py-2">{record.period || '-'}</td>
                                      <td className="px-4 py-2">{record.start_time || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {ltrImportPreview.length > 10 && (
                                <div className="p-4 text-center text-sm text-gray-600">
                                  ... and {ltrImportPreview.length - 10} more record(s)
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => {
                                setLtrImportPreview(null);
                                setLtrImportFile(null);
                                if (ltrImportFileInputRef.current) {
                                  ltrImportFileInputRef.current.value = '';
                                }
                              }}
                              disabled={ltrImporting}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleLTRImportConfirm}
                              disabled={ltrImporting}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {ltrImporting ? (
                                <>
                                  <Loader className="w-4 h-4 animate-spin" />
                                  Importing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Import {ltrImportPreview.length} Record(s)
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Enhanced Modals */}
        <RentalAgreementModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          rental={selectedRental}
          onSuccess={handleModalSuccess}
        />

        <DeliveryChecklistModal
          isOpen={showChecklistModal}
          onClose={() => setShowChecklistModal(false)}
          rental={selectedRental}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
};

export default SubscribeNow;
