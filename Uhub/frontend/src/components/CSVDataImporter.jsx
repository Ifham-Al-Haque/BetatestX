import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Eye,
  Trash2,
  BarChart3
} from 'lucide-react';
import { processCustomerServiceData, getCSVColumnRequirements } from '../utils/csvDataProcessor';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';

const CSVDataImporter = ({ onDataImported, onDataProcessed }) => {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file) => {
    setError(null);
    setSuccess(null);
    
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please select a valid CSV file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    parseCSVFile(file);
  };

  const parseCSVFile = (file) => {
    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const parsedData = parseCSV(csvText);
        
        if (parsedData && parsedData.length > 0) {
          // Process the data using our utility
          const processedData = processCustomerServiceData(parsedData);
          
          setPreviewData(parsedData.slice(0, 5)); // Show first 5 rows
          setProcessedData(processedData);
          setSuccess(`Successfully parsed ${parsedData.length} rows of data`);
          
          if (onDataProcessed) {
            onDataProcessed(processedData);
          }
        } else {
          setError('No valid data found in CSV file');
        }
      } catch (err) {
        // Enhanced error message with column information
        let errorMessage = 'Error parsing CSV file: ' + err.message;
        
        // If it's a column error, add helpful information
        if (err.message.includes('Missing required columns')) {
          if (err.message.includes('call center data')) {
            errorMessage += '\n\nYour CSV appears to be call center data. Please ensure it has columns for: Call ID, Direction, Agent, Call Result, and Talk Time.';
          } else {
            errorMessage += '\n\nPlease check that your CSV has the required columns.';
          }
        }
        
        setError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setIsProcessing(false);
    };
    
    reader.readAsText(file);
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    if (lines.length < 2) return null;
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length === headers.length) {
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });
          data.push(row);
        }
      }
    }
    
    return data;
  };

  const handleImportData = async () => {
    if (uploadedFile && processedData && user) {
      setIsProcessing(true);
      
      try {
        // Store data in Supabase
        const storedImport = await supabaseService.storeImportedData(
          processedData,
          uploadedFile.name,
          user.id
        );

        // If it's call center data, store analytics separately
        if (processedData.dataType === 'callCenter') {
          await supabaseService.storeCallAnalytics(storedImport.id, processedData.analytics);
        }

        // Notify parent component
        if (onDataImported) {
          onDataImported({
            id: storedImport.id,
            file: uploadedFile,
            data: previewData,
            totalRows: previewData.length,
            timestamp: new Date().toISOString(),
            processedData: processedData,
            storedInSupabase: true
          });
        }
        
        setSuccess('Data imported and stored successfully in Supabase!');
        
        // Reset form after successful import
        setTimeout(() => {
          resetForm();
        }, 2000);
      } catch (error) {
        console.error('Error storing data in Supabase:', error);
        setError('Error storing data in Supabase: ' + error.message);
      } finally {
        setIsProcessing(false);
      }
    } else if (!user) {
      setError('Please log in to import data');
    }
  };

  const resetForm = () => {
    setUploadedFile(null);
    setPreviewData(null);
    setProcessedData(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };



  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Customer Service Data</h3>
        
        {/* Column Requirements Info */}
        <div className="mb-4 space-y-4">
          {/* Call Center Data Format */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Call Center Data Format (Recommended for Ziwo):</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-800">
              <div>• Call ID (or ID, Call Number)</div>
              <div>• Direction (Inbound/Outbound)</div>
              <div>• Agent (or Agent Name)</div>
              <div>• Call Result (or Result, Status)</div>
              <div>• Talk Time (or Duration)</div>
              <div>• Queue (or Department)</div>
            </div>
          </div>
          
          {/* Ticket Data Format */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-900 mb-2">Customer Service Ticket Format:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-green-800">
              <div>• Ticket ID (or ID, Case ID)</div>
              <div>• Customer Name (or Customer, Client)</div>
              <div>• Issue Type (or Issue, Category)</div>
              <div>• Priority (or Severity, Urgency)</div>
              <div>• Status (or State)</div>
            </div>
          </div>
        </div>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop your CSV file here, or{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              browse files
            </button>
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports CSV files up to 10MB
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          
        </div>
      </motion.div>

      {/* File Info & Preview */}
      {uploadedFile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">File Information</h3>
            <button
              onClick={resetForm}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Remove</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {previewData ? previewData.length : 0} rows
                </p>
                <p className="text-xs text-blue-700">Data preview</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Ready</p>
                <p className="text-xs text-green-700">For import</p>
              </div>
            </div>
          </div>

          {/* Data Preview */}
          {previewData && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Data Preview (First 5 rows)</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(previewData[0] || {}).map((header) => (
                        <th
                          key={header}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, valueIndex) => (
                          <td
                            key={valueIndex}
                            className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate"
                            title={value}
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Status Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </motion.div>
      )}

      {/* Import Button */}
      {uploadedFile && previewData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <button
            onClick={handleImportData}
            disabled={isProcessing}
            className={`flex items-center space-x-3 px-6 py-3 rounded-lg font-medium text-white transition-colors ${
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Import Data</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default CSVDataImporter;
