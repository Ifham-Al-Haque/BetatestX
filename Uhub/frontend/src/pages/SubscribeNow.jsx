import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
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
  X,
  Save,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import subscribeNowService from '../services/subscribeNowService';
import ltrReportingService from '../services/ltrReportingService';
import ltrCustomerLeadService from '../services/ltrCustomerLeadService';
import ltrCustomerReviewService from '../services/ltrCustomerReviewService';
import RentalAgreementModal from '../components/subscribeNow/RentalAgreementModal';
import DeliveryChecklistModal from '../components/subscribeNow/DeliveryChecklistModal';
import PaginationControls from '../components/ui/PaginationControls';
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
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';

// Download icon alias (lucide Download can be undefined in some builds)
const Download = FileText;

// Normalize LTR Customer Lead date (Excel serial or string) to YYYY-MM-DD for storage/display
function normalizeLtrLeadDateStorage(value) {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const asNum = parseFloat(s);
  if (!isNaN(asNum) && asNum >= 10000 && asNum <= 1000000) {
    const d = new Date((Math.floor(asNum) - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }
  return s;
}

const SubscribeNow = () => {
  const { userProfile } = useAuth();
  const { isDark } = useTheme();
  const prefersReducedMotion = useReducedMotion();
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
  const [ltrLeadPage, setLtrLeadPage] = useState(1);
  const [ltrReviewPage, setLtrReviewPage] = useState(1);
  const LTR_LEAD_PAGE_SIZE = 10;
  const LTR_REVIEW_PAGE_SIZE = 10;

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

  // LTR Customer lead state (Date, Current Trip, Trip Ended, New Trip, Renew Trip) — loaded from database
  const LTR_LEAD_STORAGE_KEY = 'subscribe_now_ltr_lead';
  const [ltrLeadRecords, setLtrLeadRecords] = useState([]);
  const [ltrLeadLoading, setLtrLeadLoading] = useState(false);
  const [ltrLeadUseLocalStorage, setLtrLeadUseLocalStorage] = useState(false); // fallback if DB table missing
  const [ltrLeadImportModalOpen, setLtrLeadImportModalOpen] = useState(false);
  const [ltrLeadImportFile, setLtrLeadImportFile] = useState(null);
  const [ltrLeadImportPreview, setLtrLeadImportPreview] = useState(null);
  const [ltrLeadImporting, setLtrLeadImporting] = useState(false);
  const [ltrLeadColumnMapping, setLtrLeadColumnMapping] = useState({ date: '', current_trip: '', trip_ended: '', new_trip: '', renew_trip: '' });
  const [ltrLeadExcelHeaders, setLtrLeadExcelHeaders] = useState([]);
  const [ltrLeadExcelRows, setLtrLeadExcelRows] = useState([]);
  const [ltrLeadShowForm, setLtrLeadShowForm] = useState(false);
  const [ltrLeadEditingRecord, setLtrLeadEditingRecord] = useState(null);
  const [ltrLeadFormData, setLtrLeadFormData] = useState({
    date: '',
    current_trip: '',
    trip_ended: '',
    new_trip: '',
    renew_trip: ''
  });
  const [ltrLeadTrendView, setLtrLeadTrendView] = useState('monthly'); // 'monthly' | 'yearly'
  const ltrLeadFileInputRef = useRef(null);

  // LTR Customer Review state (Customer Name, Rental Duration, Rental Renew, Rental No longer Continue, Remark)
  const [ltrReviewRecords, setLtrReviewRecords] = useState([]);
  const [ltrReviewLoading, setLtrReviewLoading] = useState(false);
  const [ltrReviewUseLocalStorage, setLtrReviewUseLocalStorage] = useState(false);
  const [ltrReviewShowForm, setLtrReviewShowForm] = useState(false);
  const [ltrReviewEditingRecord, setLtrReviewEditingRecord] = useState(null);
  const [ltrReviewFormData, setLtrReviewFormData] = useState({
    customer_name: '',
    rental_duration: '',
    rental_renew: '',
    rental_no_longer_continue: '',
    remark: ''
  });
  const [ltrReviewChartCustomer, setLtrReviewChartCustomer] = useState(''); // selected customer for per-customer chart
  const [ltrReviewImportModalOpen, setLtrReviewImportModalOpen] = useState(false);
  const [ltrReviewImportFile, setLtrReviewImportFile] = useState(null);
  const [ltrReviewExcelHeaders, setLtrReviewExcelHeaders] = useState([]);
  const [ltrReviewExcelRows, setLtrReviewExcelRows] = useState([]);
  const [ltrReviewColumnMapping, setLtrReviewColumnMapping] = useState({
    customer_name: '',
    rental_duration: '',
    rental_renew: '',
    rental_no_longer_continue: '',
    remark: ''
  });
  const [ltrReviewImportPreview, setLtrReviewImportPreview] = useState(null);
  const [ltrReviewImporting, setLtrReviewImporting] = useState(false);
  const ltrReviewFileInputRef = useRef(null);

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
    } else if (hash === '#ltr-customer-lead') {
      setActiveTab('ltr-customer-lead');
    } else if (hash === '#ltr-customer-review') {
      setActiveTab('ltr-customer-review');
    }
  }, []);

  // Persist LTR Customer lead to localStorage only when using fallback (no DB)
  useEffect(() => {
    if (ltrLeadUseLocalStorage && ltrLeadRecords && ltrLeadRecords.length >= 0) {
      try {
        localStorage.setItem(LTR_LEAD_STORAGE_KEY, JSON.stringify(ltrLeadRecords));
      } catch (_) {}
    }
  }, [ltrLeadUseLocalStorage, ltrLeadRecords]);

  // Load LTR Customer Lead from database (or fallback to localStorage)
  const fetchLtrLeadRecords = async () => {
    if (ltrLeadUseLocalStorage) {
      try {
        const stored = localStorage.getItem(LTR_LEAD_STORAGE_KEY);
        const arr = stored ? (JSON.parse(stored) || []) : [];
        setLtrLeadRecords(arr.map(r => ({ ...r, date: normalizeLtrLeadDateStorage(r.date) || r.date })));
      } catch (_) {
        setLtrLeadRecords([]);
      }
      return;
    }
    setLtrLeadLoading(true);
    try {
      const data = await ltrCustomerLeadService.getRecords();
      setLtrLeadRecords((data || []).map(r => ({
        id: r.id,
        date: r.date ? (typeof r.date === 'string' ? r.date.slice(0, 10) : r.date) : '',
        current_trip: r.current_trip ?? 0,
        trip_ended: r.trip_ended ?? 0,
        new_trip: r.new_trip ?? 0,
        renew_trip: r.renew_trip ?? 0
      })));
    } catch (err) {
      console.error('LTR Customer Lead fetch failed (table may not exist yet):', err);
      setLtrLeadUseLocalStorage(true);
      try {
        const stored = localStorage.getItem(LTR_LEAD_STORAGE_KEY);
        const arr = stored ? (JSON.parse(stored) || []) : [];
        setLtrLeadRecords(arr.map(r => ({ ...r, date: normalizeLtrLeadDateStorage(r.date) || r.date })));
      } catch (_) {
        setLtrLeadRecords([]);
      }
    } finally {
      setLtrLeadLoading(false);
    }
  };

  const fetchLtrReviewRecords = async () => {
    setLtrReviewLoading(true);
    try {
      const data = await ltrCustomerReviewService.getRecords();
      setLtrReviewRecords(data || []);
    } catch (err) {
      console.error('LTR Customer Review fetch failed:', err);
      setLtrReviewRecords([]);
      setLtrReviewUseLocalStorage(true);
    } finally {
      setLtrReviewLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'fleet-delivery') {
      loadFleetDeliveryData();
    } else if (activeTab === 'services') {
      loadFleetServiceData();
    } else if (activeTab === 'ltr-reporting') {
      fetchLTRRecords();
    } else if (activeTab === 'ltr-customer-lead') {
      fetchLtrLeadRecords();
    } else if (activeTab === 'ltr-customer-review') {
      fetchLtrReviewRecords();
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

  // LTR Customer lead: Excel serial date conversion and display
  const excelSerialToYYYYMMDD = (serial) => {
    const n = Math.floor(Number(serial));
    if (isNaN(n) || n < 1000 || n > 1000000) return null;
    const d = new Date((n - 25569) * 86400 * 1000);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  };

  // Helper: parse date strings to ISO 8601 (used by normalizeLtrLeadDate and LTR form)
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
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return `${trimmed}T00:00:00`;
      }
      return trimmed;
    }

    const expandTwoDigitYear = (yy) => {
      const n = parseInt(yy, 10);
      if (isNaN(n)) return null;
      return n <= 49 ? 2000 + n : 1900 + n;
    };

    let parsedDate = null;

    const ddmmyyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})(\s+(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?$/);
    if (ddmmyyMatch) {
      const day = parseInt(ddmmyyMatch[1], 10);
      const month = parseInt(ddmmyyMatch[2], 10);
      const year = expandTwoDigitYear(ddmmyyMatch[3]);
      if (year !== null && day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        parsedDate = new Date(year, month - 1, day);
      }
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(\s+(\d{1,2}):(\d{1,2})(:(\d{1,2}))?)?/);
      if (ddmmyyyyMatch) {
        const day = parseInt(ddmmyyyyMatch[1], 10);
        const month = parseInt(ddmmyyyyMatch[2], 10);
        const year = parseInt(ddmmyyyyMatch[3], 10);
        const hour = ddmmyyyyMatch[5] ? parseInt(ddmmyyyyMatch[5], 10) : 0;
        const minute = ddmmyyyyMatch[6] ? parseInt(ddmmyyyyMatch[6], 10) : 0;
        const second = ddmmyyyyMatch[8] ? parseInt(ddmmyyyyMatch[8], 10) : 0;
        if (day > 12 || month > 12) {
          parsedDate = new Date(year, month - 1, day, hour, minute, second);
        } else {
          parsedDate = new Date(year, month - 1, day, hour, minute, second);
          if (isNaN(parsedDate.getTime())) {
            parsedDate = new Date(year, day - 1, month, hour, minute, second);
          }
        }
      }
    }

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

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      parsedDate = new Date(trimmed);
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate.toISOString();
  };

  const normalizeLtrLeadDate = (value) => {
    if (value == null || value === '') return '';
    const s = String(value).trim();
    if (!s) return '';
    const asNum = parseFloat(s);
    if (!isNaN(asNum)) {
      // Common cases from Excel/CSV:
      // - Year-only (e.g. 2026) should NOT be treated as an Excel serial date (2026 -> 1905-07-18)
      if (/^\d{4}$/.test(s) && asNum >= 1900 && asNum <= 2100) {
        return `${Math.floor(asNum)}-01-01`;
      }

      // - YYYYMMDD numeric (e.g. 20260718)
      if (/^\d{8}$/.test(s)) {
        const yyyy = s.slice(0, 4);
        const mm = s.slice(4, 6);
        const dd = s.slice(6, 8);
        const iso = `${yyyy}-${mm}-${dd}`;
        const parsed = parseDateToISO(iso);
        if (parsed) return parsed.slice(0, 10);
      }

      // - Excel serial dates for modern years are typically >= 20000 (around 1954+)
      if (asNum >= 20000 && asNum <= 1000000) {
        const iso = excelSerialToYYYYMMDD(asNum);
        if (iso) return iso;
      }

      // - Epoch milliseconds (e.g. 1700000000000)
      if (asNum >= 1000000000000) {
        const d = new Date(asNum);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      }
    }
    const iso = parseDateToISO(s);
    return iso ? iso.slice(0, 10) : s;
  };

  const formatLtrLeadDateDisplay = (value) => {
    const yyyymmdd = normalizeLtrLeadDate(value);
    if (!yyyymmdd) return '-';
    const [y, m, d] = yyyymmdd.split('-');
    return [d, m, y].join('/');
  };

  // LTR Customer lead: totals from the single record with the latest date (all fields from latest, not summed)
  const ltrLeadTotals = useMemo(() => {
    const totals = { current_trip: 0, trip_ended: 0, new_trip: 0, renew_trip: 0 };
    const records = ltrLeadRecords || [];
    if (records.length > 0) {
      const withDate = records.map(r => ({ ...r, _normDate: normalizeLtrLeadDate(r.date) || '' })).filter(r => r._normDate && r._normDate !== 'No date');
      if (withDate.length > 0) {
        const latest = withDate.sort((a, b) => (b._normDate).localeCompare(a._normDate))[0];
        totals.current_trip = Number(latest.current_trip) || 0;
        totals.trip_ended = Number(latest.trip_ended) || 0;
        totals.new_trip = Number(latest.new_trip) || 0;
        totals.renew_trip = Number(latest.renew_trip) || 0;
      }
    }
    return totals;
  }, [ltrLeadRecords]);

  // Per date: all values (current_trip, trip_ended, new_trip, renew_trip) from the latest record on that date (not summed)
  const ltrLeadChartByDate = useMemo(() => {
    if (!ltrLeadRecords || ltrLeadRecords.length === 0) return [];
    const byDate = {};
    ltrLeadRecords.forEach(r => {
      const d = normalizeLtrLeadDate(r.date) || 'No date';
      if (!byDate[d]) byDate[d] = { date: d, _candidates: [] };
      byDate[d]._candidates.push({
        current_trip: Number(r.current_trip) || 0,
        trip_ended: Number(r.trip_ended) || 0,
        new_trip: Number(r.new_trip) || 0,
        renew_trip: Number(r.renew_trip) || 0
      });
    });
    const result = Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(row => {
        const cand = row._candidates;
        const latest = cand && cand.length > 0 ? cand[cand.length - 1] : { current_trip: 0, trip_ended: 0, new_trip: 0, renew_trip: 0 };
        return {
          date: row.date,
          current_trip: latest.current_trip,
          trip_ended: latest.trip_ended,
          new_trip: latest.new_trip,
          renew_trip: latest.renew_trip
        };
      });
    return result;
  }, [ltrLeadRecords]);

  // Trend: all values from the latest date in each period (not summed)
  const ltrLeadTrendMonthly = useMemo(() => {
    if (!ltrLeadChartByDate.length) return [];
    const byMonth = {};
    ltrLeadChartByDate.forEach((row) => {
      const d = row.date;
      if (!d || d === 'No date') return;
      const monthKey = d.length >= 7 ? d.slice(0, 7) : d;
      const label = d.length >= 7 ? `${d.slice(5, 7)}/${d.slice(-2)}` : d;
      if (!byMonth[monthKey]) byMonth[monthKey] = { period: monthKey, label, current_trip: 0, trip_ended: 0, new_trip: 0, renew_trip: 0, _latestDate: '' };
      if (d > (byMonth[monthKey]._latestDate || '')) {
        byMonth[monthKey]._latestDate = d;
        byMonth[monthKey].current_trip = row.current_trip || 0;
        byMonth[monthKey].trip_ended = row.trip_ended || 0;
        byMonth[monthKey].new_trip = row.new_trip || 0;
        byMonth[monthKey].renew_trip = row.renew_trip || 0;
      }
    });
    return Object.values(byMonth).sort((a, b) => a.period.localeCompare(b.period)).map(({ _latestDate, ...rest }) => rest);
  }, [ltrLeadChartByDate]);

  const ltrLeadTrendYearly = useMemo(() => {
    if (!ltrLeadChartByDate.length) return [];
    const byYear = {};
    ltrLeadChartByDate.forEach((row) => {
      const d = row.date;
      if (!d || d === 'No date') return;
      const yearKey = d.length >= 4 ? d.slice(0, 4) : d;
      if (!byYear[yearKey]) byYear[yearKey] = { period: yearKey, label: yearKey, current_trip: 0, trip_ended: 0, new_trip: 0, renew_trip: 0, _latestDate: '' };
      if (d > (byYear[yearKey]._latestDate || '')) {
        byYear[yearKey]._latestDate = d;
        byYear[yearKey].current_trip = row.current_trip || 0;
        byYear[yearKey].trip_ended = row.trip_ended || 0;
        byYear[yearKey].new_trip = row.new_trip || 0;
        byYear[yearKey].renew_trip = row.renew_trip || 0;
      }
    });
    return Object.values(byYear).sort((a, b) => a.period.localeCompare(b.period)).map(({ _latestDate, ...rest }) => rest);
  }, [ltrLeadChartByDate]);

  // LTR Lead chart series config (single source of truth for colors and keys)
  const LTR_LEAD_SERIES = [
    { key: 'current_trip', name: 'Current Trip', color: '#6366F1' },
    { key: 'trip_ended', name: 'Trip Ended', color: '#0EA5E9' },
    { key: 'new_trip', name: 'New Trip', color: '#10B981' },
    { key: 'renew_trip', name: 'Renew Trip', color: '#F59E0B' }
  ];
  // For "Lead by trip" stacked charts: only Trip Ended, New Trip, Renew Trip (no Current Trip)
  const LTR_LEAD_SERIES_LEAD_BY_TRIP = LTR_LEAD_SERIES.filter((s) => s.key !== 'current_trip');

  const formatChartDate = (v) => {
    if (!v || typeof v !== 'string') return v;
    if (v.length >= 10) return [v.slice(8, 10), v.slice(5, 7), v.slice(0, 4)].join('/');
    return v;
  };

  // Pie: distribution of total trips only (Trip Ended, New Trip, Renew Trip). Current Trip is not counted in total.
  const ltrLeadPieData = useMemo(() => {
    const { trip_ended, new_trip, renew_trip } = ltrLeadTotals;
    const total = trip_ended + new_trip + renew_trip;
    if (total === 0) return [];
    return LTR_LEAD_SERIES.filter(s => s.key !== 'current_trip').map(s => ({ name: s.name, value: ltrLeadTotals[s.key] || 0, color: s.color })).filter(d => d.value > 0);
  }, [ltrLeadTotals]);

  const resetLtrLeadForm = () => {
    setLtrLeadFormData({ date: '', current_trip: '', trip_ended: '', new_trip: '', renew_trip: '' });
    setLtrLeadEditingRecord(null);
    setLtrLeadShowForm(false);
  };

  const handleLtrLeadSubmit = async (e) => {
    e.preventDefault();
    const dateVal = ltrLeadFormData.date ? (ltrLeadFormData.date.includes('T') ? ltrLeadFormData.date.slice(0, 10) : ltrLeadFormData.date) : '';
    const record = {
      date: dateVal,
      current_trip: Number(ltrLeadFormData.current_trip) || 0,
      trip_ended: Number(ltrLeadFormData.trip_ended) || 0,
      new_trip: Number(ltrLeadFormData.new_trip) || 0,
      renew_trip: Number(ltrLeadFormData.renew_trip) || 0
    };
    if (ltrLeadUseLocalStorage) {
      if (ltrLeadEditingRecord) {
        setLtrLeadRecords(prev => prev.map(r => r.id === ltrLeadEditingRecord.id ? { ...record, id: r.id } : r));
        success('Success', 'Lead record updated');
      } else {
        setLtrLeadRecords(prev => [...prev, { ...record, id: String(Date.now()) + Math.random().toString(36).slice(2) }]);
        success('Success', 'Lead record added');
      }
      resetLtrLeadForm();
      return;
    }
    try {
      if (ltrLeadEditingRecord) {
        await ltrCustomerLeadService.updateRecord(ltrLeadEditingRecord.id, record);
        success('Success', 'Lead record updated');
      } else {
        await ltrCustomerLeadService.createRecord(record);
        success('Success', 'Lead record added');
      }
      resetLtrLeadForm();
      fetchLtrLeadRecords();
    } catch (err) {
      showError('Error', err.message || 'Failed to save lead record');
    }
  };

  const handleLtrLeadEdit = (record) => {
    setLtrLeadEditingRecord(record);
    setLtrLeadFormData({
      date: normalizeLtrLeadDate(record.date) || '',
      current_trip: String(record.current_trip ?? ''),
      trip_ended: String(record.trip_ended ?? ''),
      new_trip: String(record.new_trip ?? ''),
      renew_trip: String(record.renew_trip ?? '')
    });
    setLtrLeadShowForm(true);
  };

  const handleLtrLeadDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    if (ltrLeadUseLocalStorage) {
      setLtrLeadRecords(prev => prev.filter(r => r.id !== id));
      success('Success', 'Record deleted');
      return;
    }
    try {
      await ltrCustomerLeadService.deleteRecord(id);
      success('Success', 'Record deleted');
      fetchLtrLeadRecords();
    } catch (err) {
      showError('Error', err.message || 'Failed to delete record');
    }
  };

  const handleLtrLeadImportFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      showError('Invalid File', 'Please select an Excel or CSV file (.xlsx, .xls, .csv)');
      return;
    }
    setLtrLeadImportFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (jsonData.length < 1) {
          showError('Invalid File', 'File must have at least a header row');
          return;
        }
        const headers = (jsonData[0] || []).map(h => String(h ?? '').trim());
        setLtrLeadExcelHeaders(headers);
        setLtrLeadExcelRows(jsonData.slice(1));
        setLtrLeadColumnMapping({
          date: headers.findIndex(h => /date/i.test(h)) >= 0 ? String(headers.findIndex(h => /date/i.test(h))) : '',
          current_trip: headers.findIndex(h => /current|trip/i.test(h) && /current/i.test(h)) >= 0 ? String(headers.findIndex(h => /current|trip/i.test(h) && /current/i.test(h))) : '',
          trip_ended: headers.findIndex(h => /trip.*end|ended/i.test(h)) >= 0 ? String(headers.findIndex(h => /trip.*end|ended/i.test(h))) : '',
          new_trip: headers.findIndex(h => /new.*trip|new trip/i.test(h)) >= 0 ? String(headers.findIndex(h => /new.*trip|new trip/i.test(h))) : '',
          renew_trip: headers.findIndex(h => /renew/i.test(h)) >= 0 ? String(headers.findIndex(h => /renew/i.test(h))) : ''
        });
        setLtrLeadImportPreview(null);
        setLtrLeadImportModalOpen(true);
      } catch (err) {
        showError('Parse Error', err.message || 'Failed to read file');
      }
    };
    reader.onerror = () => showError('File Error', 'Failed to read file');
    reader.readAsArrayBuffer(file);
  };

  const applyLtrLeadMapping = () => {
    const map = ltrLeadColumnMapping;
    const dateCol = map.date !== '' ? parseInt(map.date, 10) : -1;
    const getVal = (row, col) => {
      if (col < 0 || !Array.isArray(row)) return '';
      const v = row[col];
      return v === null || v === undefined ? '' : String(v).trim();
    };
    const toNum = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };
    const parsed = [];
    ltrLeadExcelRows.forEach((row, i) => {
      const dateVal = dateCol >= 0 ? getVal(row, dateCol) : '';
      const current_trip = toNum(getVal(row, parseInt(map.current_trip, 10)));
      const trip_ended = toNum(getVal(row, parseInt(map.trip_ended, 10)));
      const new_trip = toNum(getVal(row, parseInt(map.new_trip, 10)));
      const renew_trip = toNum(getVal(row, parseInt(map.renew_trip, 10)));
      if (dateVal || current_trip || trip_ended || new_trip || renew_trip) {
        const normalizedDate = dateVal ? normalizeLtrLeadDate(dateVal) : '';
        parsed.push({
          id: `import-${i}-${Date.now()}`,
          date: normalizedDate || dateVal,
          current_trip,
          trip_ended,
          new_trip,
          renew_trip
        });
      }
    });
    setLtrLeadImportPreview(parsed);
  };

  const handleLtrLeadImportConfirm = async () => {
    if (!ltrLeadImportPreview || ltrLeadImportPreview.length === 0) {
      showError('No Data', 'No records to import. Apply column mapping first.');
      return;
    }
    setLtrLeadImporting(true);
    const toAdd = ltrLeadImportPreview.map(({ id, ...r }) => ({ ...r }));
    try {
      if (ltrLeadUseLocalStorage) {
        const withIds = toAdd.map(r => ({ ...r, id: String(Date.now()) + Math.random().toString(36).slice(2) }));
        setLtrLeadRecords(prev => [...prev, ...withIds]);
        success('Success', `Imported ${withIds.length} record(s)`);
      } else {
        await ltrCustomerLeadService.bulkInsert(toAdd);
        success('Success', `Imported ${toAdd.length} record(s) to database`);
        fetchLtrLeadRecords();
      }
    } catch (err) {
      showError('Error', err.message || 'Failed to import records');
    } finally {
      setLtrLeadImporting(false);
      setLtrLeadImportModalOpen(false);
      setLtrLeadImportPreview(null);
      setLtrLeadImportFile(null);
      if (ltrLeadFileInputRef.current) ltrLeadFileInputRef.current.value = '';
    }
  };

  const closeLtrLeadImportModal = () => {
    if (ltrLeadImporting) return;
    setLtrLeadImportModalOpen(false);
    setLtrLeadImportPreview(null);
    setLtrLeadImportFile(null);
    setLtrLeadExcelHeaders([]);
    setLtrLeadExcelRows([]);
    if (ltrLeadFileInputRef.current) ltrLeadFileInputRef.current.value = '';
  };

  // LTR Customer Review: unique customer names and chart data (renewals by rental duration for selected customer)
  const ltrReviewCustomerNames = useMemo(() => {
    const names = [...new Set((ltrReviewRecords || []).map(r => (r.customer_name || '').trim()).filter(Boolean))].sort();
    return names;
  }, [ltrReviewRecords]);

  const ltrReviewChartData = useMemo(() => {
    if (!ltrReviewChartCustomer) return [];
    const forCustomer = (ltrReviewRecords || []).filter(r => (r.customer_name || '').trim() === ltrReviewChartCustomer);
    const byDuration = {};
    forCustomer.forEach(r => {
      const d = (r.rental_duration || '').trim() || '—';
      if (!byDuration[d]) byDuration[d] = 0;
      byDuration[d] += Number(r.rental_renew) || 0;
    });
    return Object.entries(byDuration).map(([duration, renewals]) => ({ duration, renewals })).sort((a, b) => a.duration.localeCompare(b.duration));
  }, [ltrReviewRecords, ltrReviewChartCustomer]);

  // Pagination for LTR lead and review tables
  useEffect(() => {
    if (activeTab !== 'ltr-customer-lead') return;
    setLtrLeadPage(1);
  }, [activeTab, ltrLeadRecords]);

  useEffect(() => {
    if (activeTab !== 'ltr-customer-review') return;
    setLtrReviewPage(1);
  }, [activeTab, ltrReviewRecords]);

  const ltrLeadTotalPages = Math.max(1, Math.ceil(ltrLeadRecords.length / LTR_LEAD_PAGE_SIZE));
  const ltrLeadCurrentPage = Math.min(ltrLeadPage, ltrLeadTotalPages);
  const pagedLtrLeadRecords = useMemo(() => {
    const start = (ltrLeadCurrentPage - 1) * LTR_LEAD_PAGE_SIZE;
    return ltrLeadRecords.slice(start, start + LTR_LEAD_PAGE_SIZE);
  }, [ltrLeadRecords, ltrLeadCurrentPage]);

  const ltrReviewTotalPages = Math.max(1, Math.ceil(ltrReviewRecords.length / LTR_REVIEW_PAGE_SIZE));
  const ltrReviewCurrentPage = Math.min(ltrReviewPage, ltrReviewTotalPages);
  const pagedLtrReviewRecords = useMemo(() => {
    const start = (ltrReviewCurrentPage - 1) * LTR_REVIEW_PAGE_SIZE;
    return ltrReviewRecords.slice(start, start + LTR_REVIEW_PAGE_SIZE);
  }, [ltrReviewRecords, ltrReviewCurrentPage]);

  const resetLtrReviewForm = () => {
    setLtrReviewFormData({ customer_name: '', rental_duration: '', rental_renew: '', rental_no_longer_continue: '', remark: '' });
    setLtrReviewEditingRecord(null);
    setLtrReviewShowForm(false);
  };

  const handleLtrReviewSubmit = async (e) => {
    e.preventDefault();
    const record = {
      customer_name: ltrReviewFormData.customer_name.trim(),
      rental_duration: ltrReviewFormData.rental_duration.trim(),
      rental_renew: Number(ltrReviewFormData.rental_renew) || 0,
      rental_no_longer_continue: Number(ltrReviewFormData.rental_no_longer_continue) || 0,
      remark: ltrReviewFormData.remark.trim()
    };
    if (ltrReviewUseLocalStorage) {
      if (ltrReviewEditingRecord) {
        setLtrReviewRecords(prev => prev.map(r => r.id === ltrReviewEditingRecord.id ? { ...record, id: r.id } : r));
        success('Success', 'Record updated');
      } else {
        setLtrReviewRecords(prev => [...prev, { ...record, id: String(Date.now()) + Math.random().toString(36).slice(2) }]);
        success('Success', 'Record added');
      }
      resetLtrReviewForm();
      return;
    }
    try {
      if (ltrReviewEditingRecord) {
        await ltrCustomerReviewService.updateRecord(ltrReviewEditingRecord.id, record);
        success('Success', 'Record updated');
      } else {
        await ltrCustomerReviewService.createRecord(record);
        success('Success', 'Record added');
      }
      resetLtrReviewForm();
      fetchLtrReviewRecords();
    } catch (err) {
      showError('Error', err.message || 'Failed to save record');
    }
  };

  const handleLtrReviewEdit = (rec) => {
    setLtrReviewEditingRecord(rec);
    setLtrReviewFormData({
      customer_name: rec.customer_name ?? '',
      rental_duration: rec.rental_duration ?? '',
      rental_renew: rec.rental_renew != null ? String(rec.rental_renew) : '',
      rental_no_longer_continue: rec.rental_no_longer_continue != null ? String(rec.rental_no_longer_continue) : '',
      remark: rec.remark ?? ''
    });
    setLtrReviewShowForm(true);
  };

  const handleLtrReviewDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    if (ltrReviewUseLocalStorage) {
      setLtrReviewRecords(prev => prev.filter(r => r.id !== id));
      success('Success', 'Record deleted');
      return;
    }
    try {
      await ltrCustomerReviewService.deleteRecord(id);
      success('Success', 'Record deleted');
      fetchLtrReviewRecords();
    } catch (err) {
      showError('Error', err.message || 'Failed to delete record');
    }
  };

  const handleLtrReviewImportFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      showError('Invalid File', 'Please select an Excel or CSV file (.xlsx, .xls, .csv)');
      return;
    }
    setLtrReviewImportFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (jsonData.length < 1) {
          showError('Invalid File', 'File must have at least a header row');
          return;
        }
        const headers = (jsonData[0] || []).map(h => String(h ?? '').trim());
        setLtrReviewExcelHeaders(headers);
        setLtrReviewExcelRows(jsonData.slice(1));
        setLtrReviewColumnMapping({
          customer_name: headers.findIndex(h => /customer|name/i.test(h)) >= 0 ? String(headers.findIndex(h => /customer|name/i.test(h))) : '',
          rental_duration: headers.findIndex(h => /rental.*duration|duration/i.test(h)) >= 0 ? String(headers.findIndex(h => /rental.*duration|duration/i.test(h))) : '',
          rental_renew: headers.findIndex(h => /rental.*renew|renew/i.test(h)) >= 0 ? String(headers.findIndex(h => /rental.*renew|renew/i.test(h))) : '',
          rental_no_longer_continue: headers.findIndex(h => /no longer|continue|no_longer/i.test(h)) >= 0 ? String(headers.findIndex(h => /no longer|continue|no_longer/i.test(h))) : '',
          remark: headers.findIndex(h => /remark|note|comment/i.test(h)) >= 0 ? String(headers.findIndex(h => /remark|note|comment/i.test(h))) : ''
        });
        setLtrReviewImportPreview(null);
        setLtrReviewImportModalOpen(true);
      } catch (err) {
        showError('Parse Error', err.message || 'Failed to read file');
      }
    };
    reader.onerror = () => showError('File Error', 'Failed to read file');
    reader.readAsArrayBuffer(file);
  };

  const applyLtrReviewMapping = () => {
    const map = ltrReviewColumnMapping;
    const getVal = (row, col) => {
      if (col < 0 || col === undefined || !Array.isArray(row)) return '';
      const v = row[col];
      return v === null || v === undefined ? '' : String(v).trim();
    };
    const toNum = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };
    const parsed = [];
    ltrReviewExcelRows.forEach((row, i) => {
      const customer_name = getVal(row, parseInt(map.customer_name, 10));
      const rental_duration = getVal(row, parseInt(map.rental_duration, 10));
      const rental_renew = toNum(getVal(row, parseInt(map.rental_renew, 10)));
      const rental_no_longer_continue = toNum(getVal(row, parseInt(map.rental_no_longer_continue, 10)));
      const remark = getVal(row, parseInt(map.remark, 10));
      if (customer_name || rental_duration || rental_renew || rental_no_longer_continue || remark) {
        parsed.push({
          id: `import-${i}-${Date.now()}`,
          customer_name,
          rental_duration,
          rental_renew,
          rental_no_longer_continue,
          remark
        });
      }
    });
    setLtrReviewImportPreview(parsed);
  };

  const handleLtrReviewImportConfirm = async () => {
    if (!ltrReviewImportPreview || ltrReviewImportPreview.length === 0) {
      showError('No Data', 'No records to import. Apply column mapping first.');
      return;
    }
    setLtrReviewImporting(true);
    const toAdd = ltrReviewImportPreview.map(({ id, ...r }) => ({ ...r }));
    try {
      if (ltrReviewUseLocalStorage) {
        const withIds = toAdd.map(r => ({ ...r, id: String(Date.now()) + Math.random().toString(36).slice(2) }));
        setLtrReviewRecords(prev => [...prev, ...withIds]);
        success('Success', `Imported ${withIds.length} record(s)`);
      } else {
        await ltrCustomerReviewService.bulkInsert(toAdd);
        success('Success', `Imported ${toAdd.length} record(s) to database`);
        fetchLtrReviewRecords();
      }
    } catch (err) {
      showError('Error', err.message || 'Failed to import records');
    } finally {
      setLtrReviewImporting(false);
      setLtrReviewImportModalOpen(false);
      setLtrReviewImportPreview(null);
      setLtrReviewImportFile(null);
      if (ltrReviewFileInputRef.current) ltrReviewFileInputRef.current.value = '';
    }
  };

  const closeLtrReviewImportModal = () => {
    if (ltrReviewImporting) return;
    setLtrReviewImportModalOpen(false);
    setLtrReviewImportPreview(null);
    setLtrReviewImportFile(null);
    setLtrReviewExcelHeaders([]);
    setLtrReviewExcelRows([]);
    if (ltrReviewFileInputRef.current) ltrReviewFileInputRef.current.value = '';
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
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/30' : 'bg-gradient-to-br from-gray-50 via-purple-50/50 to-indigo-50/50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header with Tabs */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className={`text-4xl font-bold flex items-center transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-3 rounded-2xl mr-4 shadow-lg shadow-purple-500/20">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                Subscribe Now Department
              </h1>
              <p className={`mt-2 text-lg transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Fleet delivery management and subscription services
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {activeTab === 'fleet-delivery' && (
                <>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`px-4 py-2 rounded-xl border flex items-center transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-[0.98] ${isDark ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'}`}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-xl border flex items-center transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-[0.98] ${isDark ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'}`}
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </button>
                  <button
                    onClick={handleCreateRental}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-6 py-3 rounded-xl flex items-center transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    New Rental
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tab Navigation - smooth underline and hover */}
          <div className="mt-6">
            <div className={`border-b transition-colors duration-300 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('fleet-delivery')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ease-out ${
                    activeTab === 'fleet-delivery'
                      ? 'border-purple-500 text-purple-500'
                      : isDark ? 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Truck className="w-4 h-4 inline mr-2" />
                  Fleet Delivery
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ease-out ${activeTab === 'services' ? 'border-purple-500 text-purple-500' : isDark ? 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <Bell className="w-4 h-4 inline mr-2" />
                  Subscription Services
                </button>
                <button
                  onClick={() => setActiveTab('ltr-reporting')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ease-out ${activeTab === 'ltr-reporting' ? 'border-purple-500 text-purple-500' : isDark ? 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  LTR Reporting
                </button>
                <button
                  onClick={() => setActiveTab('ltr-customer-lead')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ease-out ${activeTab === 'ltr-customer-lead' ? 'border-purple-500 text-purple-500' : isDark ? 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <Target className="w-4 h-4 inline mr-2" />
                  LTR Customer Lead
                </button>
                <button
                  onClick={() => setActiveTab('ltr-customer-review')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ease-out ${activeTab === 'ltr-customer-review' ? 'border-purple-500 text-purple-500' : isDark ? 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <Star className="w-4 h-4 inline mr-2" />
                  LTR Customer Review
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'fleet-delivery' && (
          <div>
            {/* Enhanced Stats Cards for Fleet Delivery - smooth stagger and hover */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { delay: 0.05, label: 'Total Rentals', value: statistics?.totalRentals ?? rentalAgreements.length, sub: 'All time', icon: FileText, iconBg: 'bg-purple-100 dark:bg-purple-500/20', iconColor: 'text-purple-600 dark:text-purple-400', subColor: 'text-purple-600 dark:text-purple-400' },
                { delay: 0.1, label: 'Delivered', value: statistics?.deliveryStatusBreakdown?.Completed ?? rentalAgreements.filter(r => r.delivery_status === 'Completed').length, sub: 'Successfully delivered', icon: CheckCircle, iconBg: 'bg-green-100 dark:bg-green-500/20', iconColor: 'text-green-600 dark:text-green-400', subColor: 'text-green-600 dark:text-green-400' },
                { delay: 0.15, label: 'In Progress', value: statistics?.deliveryStatusBreakdown?.['In Progress'] ?? rentalAgreements.filter(r => r.delivery_status === 'In Progress').length, sub: 'Active deliveries', icon: Settings, iconBg: 'bg-blue-100 dark:bg-blue-500/20', iconColor: 'text-blue-600 dark:text-blue-400', subColor: 'text-blue-600 dark:text-blue-400' },
                { delay: 0.2, label: 'Total Revenue', value: formatCurrencyAED(statistics?.totalRevenue ?? rentalAgreements.reduce((sum, r) => sum + (r.confirmed_amount || 0), 0)), sub: 'Confirmed amount (AED)', icon: DollarSign, iconBg: 'bg-orange-100 dark:bg-orange-500/20', iconColor: 'text-orange-600 dark:text-orange-400', subColor: 'text-orange-600 dark:text-orange-400' },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: card.delay, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className={`rounded-2xl p-6 border shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-0.5 ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-gray-100'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{card.label}</p>
                        <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{card.value}</p>
                        <p className={`text-sm mt-1 ${card.subColor}`}>
                          {card.label === 'Total Rentals' && <TrendingUp className="w-4 h-4 inline mr-1" />}
                          {card.label === 'Delivered' && <CheckCircle className="w-4 h-4 inline mr-1" />}
                          {card.label === 'In Progress' && <Activity className="w-4 h-4 inline mr-1" />}
                          {card.label === 'Total Revenue' && <BarChart3 className="w-4 h-4 inline mr-1" />}
                          {card.sub}
                        </p>
                      </div>
                      <div className={`p-3 rounded-2xl ${card.iconBg} ${card.iconColor}`}>
                        <Icon className="w-8 h-8" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Enhanced Filters - smooth expand/collapse */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={`rounded-2xl shadow-lg mb-6 overflow-hidden border transition-colors duration-300 ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-gray-100'}`}
                >
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Search</label>
                        <div className="relative">
                          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                          <input
                            type="text"
                            placeholder="Search rentals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500' : 'border-gray-300'}`}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Agreement Status</label>
                        <select
                          value={agreementStatusFilter}
                          onChange={(e) => setAgreementStatusFilter(e.target.value)}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
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
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Delivery Status</label>
                        <select
                          value={deliveryStatusFilter}
                          onChange={(e) => setDeliveryStatusFilter(e.target.value)}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                        >
                          <option value="">All Status</option>
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Customer Type</label>
                        <select
                          value={customerTypeFilter}
                          onChange={(e) => setCustomerTypeFilter(e.target.value)}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                        >
                          <option value="">All Types</option>
                          <option value="Individual">Individual</option>
                          <option value="Corporate">Corporate</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>From Date</label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>To Date</label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                        />
                      </div>
                    </div>
                    
                    <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDark ? 'border-slate-600' : 'border-gray-200'}`}>
                      <button
                        onClick={clearFilters}
                        className={`text-sm font-medium transition-colors duration-200 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-800'}`}
                      >
                        Clear Filters
                      </button>
                      <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
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
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={`rounded-2xl shadow-lg p-12 text-center border transition-colors duration-300 ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-gray-100'}`}
                >
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                    <Truck className={`w-10 h-10 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No rental agreements found</h3>
                  <p className={`mb-6 max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Start by creating your first rental agreement for a customer.</p>
                  <button
                    onClick={handleCreateRental}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-6 py-3 rounded-xl flex items-center mx-auto transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98]"
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
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.06, 0.35), duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className={`rounded-2xl shadow-lg border overflow-hidden transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-0.5 ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-gray-100'}`}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-md shadow-purple-500/20">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {rental.rental_agreement_id}
                              </h3>
                              <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                {rental.customer_name} ({rental.customer_code})
                              </p>
                              <div className={`flex items-center space-x-4 mt-2 text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
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
                          
                          <div className="flex items-center space-x-3 flex-wrap gap-2">
                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors duration-200 ${getAgreementStatusColor(rental.agreement_status)} ${isDark ? 'dark:bg-white/10 dark:border-white/20 dark:text-slate-200' : ''}`}>
                              <AgreementStatusIcon className="w-4 h-4 inline mr-1" />
                              {rental.agreement_status}
                            </span>
                            
                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors duration-200 ${getDeliveryStatusColor(rental.delivery_status)} ${isDark ? 'dark:bg-white/10 dark:border-white/20 dark:text-slate-200' : ''}`}>
                              <DeliveryStatusIcon className="w-4 h-4 inline mr-1" />
                              {rental.delivery_status}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Delivery Progress</span>
                            <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{rental.delivery_progress || 0}%</span>
                          </div>
                          <div className={`w-full rounded-full h-2.5 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${rental.delivery_progress || 0}%` }}
                              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                              className="bg-purple-600 h-2.5 rounded-full"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Car className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                            <div>
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Desired Fleet</p>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rental.desired_fleet_type}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <DollarSign className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                            <div>
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Rental Amount</p>
                              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
                            <Calendar className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                            <div>
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Duration</p>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rental.rental_duration_months} months</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <User className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                            <div>
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Customer Type</p>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rental.customer_type}</p>
                            </div>
                          </div>
                        </div>

                        {/* Vehicle Assignment */}
                        {rental.vehicle_number && (
                          <div className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50'}`}>
                            <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>Assigned Vehicle</h4>
                            <p className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                              {rental.vehicle_number} - {rental.vehicle_make} {rental.vehicle_model}
                            </p>
                          </div>
                        )}

                        {/* Rental Contract */}
                        {rental.rental_contract_url && (
                          <div className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50'}`}>
                            <div className="flex items-center justify-between">
                              <div className={`flex items-center ${isDark ? 'text-green-300' : 'text-green-800'}`}>
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
                        
                        <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                          <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => handleViewChecklist(rental)}
                              className="text-purple-500 hover:text-purple-400 flex items-center text-sm font-medium transition-colors duration-200"
                            >
                              <CheckSquare className="w-4 h-4 mr-1" />
                              Delivery Checklist
                            </button>
                            <button 
                              onClick={() => handleEditRental(rental)}
                              className={`flex items-center text-sm font-medium transition-colors duration-200 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-800'}`}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button className={`flex items-center text-sm font-medium transition-colors duration-200 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-800'}`}>
                              <FileText className="w-4 h-4 mr-1" />
                              Export
                            </button>
                          </div>
                          
                          {rental.all_items_completed && (
                            <div className="flex items-center text-green-500 dark:text-green-400 text-sm font-medium">
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
                      <FileText className="w-4 h-4" />
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
                      <FileText className="w-4 h-4" />
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

        {activeTab === 'ltr-customer-lead' && (
          <div className="space-y-8">
            {/* Hero header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600 p-8 shadow-xl"
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">LTR Customer Lead</h1>
                    <p className="mt-1 text-sm text-teal-100">Track leads by date, current trip, trip ended, new trip, and renew trip</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input ref={ltrLeadFileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleLtrLeadImportFileSelect} />
                  <button
                    type="button"
                    onClick={() => ltrLeadFileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/25"
                  >
                    <Upload className="h-4 w-4" />
                    Import from Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLtrLeadEditingRecord(null); setLtrLeadFormData({ date: '', current_trip: '', trip_ended: '', new_trip: '', renew_trip: '' }); setLtrLeadShowForm(true); }}
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-teal-700 shadow-md transition hover:bg-teal-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Row
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Summary cards with icons */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: 'Date entries', value: ltrLeadRecords.length, color: 'text-slate-700', bg: 'from-slate-50 to-gray-50', border: 'border-slate-200', Icon: Calendar },
                { label: 'Current Trip (latest)', value: ltrLeadTotals.current_trip, color: 'text-violet-600', bg: 'from-violet-50 to-purple-50', border: 'border-violet-200', Icon: TrendingUp },
                { label: 'Trip Ended', value: ltrLeadTotals.trip_ended, color: 'text-blue-600', bg: 'from-blue-50 to-sky-50', border: 'border-blue-200', Icon: CheckCircle },
                { label: 'New Trip', value: ltrLeadTotals.new_trip, color: 'text-emerald-600', bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200', Icon: Zap },
                { label: 'Renew Trip', value: ltrLeadTotals.renew_trip, color: 'text-amber-600', bg: 'from-amber-50 to-orange-50', border: 'border-amber-200', Icon: RefreshCw }
              ].map((card, i) => {
                const Icon = card.Icon;
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-4 rounded-2xl border bg-gradient-to-br ${card.bg} ${card.border} p-5 shadow-sm transition hover:shadow-md`}
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.color} bg-white/80 shadow-sm`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{card.label}</p>
                      <p className={`text-2xl font-bold tabular-nums ${card.color}`}>{card.value}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Charts — professional LTR Lead visualizations */}
            {ltrLeadRecords.length > 0 && (
              <>
                {/* Main chart: Leads by Date (stacked bar) */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-teal-500 to-emerald-500" />
                  <div className="pl-2">
                    <div className="mb-1 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-teal-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Leads by Date</h3>
                    </div>
                    <p className="text-sm text-gray-500">Daily breakdown: Trip Ended, New Trip, Renew Trip</p>
                  </div>
                  <div className="mt-4">
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={ltrLeadChartByDate} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={formatChartDate}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                        angle={-28}
                        textAnchor="end"
                        height={48}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Number of Leads', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', padding: '10px 14px' }}
                        labelFormatter={formatChartDate}
                        formatter={(value, name) => [Number(value).toLocaleString(), name]}
                      />
                      <Legend wrapperStyle={{ paddingTop: 12 }} iconType="circle" iconSize={8} iconAlign="center" />
                      {LTR_LEAD_SERIES_LEAD_BY_TRIP.map((s) => (
                        <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} stackId="a" radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Current Trip over dates — scatter chart */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-violet-500" />
                  <div className="pl-2">
                    <div className="mb-1 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Current Trip over Dates</h3>
                    </div>
                    <p className="text-sm text-gray-500">Latest value per date</p>
                  </div>
                  <div className="mt-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={ltrLeadChartByDate} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        dataKey="date"
                        type="category"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={formatChartDate}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                        angle={-28}
                        textAnchor="end"
                        height={48}
                      />
                      <YAxis
                        type="number"
                        dataKey="current_trip"
                        name="Current Trip"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Current Trip', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', padding: '10px 14px' }}
                        labelFormatter={formatChartDate}
                        formatter={(value) => [Number(value).toLocaleString(), 'Current Trip']}
                        cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }}
                      />
                      <Scatter name="Current Trip" dataKey="current_trip" fill="#6366F1" fillOpacity={0.85} shape="circle" />
                    </ScatterChart>
                  </ResponsiveContainer>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Lead Trend — Monthly / Yearly */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-sky-500 to-blue-500" />
                    <div className="pl-2">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-sky-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Lead Trend</h3>
                      </div>
                      <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                        <button
                          type="button"
                          onClick={() => setLtrLeadTrendView('monthly')}
                          className={`px-3 py-2 text-sm font-medium transition-all ${ltrLeadTrendView === 'monthly' ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          onClick={() => setLtrLeadTrendView('yearly')}
                          className={`px-3 py-2 text-sm font-medium transition-all ${ltrLeadTrendView === 'yearly' ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Yearly
                        </button>
                      </div>
                    </div>
                    {(() => {
                      const trendData = ltrLeadTrendView === 'monthly' ? ltrLeadTrendMonthly : ltrLeadTrendYearly;
                      if (trendData.length === 0) {
                        return <div className="flex items-center justify-center h-[300px] text-gray-500 text-sm">No trend data for {ltrLeadTrendView} view</div>;
                      }
                      return (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={trendData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 11, fill: '#64748b' }}
                              axisLine={{ stroke: '#e2e8f0' }}
                              tickLine={false}
                              angle={ltrLeadTrendView === 'yearly' ? 0 : -22}
                              textAnchor={ltrLeadTrendView === 'yearly' ? 'middle' : 'end'}
                              height={44}
                            />
                            <YAxis
                              tick={{ fontSize: 11, fill: '#64748b' }}
                              axisLine={false}
                              tickLine={false}
                              label={{ value: 'Total Leads', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }}
                              width={40}
                            />
                            <Tooltip
                              contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', padding: '10px 14px' }}
                              formatter={(value, name) => [Number(value).toLocaleString(), name]}
                            />
                            <Legend wrapperStyle={{ paddingTop: 10 }} iconType="circle" iconSize={8} />
                            {LTR_LEAD_SERIES_LEAD_BY_TRIP.map((s) => (
                              <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} stackId="a" radius={[4, 4, 0, 0]} />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                    </div>
                  </motion.div>

                  {/* Lead mix — donut (share of totals) */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-orange-500" />
                    <div className="pl-2">
                    <div className="mb-1 flex items-center gap-2">
                      <Circle className="h-5 w-5 text-amber-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Lead Mix</h3>
                    </div>
                    <p className="text-sm text-gray-500">Share of total leads (Trip Ended, New, Renew)</p>
                    </div>
                    <div className="mt-2">
                    {ltrLeadPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={ltrLeadPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={64}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                          >
                            {ltrLeadPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name, props) => {
                              const total = (ltrLeadPieData || []).reduce((s, d) => s + d.value, 0);
                              const pct = total ? ((value / total) * 100).toFixed(1) : 0;
                              return [`${Number(value).toLocaleString()} (${pct}%)`, name];
                            }}
                            contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', padding: '10px 14px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[300px] items-center justify-center rounded-xl bg-gray-50/50 text-sm text-gray-500">No data to display</div>
                    )}
                    </div>
                  </motion.div>
                </div>
              </>
            )}

            {/* Data table */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Date</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Current Trip</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Trip Ended</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">New Trip</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Renew Trip</th>
                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ltrLeadLoading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                          <span className="inline-flex items-center gap-2"><Loader className="h-4 w-4 animate-spin" /> Loading lead data…</span>
                        </td>
                      </tr>
                    ) : ltrLeadRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12">
                          <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50/80 py-10 text-center">
                            <Target className="mb-3 h-12 w-12 text-gray-300" />
                            <p className="text-sm font-medium text-gray-600">No lead data yet</p>
                            <p className="mt-1 text-xs text-gray-500">Add rows manually or import from Excel. {!ltrLeadUseLocalStorage && 'Data is saved to the database.'}</p>
                            <div className="mt-4 flex gap-3">
                              <button type="button" onClick={() => { setLtrLeadEditingRecord(null); setLtrLeadFormData({ date: '', current_trip: '', trip_ended: '', new_trip: '', renew_trip: '' }); setLtrLeadShowForm(true); }} className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700">Add first row</button>
                              <button type="button" onClick={() => ltrLeadFileInputRef.current?.click()} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Import Excel</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pagedLtrLeadRecords.map((record, idx) => (
                        <tr key={record.id} className={`transition hover:bg-teal-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-gray-900">{formatLtrLeadDateDisplay(record.date)}</td>
                          <td className="whitespace-nowrap px-5 py-3 text-sm tabular-nums text-gray-900">{record.current_trip ?? '—'}</td>
                          <td className="whitespace-nowrap px-5 py-3 text-sm tabular-nums text-gray-900">{record.trip_ended ?? '—'}</td>
                          <td className="whitespace-nowrap px-5 py-3 text-sm tabular-nums text-gray-900">{record.new_trip ?? '—'}</td>
                          <td className="whitespace-nowrap px-5 py-3 text-sm tabular-nums text-gray-900">{record.renew_trip ?? '—'}</td>
                          <td className="whitespace-nowrap px-5 py-3 text-right">
                            <button type="button" onClick={() => handleLtrLeadEdit(record)} className="rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50" title="Edit"><Edit className="h-4 w-4" /></button>
                            <button type="button" onClick={() => handleLtrLeadDelete(record.id)} className="rounded-lg p-2 text-red-600 transition hover:bg-red-50" title="Delete"><Trash className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100">
                <PaginationControls
                  page={ltrLeadCurrentPage}
                  totalPages={ltrLeadTotalPages}
                  totalItems={ltrLeadRecords.length}
                  pageSize={LTR_LEAD_PAGE_SIZE}
                  onPageChange={setLtrLeadPage}
                />
              </div>
            </motion.div>

            {/* Add/Edit form */}
            {ltrLeadShowForm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-2xl border-2 border-teal-100 bg-white shadow-md">
                <div className="border-b border-gray-100 bg-gradient-to-r from-teal-50 to-emerald-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{ltrLeadEditingRecord ? 'Edit Record' : 'Add Record'}</h3>
                    <button type="button" onClick={resetLtrLeadForm} className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white hover:text-gray-700"><X className="h-5 w-5" /></button>
                  </div>
                </div>
                <form onSubmit={handleLtrLeadSubmit} className="grid grid-cols-1 gap-4 p-6 md:grid-cols-5">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" value={ltrLeadFormData.date} onChange={(e) => setLtrLeadFormData({ ...ltrLeadFormData, date: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Current Trip</label>
                    <input type="number" min={0} value={ltrLeadFormData.current_trip} onChange={(e) => setLtrLeadFormData({ ...ltrLeadFormData, current_trip: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" placeholder="0" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Trip Ended</label>
                    <input type="number" min={0} value={ltrLeadFormData.trip_ended} onChange={(e) => setLtrLeadFormData({ ...ltrLeadFormData, trip_ended: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" placeholder="0" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">New Trip</label>
                    <input type="number" min={0} value={ltrLeadFormData.new_trip} onChange={(e) => setLtrLeadFormData({ ...ltrLeadFormData, new_trip: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" placeholder="0" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Renew Trip</label>
                    <input type="number" min={0} value={ltrLeadFormData.renew_trip} onChange={(e) => setLtrLeadFormData({ ...ltrLeadFormData, renew_trip: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" placeholder="0" />
                  </div>
                  <div className="flex gap-3 md:col-span-5">
                    <button type="submit" className="rounded-xl bg-teal-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-teal-700">{ltrLeadEditingRecord ? 'Update' : 'Add'}</button>
                    <button type="button" onClick={resetLtrLeadForm} className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* LTR Customer Lead Import Modal with column mapping */}
            <AnimatePresence>
              {ltrLeadImportModalOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeLtrLeadImportModal}>
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">Import LTR Customer Lead from Excel</h2>
                      <button onClick={closeLtrLeadImportModal} disabled={ltrLeadImporting} className="text-gray-400 hover:text-gray-600 disabled:opacity-50"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="p-6">
                      {ltrLeadExcelHeaders.length > 0 && (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600">Map your Excel columns to the lead parameters:</p>
                          <div className="grid grid-cols-1 gap-3">
                            {['date', 'current_trip', 'trip_ended', 'new_trip', 'renew_trip'].map((param) => (
                              <div key={param} className="flex items-center gap-3">
                                <label className="w-36 text-sm font-medium text-gray-700 capitalize">{param.replace('_', ' ')}</label>
                                <select
                                  value={ltrLeadColumnMapping[param]}
                                  onChange={(e) => setLtrLeadColumnMapping(prev => ({ ...prev, [param]: e.target.value }))}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                >
                                  <option value="">— Skip / Not in file —</option>
                                  {ltrLeadExcelHeaders.map((h, idx) => (
                                    <option key={idx} value={String(idx)}>{h || `Column ${idx + 1}`}</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                          <button type="button" onClick={applyLtrLeadMapping} className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                            Apply mapping & preview
                          </button>
                        </div>
                      )}
                      {ltrLeadImportPreview && ltrLeadImportPreview.length > 0 && (
                        <div className="mt-6">
                          <p className="text-sm font-medium text-gray-700 mb-2">Preview: {ltrLeadImportPreview.length} row(s)</p>
                          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg mb-4">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 text-left">Date</th>
                                  <th className="px-3 py-2 text-left">Current Trip</th>
                                  <th className="px-3 py-2 text-left">Trip Ended</th>
                                  <th className="px-3 py-2 text-left">New Trip</th>
                                  <th className="px-3 py-2 text-left">Renew Trip</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ltrLeadImportPreview.slice(0, 8).map((row, i) => (
                                  <tr key={row.id} className="border-t">
                                    <td className="px-3 py-2">{formatLtrLeadDateDisplay(row.date)}</td>
                                    <td className="px-3 py-2">{row.current_trip}</td>
                                    <td className="px-3 py-2">{row.trip_ended}</td>
                                    <td className="px-3 py-2">{row.new_trip}</td>
                                    <td className="px-3 py-2">{row.renew_trip}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {ltrLeadImportPreview.length > 8 && <p className="p-2 text-center text-xs text-gray-500">… and {ltrLeadImportPreview.length - 8} more</p>}
                          </div>
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={closeLtrLeadImportModal} disabled={ltrLeadImporting} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                            <button type="button" onClick={handleLtrLeadImportConfirm} disabled={ltrLeadImporting} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
                              {ltrLeadImporting ? <><Loader className="w-4 h-4 animate-spin" /> Importing…</> : <>Import {ltrLeadImportPreview.length} record(s)</>}
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

        {activeTab === 'ltr-customer-review' && (
          <div className="space-y-6">
            {/* Section header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                    <Star className="w-8 h-8 text-amber-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">LTR Customer Review</h1>
                    <p className="text-gray-500 mt-0.5">Customer Name, Rental Duration, Rental Renew, Rental No longer Continue, Remark</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input ref={ltrReviewFileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleLtrReviewImportFileSelect} />
                  <button
                    type="button"
                    onClick={() => ltrReviewFileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow"
                  >
                    <Upload className="w-4 h-4" />
                    Import from Excel
                  </button>
                  <button
                    onClick={() => { setLtrReviewEditingRecord(null); setLtrReviewFormData({ customer_name: '', rental_duration: '', rental_renew: '', rental_no_longer_continue: '', remark: '' }); setLtrReviewShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all shadow-sm hover:shadow"
                  >
                    <Plus className="w-4 h-4" />
                    Add Row
                  </button>
                </div>
              </div>
            </div>

            {/* Per-customer chart: renewals by rental duration */}
            {ltrReviewRecords.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Renewals by Rental Duration (per customer)</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Select a customer to see how many times they renewed and for which rental duration</p>
                </div>
                <div className="mb-4 max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <select
                    value={ltrReviewChartCustomer}
                    onChange={(e) => setLtrReviewChartCustomer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">— Select customer —</option>
                    {ltrReviewCustomerNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                {ltrReviewChartCustomer && (
                  ltrReviewChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={ltrReviewChartData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                          dataKey="duration"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={{ stroke: '#e2e8f0' }}
                          tickLine={false}
                          label={{ value: 'Rental Duration', position: 'insideBottom', offset: -4, style: { fontSize: 11, fill: '#64748b' } }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                          label={{ value: 'Number of Renewals', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }}
                          width={42}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', padding: '10px 14px' }}
                          formatter={(value) => [Number(value).toLocaleString(), 'Renewals']}
                        />
                        <Bar dataKey="renewals" name="Renewals" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-sm py-8">No renewal data for this customer.</p>
                  )
                )}
              </motion.div>
            )}

            {/* Data table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rental Duration</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rental Renew</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rental No longer Continue</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Remark</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ltrReviewLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading…</td>
                      </tr>
                    ) : ltrReviewRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No data yet. Add rows to track customer reviews. {!ltrReviewUseLocalStorage && 'Data is saved to the database.'}
                        </td>
                      </tr>
                    ) : (
                      pagedLtrReviewRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{record.customer_name ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.rental_duration ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.rental_renew ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.rental_no_longer_continue ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={record.remark ?? ''}>{record.remark ?? '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => handleLtrReviewEdit(record)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Edit"><Edit className="w-4 h-4 inline" /></button>
                            <button onClick={() => handleLtrReviewDelete(record.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded ml-1" title="Delete"><Trash className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-gray-100">
                <PaginationControls
                  page={ltrReviewCurrentPage}
                  totalPages={ltrReviewTotalPages}
                  totalItems={ltrReviewRecords.length}
                  pageSize={LTR_REVIEW_PAGE_SIZE}
                  onPageChange={setLtrReviewPage}
                />
              </div>
            </div>

            {/* Add/Edit form */}
            {ltrReviewShowForm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{ltrReviewEditingRecord ? 'Edit Record' : 'Add Record'}</h3>
                  <button onClick={resetLtrReviewForm} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleLtrReviewSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input type="text" value={ltrReviewFormData.customer_name} onChange={(e) => setLtrReviewFormData({ ...ltrReviewFormData, customer_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" placeholder="Customer name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rental Duration</label>
                    <input type="text" value={ltrReviewFormData.rental_duration} onChange={(e) => setLtrReviewFormData({ ...ltrReviewFormData, rental_duration: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" placeholder="e.g. 6 months, 12 months" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rental Renew</label>
                    <input type="number" min={0} value={ltrReviewFormData.rental_renew} onChange={(e) => setLtrReviewFormData({ ...ltrReviewFormData, rental_renew: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rental No longer Continue</label>
                    <input type="number" min={0} value={ltrReviewFormData.rental_no_longer_continue} onChange={(e) => setLtrReviewFormData({ ...ltrReviewFormData, rental_no_longer_continue: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" placeholder="0" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                    <textarea value={ltrReviewFormData.remark} onChange={(e) => setLtrReviewFormData({ ...ltrReviewFormData, remark: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" placeholder="Optional notes" />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">{ltrReviewEditingRecord ? 'Update' : 'Add'}</button>
                    <button type="button" onClick={resetLtrReviewForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* LTR Customer Review Import Modal with column mapping */}
            <AnimatePresence>
              {ltrReviewImportModalOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeLtrReviewImportModal}>
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">Import LTR Customer Review from Excel</h2>
                      <button type="button" onClick={closeLtrReviewImportModal} disabled={ltrReviewImporting} className="text-gray-400 hover:text-gray-600 disabled:opacity-50"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="p-6">
                      {ltrReviewExcelHeaders.length > 0 && (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600">Map your Excel columns to the review parameters:</p>
                          <div className="grid grid-cols-1 gap-3">
                            {[
                              { key: 'customer_name', label: 'Customer Name' },
                              { key: 'rental_duration', label: 'Rental Duration' },
                              { key: 'rental_renew', label: 'Rental Renew' },
                              { key: 'rental_no_longer_continue', label: 'Rental No longer Continue' },
                              { key: 'remark', label: 'Remark' }
                            ].map(({ key, label }) => (
                              <div key={key} className="flex items-center gap-3">
                                <label className="w-48 text-sm font-medium text-gray-700">{label}</label>
                                <select
                                  value={ltrReviewColumnMapping[key]}
                                  onChange={(e) => setLtrReviewColumnMapping(prev => ({ ...prev, [key]: e.target.value }))}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                >
                                  <option value="">— Skip / Not in file —</option>
                                  {ltrReviewExcelHeaders.map((h, idx) => (
                                    <option key={idx} value={String(idx)}>{h || `Column ${idx + 1}`}</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                          <button type="button" onClick={applyLtrReviewMapping} className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                            Apply mapping &amp; preview
                          </button>
                        </div>
                      )}
                      {ltrReviewImportPreview && ltrReviewImportPreview.length > 0 && (
                        <div className="mt-6">
                          <p className="text-sm font-medium text-gray-700 mb-2">Preview: {ltrReviewImportPreview.length} row(s)</p>
                          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg mb-4">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 text-left">Customer Name</th>
                                  <th className="px-3 py-2 text-left">Rental Duration</th>
                                  <th className="px-3 py-2 text-left">Rental Renew</th>
                                  <th className="px-3 py-2 text-left">No longer Continue</th>
                                  <th className="px-3 py-2 text-left">Remark</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ltrReviewImportPreview.slice(0, 8).map((row, i) => (
                                  <tr key={row.id} className="border-t">
                                    <td className="px-3 py-2">{row.customer_name || '—'}</td>
                                    <td className="px-3 py-2">{row.rental_duration || '—'}</td>
                                    <td className="px-3 py-2">{row.rental_renew}</td>
                                    <td className="px-3 py-2">{row.rental_no_longer_continue}</td>
                                    <td className="px-3 py-2 truncate max-w-[120px]" title={row.remark || ''}>{row.remark || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {ltrReviewImportPreview.length > 8 && <p className="p-2 text-center text-xs text-gray-500">… and {ltrReviewImportPreview.length - 8} more</p>}
                          </div>
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={closeLtrReviewImportModal} disabled={ltrReviewImporting} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                            <button type="button" onClick={handleLtrReviewImportConfirm} disabled={ltrReviewImporting} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2">
                              {ltrReviewImporting ? <><Loader className="w-4 h-4 animate-spin" /> Importing…</> : <><CheckCircle className="w-4 h-4" /> Import {ltrReviewImportPreview.length} record(s)</>}
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
