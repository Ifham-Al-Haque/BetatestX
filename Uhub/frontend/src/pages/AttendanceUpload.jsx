import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';


const AttendanceUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.dat')) {
      setSelectedFile(file);
      setUploadStatus(null);
    } else {
      alert('Please select a valid .dat file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus('uploading');

    try {
      // TODO: Implement actual file upload logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload
      setUploadStatus('success');
    } catch (error) {
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Attendance Data</h1>
              <p className="text-gray-600">Upload biometric .dat files to process attendance records</p>
            </div>

            <div className="space-y-6">
              {/* File Selection */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".dat"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Click to upload
                    </span>
                    <span> or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Only .dat files are supported</p>
                </label>
              </div>

              {/* File Info */}
              {selectedFile && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-blue-600 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">{selectedFile.name}</p>
                      <p className="text-xs text-blue-700">
                        Size: {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="text-center">
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    !selectedFile || uploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>

              {/* Upload Status */}
              {uploadStatus && (
                <div className={`rounded-lg p-4 ${
                  uploadStatus === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : uploadStatus === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center">
                    {uploadStatus === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    ) : uploadStatus === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
                    )}
                    <div>
                      {uploadStatus === 'success' && (
                        <p className="text-sm font-medium text-green-900">
                          File uploaded successfully!
                        </p>
                      )}
                      {uploadStatus === 'error' && (
                        <p className="text-sm font-medium text-red-900">
                          Upload failed. Please try again.
                        </p>
                      )}
                      {uploadStatus === 'uploading' && (
                        <p className="text-sm font-medium text-blue-900">
                          Processing attendance data...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Upload Instructions</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Ensure the file is in .dat format from biometric devices</li>
                  <li>• File should contain attendance records for the current period</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• Processing time may vary based on file size</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceUpload;
