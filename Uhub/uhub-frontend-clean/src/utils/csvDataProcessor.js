// CSV Data Processor for Customer Service Performance Analysis

/**
 * Process and validate CSV data for customer service metrics
 * @param {Array} csvData - Array of objects from parsed CSV
 * @returns {Object} Processed and validated data with analytics
 */
export const processCustomerServiceData = (csvData) => {
  if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
    throw new Error('Invalid CSV data provided');
  }

  // Log available columns for debugging
  console.log('Available columns in CSV:', Object.keys(csvData[0]));

  // Validate required columns with flexible naming
  const firstRow = csvData[0];
  const availableColumns = Object.keys(firstRow);
  
  // Check if this is call center data or customer service ticket data
  const isCallCenterData = availableColumns.some(col => 
    ['Direction', 'Call Result', 'Agent', 'Talk Time', 'Queue'].includes(col)
  );
  
  if (isCallCenterData) {
    return processCallCenterData(csvData);
  } else {
    return processTicketData(csvData);
  }
};

const processCallCenterData = (csvData) => {
  const firstRow = csvData[0];
  const availableColumns = Object.keys(firstRow);
  
  const columnMappings = {
    'Call ID': ['Call ID', 'CallID', 'ID', 'Call Number', 'CallNumber'],
    'Direction': ['Direction', 'Call Direction', 'CallDirection', 'Type'],
    'Agent': ['Agent', 'Agent Name', 'AgentName', 'Representative', 'Rep'],
    'Call Result': ['Call Result', 'CallResult', 'Result', 'Status', 'Outcome'],
    'Talk Time': ['Talk Time', 'TalkTime', 'Duration', 'Call Duration', 'CallDuration'],
    'Queue': ['Queue', 'Queue Name', 'QueueName', 'Department']
  };
  
  const mappedColumns = {};
  const missingColumns = [];
  
  Object.entries(columnMappings).forEach(([requiredCol, possibleNames]) => {
    const foundColumn = possibleNames.find(name => availableColumns.includes(name));
    if (foundColumn) {
      mappedColumns[requiredCol] = foundColumn;
    } else {
      missingColumns.push(requiredCol);
    }
  });
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns for call center data: ${missingColumns.join(', ')}\n\nAvailable columns in your CSV: ${availableColumns.join(', ')}\n\nPlease ensure your CSV has columns for: Call ID, Direction, Agent, Call Result, and Talk Time.`);
  }
  
  console.log('Processing call center data with mapped columns:', mappedColumns);
  
  const processedData = csvData.map((row, index) => {
    const processed = {
      id: row[mappedColumns['Call ID']] || `C-${String(index + 1).padStart(3, '0')}`,
      direction: row[mappedColumns['Direction']] || 'Unknown',
      agent: row[mappedColumns['Agent']] || 'Unknown Agent',
      callResult: row[mappedColumns['Call Result']] || 'Unknown',
      talkTime: parseTimeValue(row[mappedColumns['Talk Time']] || ''),
      queue: row[mappedColumns['Queue']] || 'General',
      startDate: row['Start Date'] || row['StartDate'] || row['Date'] || row['Timestamp'] || new Date().toISOString(),
      timeInQueue: parseTimeValue(row['Time spent in Queue'] || row['Time spent in Queue'] || ''),
      abandoned: row['Abandoned'] === 'true' || row['Abandoned'] === '1' || row['Abandoned'] === 'yes',
      lostInIVR: row['Lost in IVR'] === 'true' || row['Lost in IVR'] === '1' || row['Lost in IVR'] === 'yes',
      surveyRating: parseFloat(row['Survey Rating'] || row['SurveyRating'] || '0') || 0,
      onHoldDuration: parseTimeValue(row['On hold Duration'] || row['On hold Duration'] || ''),
      repeats: parseInt(row['Repeats'] || '0') || 0
    };
    
    return processed;
  });

  // Generate call center analytics
  const analytics = generateCallCenterAnalytics(processedData);

  return {
    rawData: csvData,
    processedData,
    analytics,
    dataType: 'callCenter',
    summary: {
      totalCalls: processedData.length,
      totalAgents: new Set(processedData.map(d => d.agent)).size,
      dateRange: getDateRange(processedData),
      columns: Object.keys(firstRow)
    }
  };
};

const processTicketData = (csvData) => {
  const firstRow = csvData[0];
  const availableColumns = Object.keys(firstRow);
  
  const columnMappings = {
    'Ticket ID': ['Ticket ID', 'TicketID', 'Ticket', 'ID', 'Case ID', 'CaseID', 'Case'],
    'Customer Name': ['Customer Name', 'CustomerName', 'Customer', 'Name', 'Client Name', 'ClientName', 'Client'],
    'Issue Type': ['Issue Type', 'IssueType', 'Issue', 'Type', 'Problem Type', 'ProblemType', 'Category', 'Subject'],
    'Priority': ['Priority', 'Priority Level', 'PriorityLevel', 'Severity', 'Urgency', 'Level'],
    'Status': ['Status', 'State', 'Ticket Status', 'TicketState', 'Resolution Status', 'ResolutionState']
  };
  
  const mappedColumns = {};
  const missingColumns = [];
  
  Object.entries(columnMappings).forEach(([requiredCol, possibleNames]) => {
    const foundColumn = possibleNames.find(name => availableColumns.includes(name));
    if (foundColumn) {
      mappedColumns[requiredCol] = foundColumn;
    } else {
      missingColumns.push(requiredCol);
    }
  });
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns for ticket data: ${missingColumns.join(', ')}\n\nAvailable columns in your CSV: ${availableColumns.join(', ')}\n\nPlease ensure your CSV has columns for: Ticket ID, Customer Name, Issue Type, Priority, and Status.`);
  }
  
  console.log('Processing ticket data with mapped columns:', mappedColumns);
  
  const processedData = csvData.map((row, index) => {
    const processed = {
      id: row[mappedColumns['Ticket ID']] || `T-${String(index + 1).padStart(3, '0')}`,
      customerName: row[mappedColumns['Customer Name']] || 'Unknown Customer',
      issueType: row[mappedColumns['Issue Type']] || 'General',
      priority: normalizePriority(row[mappedColumns['Priority']]),
      status: normalizeStatus(row[mappedColumns['Status']]),
      responseTime: parseTimeValue(row['Response Time'] || row['ResponseTime'] || row['Response']),
      resolutionTime: parseTimeValue(row['Resolution Time'] || row['ResolutionTime'] || row['Resolution']),
      customerRating: parseRating(row['Customer Rating'] || row['CustomerRating'] || row['Rating'] || row['Score']),
      createdAt: row['Created Date'] || row['CreatedDate'] || row['Date'] || row['Timestamp'] || new Date().toISOString(),
      assignedTo: row['Assigned To'] || row['AssignedTo'] || row['Assignee'] || row['Agent'] || 'Unassigned',
      category: row['Category'] || row['Issue Type'] || 'General',
      tags: row['Tags'] ? row['Tags'].split(';').map(tag => tag.trim()) : []
    };

    return processed;
  });

  // Generate analytics
  const analytics = generateAnalytics(processedData);

  return {
    rawData: csvData,
    processedData,
    analytics,
    dataType: 'ticket',
    summary: {
      totalTickets: processedData.length,
      totalCustomers: new Set(processedData.map(d => d.customerName)).size,
      dateRange: getDateRange(processedData),
      columns: Object.keys(firstRow)
    }
  };
};

/**
 * Normalize priority values
 * @param {string} priority - Raw priority value
 * @returns {string} Normalized priority
 */
const normalizePriority = (priority) => {
  if (!priority) return 'medium';
  
  const normalized = priority.toLowerCase().trim();
  if (['high', 'critical', 'urgent'].includes(normalized)) return 'high';
  if (['medium', 'normal', 'moderate'].includes(normalized)) return 'medium';
  if (['low', 'minor'].includes(normalized)) return 'low';
  
  return 'medium';
};

/**
 * Normalize status values
 * @param {string} status - Raw status value
 * @returns {string} Normalized status
 */
const normalizeStatus = (status) => {
  if (!status) return 'pending';
  
  const normalized = status.toLowerCase().trim();
  if (['resolved', 'closed', 'completed', 'solved'].includes(normalized)) return 'resolved';
  if (['in progress', 'working', 'processing'].includes(normalized)) return 'in-progress';
  if (['pending', 'open', 'new', 'assigned'].includes(normalized)) return 'pending';
  
  return 'pending';
};

/**
 * Parse time values (e.g., "2.5 hours", "150 minutes")
 * @param {string} timeValue - Time string
 * @returns {number} Time in hours
 */
const parseTimeValue = (timeValue) => {
  if (!timeValue) return 0;
  
  // Handle time format like "0:01:20" (hours:minutes:seconds)
  if (timeValue.includes(':')) {
    const parts = timeValue.split(':').map(part => parseInt(part) || 0);
    if (parts.length === 3) {
      // Format: HH:MM:SS
      return parts[0] + (parts[1] / 60) + (parts[2] / 3600);
    } else if (parts.length === 2) {
      // Format: MM:SS
      return (parts[0] / 60) + (parts[1] / 3600);
    }
  }
  
  const value = parseFloat(timeValue);
  if (isNaN(value)) return 0;
  
  // If the value is already in hours, return as is
  if (timeValue.toLowerCase().includes('hour')) return value;
  if (timeValue.toLowerCase().includes('minute')) return value / 60;
  if (timeValue.toLowerCase().includes('day')) return value * 24;
  
  // Assume hours if no unit specified
  return value;
};

/**
 * Parse customer rating
 * @param {string} rating - Rating value
 * @returns {number} Rating as number (1-5)
 */
const parseRating = (rating) => {
  if (!rating) return 0;
  
  const value = parseFloat(rating);
  if (isNaN(value) || value < 1 || value > 5) return 0;
  
  return value;
};

/**
 * Generate analytics from processed data
 * @param {Array} data - Processed customer service data
 * @returns {Object} Analytics object
 */
const generateAnalytics = (data) => {
  const analytics = {
    // Status distribution
    statusDistribution: {},
    priorityDistribution: {},
    issueTypeDistribution: {},
    
    // Time metrics
    avgResponseTime: 0,
    avgResolutionTime: 0,
    responseTimeByPriority: {},
    resolutionTimeByPriority: {},
    
    // Customer metrics
    avgCustomerRating: 0,
    ratingDistribution: {},
    customerSatisfaction: 0,
    
    // Performance metrics
    resolutionRate: 0,
    firstResponseSLA: 0,
    resolutionSLA: 0,
    
    // Trends
    dailyVolume: {},
    weeklyVolume: {},
    monthlyVolume: {}
  };

  // Calculate distributions
  data.forEach(item => {
    // Status distribution
    analytics.statusDistribution[item.status] = (analytics.statusDistribution[item.status] || 0) + 1;
    
    // Priority distribution
    analytics.priorityDistribution[item.priority] = (analytics.priorityDistribution[item.priority] || 0) + 1;
    
    // Issue type distribution
    analytics.issueTypeDistribution[item.issueType] = (analytics.issueTypeDistribution[item.issueType] || 0) + 1;
    
    // Rating distribution
    if (item.customerRating > 0) {
      analytics.ratingDistribution[item.customerRating] = (analytics.ratingDistribution[item.customerRating] || 0) + 1;
    }
  });

  // Calculate averages
  const responseTimes = data.filter(item => item.responseTime > 0).map(item => item.responseTime);
  const resolutionTimes = data.filter(item => item.resolutionTime > 0).map(item => item.resolutionTime);
  const ratings = data.filter(item => item.customerRating > 0).map(item => item.customerRating);

  analytics.avgResponseTime = responseTimes.length > 0 ? 
    responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;
  
  analytics.avgResolutionTime = resolutionTimes.length > 0 ? 
    resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length : 0;
  
  analytics.avgCustomerRating = ratings.length > 0 ? 
    ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;

  // Calculate resolution rate
  const resolvedTickets = data.filter(item => item.status === 'resolved').length;
  analytics.resolutionRate = (resolvedTickets / data.length) * 100;

  // Calculate customer satisfaction (percentage of ratings 4+)
  const satisfiedCustomers = ratings.filter(rating => rating >= 4).length;
  analytics.customerSatisfaction = ratings.length > 0 ? (satisfiedCustomers / ratings.length) * 100 : 0;

  // Calculate SLA compliance (assuming 4-hour response SLA and 24-hour resolution SLA)
  const slaResponseCompliant = responseTimes.filter(time => time <= 4).length;
  const slaResolutionCompliant = resolutionTimes.filter(time => time <= 24).length;
  
  analytics.firstResponseSLA = responseTimes.length > 0 ? (slaResponseCompliant / responseTimes.length) * 100 : 0;
  analytics.resolutionSLA = resolutionTimes.length > 0 ? (slaResolutionCompliant / resolutionTimes.length) * 100 : 0;

  return analytics;
};

/**
 * Generate analytics from processed call center data
 * @param {Array} data - Processed call center data
 * @returns {Object} Call center analytics object
 */
const generateCallCenterAnalytics = (data) => {
  const analytics = {
    // Call distribution
    directionDistribution: {},
    callResultDistribution: {},
    agentDistribution: {},
    queueDistribution: {},
    
    // Time metrics
    avgTalkTime: 0,
    avgTimeInQueue: 0,
    avgOnHoldDuration: 0,
    
    // Performance metrics
    totalCalls: data.length,
    inboundCalls: 0,
    outboundCalls: 0,
    abandonedCalls: 0,
    lostInIVRCalls: 0,
    
    // Quality metrics
    avgSurveyRating: 0,
    repeatCallRate: 0,
    
    // Trends
    dailyVolume: {},
    weeklyVolume: {},
    monthlyVolume: {},
    
    // Agent performance
    agentPerformance: {}
  };

  // Calculate distributions and metrics
  data.forEach(item => {
    // Direction distribution
    analytics.directionDistribution[item.direction] = (analytics.directionDistribution[item.direction] || 0) + 1;
    
    // Call result distribution
    analytics.callResultDistribution[item.callResult] = (analytics.callResultDistribution[item.callResult] || 0) + 1;
    
    // Agent distribution
    analytics.agentDistribution[item.agent] = (analytics.agentDistribution[item.agent] || 0) + 1;
    
    // Queue distribution
    analytics.queueDistribution[item.queue] = (analytics.queueDistribution[item.queue] || 0) + 1;
    
    // Count call types
    if (item.direction.toLowerCase().includes('inbound') || item.direction.toLowerCase().includes('in')) {
      analytics.inboundCalls++;
    } else if (item.direction.toLowerCase().includes('outbound') || item.direction.toLowerCase().includes('out')) {
      analytics.outboundCalls++;
    }
    
    // Count abandoned and lost calls
    if (item.abandoned) analytics.abandonedCalls++;
    if (item.lostInIVR) analytics.lostInIVRCalls++;
    
    // Initialize agent performance tracking
    if (!analytics.agentPerformance[item.agent]) {
      analytics.agentPerformance[item.agent] = {
        totalCalls: 0,
        inboundCalls: 0,
        outboundCalls: 0,
        totalTalkTime: 0,
        avgTalkTime: 0,
        surveyRatings: []
      };
    }
    
    analytics.agentPerformance[item.agent].totalCalls++;
    if (item.direction.toLowerCase().includes('inbound') || item.direction.toLowerCase().includes('in')) {
      analytics.agentPerformance[item.agent].inboundCalls++;
    } else if (item.direction.toLowerCase().includes('outbound') || item.direction.toLowerCase().includes('out')) {
      analytics.agentPerformance[item.agent].outboundCalls++;
    }
    
    if (item.talkTime > 0) {
      analytics.agentPerformance[item.agent].totalTalkTime += item.talkTime;
    }
    
    if (item.surveyRating > 0) {
      analytics.agentPerformance[item.agent].surveyRatings.push(item.surveyRating);
    }
  });

  // Calculate averages
  const talkTimes = data.filter(item => item.talkTime > 0).map(item => item.talkTime);
  const timeInQueue = data.filter(item => item.timeInQueue > 0).map(item => item.timeInQueue);
  const onHoldDuration = data.filter(item => item.onHoldDuration > 0).map(item => item.onHoldDuration);
  const surveyRatings = data.filter(item => item.surveyRating > 0).map(item => item.surveyRating);
  const repeatCalls = data.filter(item => item.repeats > 0).length;

  analytics.avgTalkTime = talkTimes.length > 0 ? 
    talkTimes.reduce((sum, time) => sum + time, 0) / talkTimes.length : 0;
  
  analytics.avgTimeInQueue = timeInQueue.length > 0 ? 
    timeInQueue.reduce((sum, time) => sum + time, 0) / timeInQueue.length : 0;
  
  analytics.avgOnHoldDuration = onHoldDuration.length > 0 ? 
    onHoldDuration.reduce((sum, time) => sum + time, 0) / onHoldDuration.length : 0;
  
  analytics.avgSurveyRating = surveyRatings.length > 0 ? 
    surveyRatings.reduce((sum, rating) => sum + rating, 0) / surveyRatings.length : 0;
  
  analytics.repeatCallRate = (repeatCalls / data.length) * 100;

  // Calculate agent performance averages
  Object.keys(analytics.agentPerformance).forEach(agent => {
    const agentData = analytics.agentPerformance[agent];
    agentData.avgTalkTime = agentData.totalTalkTime / agentData.totalCalls;
    agentData.avgSurveyRating = agentData.surveyRatings.length > 0 ? 
      agentData.surveyRatings.reduce((sum, rating) => sum + rating, 0) / agentData.surveyRatings.length : 0;
  });

  return analytics;
};

/**
 * Get date range from data
 * @param {Array} data - Processed data
 * @returns {Object} Date range object
 */
const getDateRange = (data) => {
  const dates = data
    .map(item => new Date(item.createdAt))
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => a - b);

  if (dates.length === 0) {
    return { start: null, end: null };
  }

  return {
    start: dates[0],
    end: dates[dates.length - 1]
  };
};

/**
 * Export data to CSV format
 * @param {Array} data - Data to export
 * @param {Array} columns - Columns to include
 * @returns {string} CSV string
 */
export const exportToCSV = (data, columns = null) => {
  if (!data || data.length === 0) return '';

  const headers = columns || Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

/**
 * Filter data by various criteria
 * @param {Array} data - Data to filter
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered data
 */
export const filterData = (data, filters) => {
  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value || value === '') return true;
      
      if (key === 'dateRange') {
        const itemDate = new Date(item.createdAt);
        return itemDate >= value.start && itemDate <= value.end;
      }
      
      if (key === 'tags' && Array.isArray(value)) {
        return value.some(tag => item.tags.includes(tag));
      }
      
      return item[key] === value;
    });
  });
};

/**
 * Generate summary statistics for filtered data
 * @param {Array} data - Data to analyze
 * @returns {Object} Summary statistics
 */
/**
 * Get required column information for CSV import
 * @returns {Object} Column requirements and examples
 */
export const getCSVColumnRequirements = () => {
  return {
    callCenter: {
      title: 'Call Center Data Format',
      description: 'For call center performance analysis (e.g., Ziwo data)',
      required: [
        {
          name: 'Call ID',
          examples: ['Call ID', 'CallID', 'ID', 'Call Number', 'CallNumber'],
          description: 'Unique identifier for each call'
        },
        {
          name: 'Direction',
          examples: ['Direction', 'Call Direction', 'CallDirection', 'Type'],
          description: 'Call direction (Inbound/Outbound)'
        },
        {
          name: 'Agent',
          examples: ['Agent', 'Agent Name', 'AgentName', 'Representative', 'Rep'],
          description: 'Name of the agent handling the call'
        },
        {
          name: 'Call Result',
          examples: ['Call Result', 'CallResult', 'Result', 'Status', 'Outcome'],
          description: 'Result or outcome of the call'
        },
        {
          name: 'Talk Time',
          examples: ['Talk Time', 'TalkTime', 'Duration', 'Call Duration', 'CallDuration'],
          description: 'Duration of the call conversation'
        },
        {
          name: 'Queue',
          examples: ['Queue', 'Queue Name', 'QueueName', 'Department'],
          description: 'Queue or department the call was routed to'
        }
      ],
      optional: [
        {
          name: 'Start Date',
          examples: ['Start Date', 'StartDate', 'Date', 'Timestamp'],
          description: 'When the call started'
        },
        {
          name: 'Time spent in Queue',
          examples: ['Time spent in Queue', 'Queue Time', 'QueueTime'],
          description: 'Time call spent waiting in queue'
        },
        {
          name: 'Survey Rating',
          examples: ['Survey Rating', 'SurveyRating', 'Rating', 'Score'],
          description: 'Customer satisfaction rating from survey'
        }
      ]
    },
    ticket: {
      title: 'Customer Service Ticket Format',
      description: 'For customer service ticket analysis',
      required: [
        {
          name: 'Ticket ID',
          examples: ['Ticket ID', 'TicketID', 'Ticket', 'ID', 'Case ID', 'CaseID', 'Case'],
          description: 'Unique identifier for each ticket'
        },
        {
          name: 'Customer Name',
          examples: ['Customer Name', 'CustomerName', 'Customer', 'Name', 'Client Name', 'ClientName', 'Client'],
          description: 'Name of the customer or client'
        },
        {
          name: 'Issue Type',
          examples: ['Issue Type', 'IssueType', 'Issue', 'Type', 'Problem Type', 'ProblemType', 'Category', 'Subject'],
          description: 'Type or category of the issue'
        },
        {
          name: 'Priority',
          examples: ['Priority', 'Priority Level', 'PriorityLevel', 'Severity', 'Urgency', 'Level'],
          description: 'Priority level of the ticket'
        },
        {
          name: 'Status',
          examples: ['Status', 'State', 'Ticket Status', 'TicketState', 'Resolution Status', 'ResolutionState'],
          description: 'Current status of the ticket'
        }
      ],
      optional: [
        {
          name: 'Response Time',
          examples: ['Response Time', 'ResponseTime', 'Response'],
          description: 'Time to first response (e.g., "2.5 hours")'
        },
        {
          name: 'Resolution Time',
          examples: ['Resolution Time', 'ResolutionTime', 'Resolution'],
          description: 'Time to resolve the ticket (e.g., "4.2 hours")'
        },
        {
          name: 'Customer Rating',
          examples: ['Customer Rating', 'CustomerRating', 'Rating', 'Score'],
          description: 'Customer satisfaction rating (1-5 scale)'
        },
        {
          name: 'Created Date',
          examples: ['Created Date', 'CreatedDate', 'Date', 'Timestamp'],
          description: 'When the ticket was created'
        }
      ]
    }
  };
};

export const generateSummaryStats = (data) => {
  if (!data || data.length === 0) {
    return {
      totalTickets: 0,
      avgResponseTime: 0,
      avgResolutionTime: 0,
      resolutionRate: 0,
      avgRating: 0
    };
  }

  const responseTimes = data.filter(item => item.responseTime > 0).map(item => item.responseTime);
  const resolutionTimes = data.filter(item => item.resolutionTime > 0).map(item => item.resolutionTime);
  const ratings = data.filter(item => item.customerRating > 0).map(item => item.customerRating);
  const resolvedTickets = data.filter(item => item.status === 'resolved').length;

  return {
    totalTickets: data.length,
    avgResponseTime: responseTimes.length > 0 ? 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0,
    avgResolutionTime: resolutionTimes.length > 0 ? 
      resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length : 0,
    resolutionRate: (resolvedTickets / data.length) * 100,
    avgRating: ratings.length > 0 ? 
      ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0
  };
};
