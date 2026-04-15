import { supabase } from '../supabaseClient';

/**
 * Activity Service for logging and retrieving user activities
 */
class ActivityService {
  constructor() {
    this.currentUser = null;
    this.sessionId = this.generateSessionId();
    
    // Initialize user tracking
    this.initializeUserTracking();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async initializeUserTracking() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        this.currentUser = user;
        // Log session start
        await this.logActivity('session_start', 'User session started', {
          sessionId: this.sessionId,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error initializing user tracking:', error);
    }
  }

  /**
   * Log user activity
   */
  async logActivity(action, description, options = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get user profile for role information
      let userProfile = null;
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role, email, full_name')
          .eq('auth_user_id', user.id)
          .single();
        userProfile = profile;
      }

      const activityData = {
        user_id: user?.id || null,
        user_email: user?.email || userProfile?.email || options.userEmail,
        user_role: userProfile?.role || options.userRole,
        action,
        description,
        resource_type: options.resourceType,
        resource_id: options.resourceId,
        old_values: options.oldValues,
        new_values: options.newValues,
        ip_address: options.ipAddress,
        user_agent: navigator.userAgent,
        session_id: this.sessionId,
        page_url: window.location.pathname + window.location.search,
        method: options.method,
        status_code: options.statusCode,
        duration_ms: options.durationMs,
        metadata: {
          ...options.metadata,
          timestamp: new Date().toISOString(),
          referrer: document.referrer,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      };

      const { data, error } = await supabase.rpc('log_user_activity', {
        p_user_id: activityData.user_id,
        p_user_email: activityData.user_email,
        p_user_role: activityData.user_role,
        p_action: activityData.action,
        p_description: activityData.description,
        p_resource_type: activityData.resource_type,
        p_resource_id: activityData.resource_id,
        p_old_values: activityData.old_values,
        p_new_values: activityData.new_values,
        p_ip_address: activityData.ip_address,
        p_user_agent: activityData.user_agent,
        p_session_id: activityData.session_id,
        p_page_url: activityData.page_url,
        p_method: activityData.method,
        p_status_code: activityData.status_code,
        p_duration_ms: activityData.duration_ms,
        p_metadata: activityData.metadata
      });

      if (error) {
        console.error('Error logging activity:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in logActivity:', error);
      return null;
    }
  }

  /**
   * Get activity logs with filtering and pagination
   */
  async getActivityLogs(options = {}) {
    try {
      let query = supabase
        .from('activity_logs')
        .select(`
          *
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options.userEmail) {
        query = query.eq('user_email', options.userEmail);
      }

      if (options.action) {
        query = query.eq('action', options.action);
      }

      if (options.resourceType) {
        query = query.eq('resource_type', options.resourceType);
      }

      if (options.userRole) {
        query = query.eq('user_role', options.userRole);
      }

      if (options.dateFrom) {
        query = query.gte('created_at', options.dateFrom);
      }

      if (options.dateTo) {
        query = query.lte('created_at', options.dateTo);
      }

      if (options.search) {
        query = query.or(`description.ilike.%${options.search}%,action.ilike.%${options.search}%,user_email.ilike.%${options.search}%`);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching activity logs:', error);
        return { data: [], error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getActivityLogs:', error);
      return { data: [], error };
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(daysBack = 30) {
    try {
      const { data, error } = await supabase.rpc('get_user_activity_stats', {
        days_back: daysBack
      });

      if (error) {
        console.error('Error fetching activity stats:', error);
        return null;
      }

      return data[0] || {};
    } catch (error) {
      console.error('Error in getActivityStats:', error);
      return null;
    }
  }

  /**
   * Get real-time activity logs
   */
  subscribeToActivityLogs(callback, filters = {}) {
    let channel = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          ...filters
        },
        callback
      )
      .subscribe();

    return channel;
  }

  /**
   * Common activity logging methods
   */
  async logLogin(method = 'email') {
    return this.logActivity('login', `User logged in via ${method}`, {
      method: 'POST',
      statusCode: 200,
      metadata: { loginMethod: method }
    });
  }

  async logLogout() {
    return this.logActivity('logout', 'User logged out', {
      method: 'POST',
      statusCode: 200
    });
  }

  async logPageView(pageName) {
    return this.logActivity('page_view', `Viewed ${pageName}`, {
      method: 'GET',
      statusCode: 200,
      metadata: { pageName }
    });
  }

  async logResourceCreate(resourceType, resourceId, data) {
    return this.logActivity(`${resourceType}_create`, `Created ${resourceType}`, {
      resourceType,
      resourceId,
      newValues: data,
      method: 'POST',
      statusCode: 201
    });
  }

  async logResourceUpdate(resourceType, resourceId, oldData, newData) {
    return this.logActivity(`${resourceType}_update`, `Updated ${resourceType}`, {
      resourceType,
      resourceId,
      oldValues: oldData,
      newValues: newData,
      method: 'PUT',
      statusCode: 200
    });
  }

  async logResourceDelete(resourceType, resourceId, data) {
    return this.logActivity(`${resourceType}_delete`, `Deleted ${resourceType}`, {
      resourceType,
      resourceId,
      oldValues: data,
      method: 'DELETE',
      statusCode: 200
    });
  }

  async logResourceView(resourceType, resourceId) {
    return this.logActivity(`${resourceType}_view`, `Viewed ${resourceType}`, {
      resourceType,
      resourceId,
      method: 'GET',
      statusCode: 200
    });
  }

  async logError(error, context = {}) {
    return this.logActivity('error', `Error occurred: ${error.message}`, {
      statusCode: context.statusCode || 500,
      metadata: {
        error: error.message,
        stack: error.stack,
        context
      }
    });
  }

  async logSearch(searchTerm, results, resourceType) {
    return this.logActivity('search', `Searched for "${searchTerm}"`, {
      resourceType,
      method: 'GET',
      statusCode: 200,
      metadata: {
        searchTerm,
        resultCount: results?.length || 0
      }
    });
  }

  async logExport(resourceType, format, recordCount) {
    return this.logActivity('export', `Exported ${resourceType} data`, {
      resourceType,
      method: 'GET',
      statusCode: 200,
      metadata: {
        format,
        recordCount
      }
    });
  }

  async logPermissionDenied(action, resource) {
    return this.logActivity('permission_denied', `Access denied for ${action} on ${resource}`, {
      statusCode: 403,
      metadata: {
        attemptedAction: action,
        resource
      }
    });
  }
}

// Create singleton instance
const activityService = new ActivityService();

// Auto-track page views
let currentPath = window.location.pathname;
const trackPageView = () => {
  const newPath = window.location.pathname;
  if (newPath !== currentPath) {
    currentPath = newPath;
    const pageName = newPath.split('/').filter(Boolean).join(' > ') || 'home';
    activityService.logPageView(pageName);
  }
};

// Track page changes
window.addEventListener('popstate', trackPageView);

// Track initial page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', trackPageView);
} else {
  trackPageView();
}

// Track page exit without interfering with tab restore/BFCache behavior
window.addEventListener('pagehide', () => {
  activityService.logActivity('page_unload', 'User left the page');
});

export default activityService;
