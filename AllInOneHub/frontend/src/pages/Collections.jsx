import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import collectionService from '../services/collectionService';
import { 
  AddPaymentModal, 
  RecordPaymentModal, 
  AddReminderModal, 
  AddChecklistModal 
} from '../components/CollectionModals';
import { 
  DollarSign,
  Bell,
  CheckSquare,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  Clock,
  User,
  Phone,
  Mail,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Check,
  AlertTriangle,
  FileText,
  Activity,
  Target,
  ListChecks
} from 'lucide-react';

const Collections = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('payments'); // 'payments', 'reminders', 'checklist'
  
  const [paymentFilters, setPaymentFilters] = useState({
    status: '',
    priority: ''
  });
  
  // Modal states
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [showAddChecklistModal, setShowAddChecklistModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch payments with React Query
  const { data: paymentsData = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['collections', 'payments', paymentFilters],
    queryFn: () => collectionService.getAllPayments(paymentFilters),
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    keepPreviousData: true,
  });

  // Fetch payment stats
  const { data: paymentStatsData = {} } = useQuery({
    queryKey: ['collections', 'paymentStats'],
    queryFn: () => collectionService.getPaymentStats(),
    staleTime: 1 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch reminders with React Query
  const { data: remindersData = [] } = useQuery({
    queryKey: ['collections', 'reminders'],
    queryFn: () => collectionService.getAllReminders(),
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch today's reminders
  const { data: todaysRemindersData = [] } = useQuery({
    queryKey: ['collections', 'todaysReminders'],
    queryFn: () => collectionService.getTodaysReminders(),
    staleTime: 1 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch upcoming reminders
  const { data: upcomingRemindersData = [] } = useQuery({
    queryKey: ['collections', 'upcomingReminders'],
    queryFn: () => collectionService.getUpcomingReminders(7),
    staleTime: 1 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch checklist items
  const { data: checklistItemsData = [] } = useQuery({
    queryKey: ['collections', 'checklist'],
    queryFn: () => collectionService.getAllChecklistItems(),
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch today's checklist
  const { data: todaysChecklistData = [] } = useQuery({
    queryKey: ['collections', 'todaysChecklist'],
    queryFn: () => collectionService.getTodaysChecklist(),
    staleTime: 1 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch checklist stats
  const { data: checklistStatsData = {} } = useQuery({
    queryKey: ['collections', 'checklistStats'],
    queryFn: () => collectionService.getChecklistStats(),
    staleTime: 1 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Extract data from queries
  const payments = useMemo(() => paymentsData || [], [paymentsData]);
  const paymentStats = useMemo(() => paymentStatsData || {}, [paymentStatsData]);
  const reminders = useMemo(() => remindersData || [], [remindersData]);
  const todaysReminders = useMemo(() => todaysRemindersData || [], [todaysRemindersData]);
  const upcomingReminders = useMemo(() => upcomingRemindersData || [], [upcomingRemindersData]);
  const checklistItems = useMemo(() => checklistItemsData || [], [checklistItemsData]);
  const todaysChecklist = useMemo(() => todaysChecklistData || [], [todaysChecklistData]);
  const checklistStats = useMemo(() => checklistStatsData || {}, [checklistStatsData]);
  const loading = paymentsLoading && !paymentsData;

  // Subscribe to real-time updates
  useEffect(() => {
    const paymentsSubscription = collectionService.subscribeToPayments((payload) => {
      console.log('Payment updated:', payload);
      queryClient.invalidateQueries(['collections', 'payments']);
      queryClient.invalidateQueries(['collections', 'paymentStats']);
    });
    
    const remindersSubscription = collectionService.subscribeToReminders((payload) => {
      console.log('Reminder updated:', payload);
      queryClient.invalidateQueries(['collections', 'reminders']);
      queryClient.invalidateQueries(['collections', 'todaysReminders']);
      queryClient.invalidateQueries(['collections', 'upcomingReminders']);
    });
    
    const checklistSubscription = collectionService.subscribeToChecklist((payload) => {
      console.log('Checklist updated:', payload);
      queryClient.invalidateQueries(['collections', 'checklist']);
      queryClient.invalidateQueries(['collections', 'todaysChecklist']);
      queryClient.invalidateQueries(['collections', 'checklistStats']);
    });
    
    return () => {
      paymentsSubscription.unsubscribe();
      remindersSubscription.unsubscribe();
      checklistSubscription.unsubscribe();
    };
  }, [queryClient]);

  const handleAcknowledgeReminder = async (reminderId, action) => {
    try {
      await collectionService.acknowledgeReminder(reminderId, action);
      queryClient.invalidateQueries(['collections', 'reminders']);
      queryClient.invalidateQueries(['collections', 'todaysReminders']);
      queryClient.invalidateQueries(['collections', 'upcomingReminders']);
    } catch (error) {
      console.error('Error acknowledging reminder:', error);
    }
  };

  const handleCompleteChecklist = async (itemId, notes) => {
    try {
      await collectionService.completeChecklistItem(itemId, notes);
      queryClient.invalidateQueries(['collections', 'checklist']);
      queryClient.invalidateQueries(['collections', 'todaysChecklist']);
      queryClient.invalidateQueries(['collections', 'checklistStats']);
    } catch (error) {
      console.error('Error completing checklist item:', error);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      partially_paid: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      Low: 'bg-blue-100 text-blue-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-orange-100 text-orange-800',
      Urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Collection Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <DollarSign className="w-8 h-8 mr-3 text-blue-600" />
                Collection Department
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage customer payments, reminders, and collection activities
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
                <Activity className="w-5 h-5 mr-2" />
                Activity Log
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
                <FileText className="w-5 h-5 mr-2" />
                Reports
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Outstanding</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  AED {paymentStats.totalOutstanding?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Collected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  AED {paymentStats.totalCollected?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Payments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {paymentStats.overdueCount || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Reminders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {todaysReminders.length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-4 px-6 text-sm font-medium border-b-2 flex items-center transition-colors ${
                  activeTab === 'payments'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Payment Collection
              </button>
              <button
                onClick={() => setActiveTab('reminders')}
                className={`py-4 px-6 text-sm font-medium border-b-2 flex items-center transition-colors ${
                  activeTab === 'reminders'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Bell className="w-5 h-5 mr-2" />
                Collection Reminders
                {todaysReminders.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {todaysReminders.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('checklist')}
                className={`py-4 px-6 text-sm font-medium border-b-2 flex items-center transition-colors ${
                  activeTab === 'checklist'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <CheckSquare className="w-5 h-5 mr-2" />
                Collection Checklist
                {checklistStats.pending > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {checklistStats.pending}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Payment Collection Tab */}
        {activeTab === 'payments' && (
          <PaymentCollectionSection
            payments={payments}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            paymentFilters={paymentFilters}
            setPaymentFilters={setPaymentFilters}
            onAddPayment={() => setShowAddPaymentModal(true)}
            onRecordPayment={(payment) => {
              setSelectedPayment(payment);
              setShowRecordPaymentModal(true);
            }}
            getStatusBadgeColor={getStatusBadgeColor}
            getPriorityBadgeColor={getPriorityBadgeColor}
            loadPayments={() => queryClient.invalidateQueries(['collections', 'payments'])}
          />
        )}

        {/* Collection Reminders Tab */}
        {activeTab === 'reminders' && (
          <CollectionRemindersSection
            todaysReminders={todaysReminders}
            upcomingReminders={upcomingReminders}
            allReminders={reminders}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddReminder={() => setShowAddReminderModal(true)}
            onAcknowledgeReminder={handleAcknowledgeReminder}
            loadReminders={() => {
              queryClient.invalidateQueries(['collections', 'reminders']);
              queryClient.invalidateQueries(['collections', 'todaysReminders']);
              queryClient.invalidateQueries(['collections', 'upcomingReminders']);
            }}
          />
        )}

        {/* Collection Checklist Tab */}
        {activeTab === 'checklist' && (
          <CollectionChecklistSection
            todaysChecklist={todaysChecklist}
            allChecklistItems={checklistItems}
            checklistStats={checklistStats}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddChecklistItem={() => setShowAddChecklistModal(true)}
            onCompleteItem={handleCompleteChecklist}
            getPriorityBadgeColor={getPriorityBadgeColor}
            loadChecklist={() => {
              queryClient.invalidateQueries(['collections', 'checklist']);
              queryClient.invalidateQueries(['collections', 'todaysChecklist']);
              queryClient.invalidateQueries(['collections', 'checklistStats']);
            }}
          />
        )}

        {/* Modals */}
        <AddPaymentModal
          isOpen={showAddPaymentModal}
          onClose={() => setShowAddPaymentModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['collections', 'payments']);
            queryClient.invalidateQueries(['collections', 'paymentStats']);
          }}
        />

        <RecordPaymentModal
          isOpen={showRecordPaymentModal}
          onClose={() => setShowRecordPaymentModal(false)}
          payment={selectedPayment}
          onSuccess={() => {
            queryClient.invalidateQueries(['collections', 'payments']);
            queryClient.invalidateQueries(['collections', 'paymentStats']);
          }}
        />

        <AddReminderModal
          isOpen={showAddReminderModal}
          onClose={() => setShowAddReminderModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['collections', 'reminders']);
            queryClient.invalidateQueries(['collections', 'todaysReminders']);
            queryClient.invalidateQueries(['collections', 'upcomingReminders']);
          }}
        />

        <AddChecklistModal
          isOpen={showAddChecklistModal}
          onClose={() => setShowAddChecklistModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['collections', 'checklist']);
            queryClient.invalidateQueries(['collections', 'todaysChecklist']);
            queryClient.invalidateQueries(['collections', 'checklistStats']);
          }}
        />
      </div>
    </div>
  );
};

// Payment Collection Section Component
const PaymentCollectionSection = ({ 
  payments, 
  searchTerm, 
  setSearchTerm, 
  paymentFilters, 
  setPaymentFilters,
  onAddPayment,
  onRecordPayment,
  getStatusBadgeColor,
  getPriorityBadgeColor,
  loadPayments
}) => {
  const queryClient = useQueryClient();
  const filteredPayments = payments.filter(payment =>
    payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customer_phone?.includes(searchTerm) ||
    payment.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by customer name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <select
              value={paymentFilters.status}
              onChange={(e) => {
                setPaymentFilters({ ...paymentFilters, status: e.target.value });
                queryClient.invalidateQueries(['collections', 'payments']);
                queryClient.invalidateQueries(['collections', 'paymentStats']);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
            </select>
            
            <select
              value={paymentFilters.priority}
              onChange={(e) => {
                setPaymentFilters({ ...paymentFilters, priority: e.target.value });
                // Filters change will trigger query refetch automatically via queryKey dependency
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          
          <button
            onClick={onAddPayment}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Payment
          </button>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount / Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {payment.customer_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        {payment.customer_phone && (
                          <span className="flex items-center mr-3">
                            <Phone className="w-3 h-3 mr-1" />
                            {payment.customer_phone}
                          </span>
                        )}
                        {payment.customer_email && (
                          <span className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {payment.customer_email}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        AED {payment.payment_amount?.toLocaleString()}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        Balance: AED {payment.balance_remaining?.toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(payment.payment_due_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(payment.payment_status)}`}>
                      {payment.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadgeColor(payment.collection_priority)}`}>
                      {payment.collection_priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => onRecordPayment(payment)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Record Payment"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Collection Reminders Section Component
const CollectionRemindersSection = ({
  todaysReminders,
  upcomingReminders,
  allReminders,
  searchTerm,
  setSearchTerm,
  onAddReminder,
  onAcknowledgeReminder,
  loadReminders
}) => {
  return (
    <div className="space-y-6">
      {/* Search and Add */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search reminders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={onAddReminder}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Reminder
          </button>
        </div>
      </div>

      {/* Today's Reminders */}
      {todaysReminders.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
            Today's Reminders ({todaysReminders.length})
          </h3>
          <div className="space-y-3">
            {todaysReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Bell className="w-4 h-4 mr-2 text-red-600" />
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {reminder.reminder_title}
                      </h4>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        {reminder.reminder_time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                      {reminder.reminder_message}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <User className="w-3 h-3 mr-1" />
                      {reminder.customer_name}
                      {reminder.customer_phone && (
                        <>
                          <span className="mx-2">•</span>
                          <Phone className="w-3 h-3 mr-1" />
                          {reminder.customer_phone}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onAcknowledgeReminder(reminder.id, 'Contacted customer')}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                      title="Mark as Contacted"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors" title="Snooze">
                      <Clock className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reminders */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Upcoming Reminders (Next 7 Days)
        </h3>
        <div className="space-y-3">
          {upcomingReminders.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No upcoming reminders</p>
          ) : (
            upcomingReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-blue-600" />
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {reminder.reminder_title}
                      </h4>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(reminder.reminder_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                      {reminder.reminder_message}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <User className="w-3 h-3 mr-1" />
                      {reminder.customer_name}
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Collection Checklist Section Component
const CollectionChecklistSection = ({
  todaysChecklist,
  allChecklistItems,
  checklistStats,
  searchTerm,
  setSearchTerm,
  onAddChecklistItem,
  onCompleteItem,
  getPriorityBadgeColor,
  loadChecklist
}) => {
  return (
    <div className="space-y-6">
      {/* Search and Add */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search checklist items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={onAddChecklistItem}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Task
          </button>
        </div>
      </div>

      {/* Checklist Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{checklistStats.total || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">{checklistStats.pending || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{checklistStats.inProgress || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{checklistStats.completed || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
        </div>
      </div>

      {/* Today's Checklist */}
      {todaysChecklist.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-orange-600" />
            Today's Tasks ({todaysChecklist.length})
          </h3>
          <div className="space-y-3">
            {todaysChecklist.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <input
                      type="checkbox"
                      checked={item.status === 'completed'}
                      onChange={() => {
                        if (item.status !== 'completed') {
                          onCompleteItem(item.id, 'Completed via checklist');
                        }
                      }}
                      className="mt-1 mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className={`text-sm font-semibold ${item.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                          {item.checklist_title}
                        </h4>
                        <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityBadgeColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      {item.checklist_description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {item.checklist_description}
                        </p>
                      )}
                      {item.customer_name && (
                        <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <User className="w-3 h-3 mr-1" />
                          {item.customer_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-4">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Checklist Items */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <ListChecks className="w-5 h-5 mr-2 text-blue-600" />
          All Tasks
        </h3>
        <div className="space-y-2">
          {allChecklistItems.filter(item => item.status !== 'completed').length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No active tasks</p>
          ) : (
            allChecklistItems
              .filter(item => item.status !== 'completed')
              .map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => onCompleteItem(item.id, 'Completed')}
                        className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.checklist_title}
                          </span>
                          {item.due_date && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              {new Date(item.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityBadgeColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Collections;
