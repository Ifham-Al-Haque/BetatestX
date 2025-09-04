// Payment Service - Shared data management for payments across components
class PaymentService {
  constructor() {
    // Initialize with sample data - in production this would come from API
    this.payments = [
      {
        id: 1,
        title: 'Driver Salary - John Smith',
        amount: 50000,
        dueDate: '2025-01-20',
        type: 'salary',
        priority: 'high',
        status: 'pending',
        description: 'Monthly driver salary payment',
        category: 'personnel'
      },
      {
        id: 2,
        title: 'Fuel Payment - Fleet 001',
        amount: 25000,
        dueDate: '2025-01-22',
        type: 'expense',
        priority: 'medium',
        status: 'pending',
        description: 'Fuel refill for fleet vehicles',
        category: 'operational'
      },
      {
        id: 3,
        title: 'Vehicle Maintenance - ABC-123',
        amount: 15000,
        dueDate: '2025-01-25',
        type: 'maintenance',
        priority: 'low',
        status: 'pending',
        description: 'Regular vehicle maintenance service',
        category: 'maintenance'
      },
      {
        id: 4,
        title: 'Insurance Premium',
        amount: 75000,
        dueDate: '2025-01-30',
        type: 'insurance',
        priority: 'high',
        status: 'pending',
        description: 'Annual fleet insurance premium',
        category: 'insurance'
      },
      {
        id: 5,
        title: 'Office Rent',
        amount: 120000,
        dueDate: '2025-02-01',
        type: 'rent',
        priority: 'high',
        status: 'pending',
        description: 'Monthly office space rental',
        category: 'operational'
      },
      {
        id: 6,
        title: 'Internet & Utilities',
        amount: 15000,
        dueDate: '2025-02-05',
        type: 'utilities',
        priority: 'medium',
        status: 'pending',
        description: 'Monthly internet and utility bills',
        category: 'operational'
      },
      {
        id: 7,
        title: 'Vehicle Registration Renewal',
        amount: 8500,
        dueDate: '2025-01-15',
        type: 'registration',
        priority: 'high',
        status: 'pending',
        description: 'Annual vehicle registration renewal',
        category: 'operational'
      },
      {
        id: 8,
        title: 'Driver Training Program',
        amount: 30000,
        dueDate: '2025-01-18',
        type: 'training',
        priority: 'medium',
        status: 'pending',
        description: 'Driver safety training program',
        category: 'personnel'
      }
    ];

    this.subscribers = [];
  }

  // Get all payments
  getAllPayments() {
    return [...this.payments];
  }

  // Get payments for a specific date
  getPaymentsForDate(date) {
    const dateString = date.toISOString().split('T')[0];
    return this.payments.filter(payment => payment.dueDate === dateString);
  }

  // Get upcoming payments (future dates)
  getUpcomingPayments() {
    const today = new Date();
    return this.payments.filter(payment => {
      const dueDate = new Date(payment.dueDate);
      return dueDate >= today;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  // Get payments by status
  getPaymentsByStatus(status) {
    return this.payments.filter(payment => payment.status === status);
  }

  // Get payments by priority
  getPaymentsByPriority(priority) {
    return this.payments.filter(payment => payment.priority === priority);
  }

  // Get payments by type
  getPaymentsByType(type) {
    return this.payments.filter(payment => payment.type === type);
  }

  // Add new payment
  addPayment(payment) {
    const newPayment = {
      ...payment,
      id: Date.now(), // Simple ID generation
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    this.payments.push(newPayment);
    this.notifySubscribers();
    return newPayment;
  }

  // Update payment
  updatePayment(id, updates) {
    const index = this.payments.findIndex(payment => payment.id === id);
    if (index !== -1) {
      this.payments[index] = { ...this.payments[index], ...updates };
      this.notifySubscribers();
      return this.payments[index];
    }
    return null;
  }

  // Delete payment
  deletePayment(id) {
    const index = this.payments.findIndex(payment => payment.id === id);
    if (index !== -1) {
      const deletedPayment = this.payments.splice(index, 1)[0];
      this.notifySubscribers();
      return deletedPayment;
    }
    return null;
  }

  // Get payment statistics
  getPaymentStats() {
    const totalScheduled = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const completed = this.payments.filter(p => p.status === 'completed').reduce((sum, payment) => sum + payment.amount, 0);
    const pending = this.payments.filter(p => p.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0);
    const overdue = this.payments.filter(p => {
      const dueDate = new Date(p.dueDate);
      const today = new Date();
      return dueDate < today && p.status === 'pending';
    }).reduce((sum, payment) => sum + payment.amount, 0);

    return {
      totalScheduled,
      completed,
      pending,
      overdue,
      totalCount: this.payments.length,
      pendingCount: this.payments.filter(p => p.status === 'pending').length,
      completedCount: this.payments.filter(p => p.status === 'completed').length,
      overdueCount: this.payments.filter(p => {
        const dueDate = new Date(p.dueDate);
        const today = new Date();
        return dueDate < today && p.status === 'pending';
      }).length
    };
  }

  // Subscribe to payment changes
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  // Notify all subscribers
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.payments));
  }

  // Get payments for dashboard summary
  getDashboardSummary() {
    const today = new Date();
    const thisWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const dueThisWeek = this.payments.filter(payment => {
      const dueDate = new Date(payment.dueDate);
      return dueDate <= thisWeek && dueDate >= today;
    });

    const dueThisMonth = this.payments.filter(payment => {
      const dueDate = new Date(payment.dueDate);
      return dueDate <= thisMonth && dueDate >= today;
    });

    return {
      dueThisWeek: dueThisWeek.reduce((sum, p) => sum + p.amount, 0),
      dueThisMonth: dueThisMonth.reduce((sum, p) => sum + p.amount, 0),
      recentPayments: this.payments
        .filter(p => p.status === 'completed')
        .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
        .slice(0, 5)
    };
  }
}

// Create singleton instance
const paymentService = new PaymentService();

export default paymentService;
