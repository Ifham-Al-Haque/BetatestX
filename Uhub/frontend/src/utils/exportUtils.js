import { getDepartmentLabel } from '../config/departments';
import { escapeHtml } from './security';

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// Format currency for display
const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return 'AED 0.00';
  return `AED ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Prepare data for export
export const prepareSimCardDataForExport = (simCards) => {
  return simCards.map(simCard => ({
    'SIM Number': simCard.sim_number || 'N/A',
    'Package Name': simCard.package_name || 'N/A',
    'Package Type': simCard.package_type || 'N/A',
    'Monthly Cost': formatCurrency(simCard.monthly_cost),
    'Data Limit': simCard.data_limit || 'N/A',
    'Voice Minutes': simCard.voice_minutes || 'N/A',
    'SMS Limit': simCard.sms_limit || 'N/A',
    'Current User': simCard.current_user || 'Unassigned',
    'Previous User': simCard.previous_user || 'N/A',
    'Department': simCard.department ? getDepartmentLabel(simCard.department) : 'Not specified',
    'Designation': simCard.designation || 'N/A',
    'Status': simCard.status || 'N/A',
    'Activation Date': formatDate(simCard.activation_date),
    'Expiry Date': formatDate(simCard.expiry_date),
    'Package Benefits': simCard.package_benefits || 'N/A',
    'Notes': simCard.notes || 'N/A',
    'Created At': formatDate(simCard.created_at),
    'Updated At': formatDate(simCard.updated_at)
  }));
};

// Export to Excel/CSV
export const exportToExcel = (simCards, filename = 'sim_cards_export') => {
  const exportData = prepareSimCardDataForExport(simCards);
  
  // Create CSV content
  const headers = Object.keys(exportData[0] || {});
  const csvContent = [
    headers.join(','),
    ...exportData.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to PDF using HTML to PDF conversion
export const exportToPDF = (simCards, filename = 'sim_cards_export') => {
  const exportData = prepareSimCardDataForExport(simCards);
  
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>SIM Cards Export Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #3b82f6;
          margin: 0;
          font-size: 24px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .summary {
          background-color: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #3b82f6;
        }
        .summary h3 {
          margin: 0 0 10px 0;
          color: #3b82f6;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }
        .summary-label {
          font-weight: 500;
          color: #666;
        }
        .summary-value {
          font-weight: bold;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #3b82f6;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        tr:hover {
          background-color: #f3f4f6;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #666;
          font-size: 10px;
          border-top: 1px solid #e5e7eb;
          padding-top: 10px;
        }
        @media print {
          body { margin: 0; }
          .header { page-break-after: avoid; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SIM Cards Export Report</h1>
        <p>Generated on: ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
      
      <div class="summary">
        <h3>Export Summary</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Total SIM Cards:</span>
            <span class="summary-value">${simCards.length}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Active SIM Cards:</span>
            <span class="summary-value">${simCards.filter(s => s.status === 'Active').length}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Assigned SIM Cards:</span>
            <span class="summary-value">${simCards.filter(s => s.current_user).length}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Monthly Cost:</span>
            <span class="summary-value">${formatCurrency(simCards.reduce((total, sim) => total + (parseFloat(sim.monthly_cost) || 0), 0))}</span>
          </div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>SIM Number</th>
            <th>Package Name</th>
            <th>Package Type</th>
            <th>Monthly Cost</th>
            <th>Current User</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Status</th>
            <th>Activation Date</th>
            <th>Expiry Date</th>
          </tr>
        </thead>
        <tbody>
          ${exportData.map(row => `
            <tr>
              <td>${escapeHtml(row['SIM Number'])}</td>
              <td>${escapeHtml(row['Package Name'])}</td>
              <td>${escapeHtml(row['Package Type'])}</td>
              <td>${escapeHtml(row['Monthly Cost'])}</td>
              <td>${escapeHtml(row['Current User'])}</td>
              <td>${escapeHtml(row['Department'])}</td>
              <td>${escapeHtml(row['Designation'])}</td>
              <td>${escapeHtml(row['Status'])}</td>
              <td>${escapeHtml(row['Activation Date'])}</td>
              <td>${escapeHtml(row['Expiry Date'])}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Report generated by UHub SIM Card Management System</p>
        <p>Total records: ${exportData.length}</p>
      </div>
    </body>
    </html>
  `;
  
  // Create a new window and print the HTML content
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load, then trigger print dialog
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Close the window after printing (optional)
      // printWindow.close();
    }, 250);
  };
};

// Export filtered data
export const exportFilteredData = (simCards, filters, format) => {
  const { searchTerm, statusFilter, departmentFilter, packageTypeFilter } = filters;
  
  // Apply the same filtering logic as in the component
  const filteredData = simCards.filter(simCard => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      simCard.sim_number.toLowerCase().includes(searchLower) ||
      simCard.package_name.toLowerCase().includes(searchLower) ||
      (simCard.current_user && simCard.current_user.toLowerCase().includes(searchLower)) ||
      (simCard.previous_user && simCard.previous_user.toLowerCase().includes(searchLower)) ||
      (simCard.department && simCard.department.toLowerCase().includes(searchLower)) ||
      (simCard.designation && simCard.designation.toLowerCase().includes(searchLower)) ||
      (simCard.package_type && simCard.package_type.toLowerCase().includes(searchLower)) ||
      (simCard.status && simCard.status.toLowerCase().includes(searchLower));
    const matchesStatus = !statusFilter || simCard.status === statusFilter;
    const matchesDepartment = !departmentFilter || simCard.department === departmentFilter;
    const matchesPackageType = !packageTypeFilter || simCard.package_type === packageTypeFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesPackageType;
  });
  
  // Generate filename with filter info
  let filename = 'sim_cards_export';
  if (searchTerm) filename += `_search_${searchTerm}`;
  if (statusFilter) filename += `_status_${statusFilter}`;
  if (departmentFilter) filename += `_dept_${departmentFilter}`;
  if (packageTypeFilter) filename += `_type_${packageTypeFilter}`;
  
  // Export based on format
  if (format === 'excel') {
    exportToExcel(filteredData, filename);
  } else if (format === 'pdf') {
    exportToPDF(filteredData, filename);
  }
};

// Get export statistics
export const getExportStats = (simCards) => {
  const total = simCards.length;
  const active = simCards.filter(s => s.status === 'Active').length;
  const inactive = simCards.filter(s => s.status === 'Inactive').length;
  const suspended = simCards.filter(s => s.status === 'Suspended').length;
  const pending = simCards.filter(s => s.status === 'Pending').length;
  const expired = simCards.filter(s => s.status === 'Expired').length;
  const assigned = simCards.filter(s => s.current_user).length;
  const unassigned = simCards.filter(s => !s.current_user).length;
  const totalCost = simCards.reduce((total, sim) => total + (parseFloat(sim.monthly_cost) || 0), 0);
  
  return {
    total,
    active,
    inactive,
    suspended,
    pending,
    expired,
    assigned,
    unassigned,
    totalCost: formatCurrency(totalCost)
  };
};
