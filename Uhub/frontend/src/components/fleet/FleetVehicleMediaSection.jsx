import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, FileText, Upload, Trash2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import fleetVehicleMediaService, { FLEET_DOCUMENT_TYPES } from '../../services/fleetVehicleMediaService';
import { useToast } from '../../context/ToastContext';

const FleetVehicleMediaSection = ({ vehicleId, fleetImageUrl, onFleetImageUpdated }) => {
  const { success, error: showError } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docType, setDocType] = useState('registration_card');
  const [docName, setDocName] = useState('');
  const photoInputRef = useRef(null);
  const docInputRef = useRef(null);

  const loadDocuments = useCallback(async () => {
    if (!vehicleId) return;
    try {
      setLoadingDocs(true);
      const rows = await fleetVehicleMediaService.getDocuments(vehicleId);
      setDocuments(rows);
    } catch (e) {
      console.error(e);
      showError(e.message || 'Failed to load documents');
    } finally {
      setLoadingDocs(false);
    }
  }, [vehicleId, showError]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !vehicleId) return;
    try {
      setUploadingPhoto(true);
      const updated = await fleetVehicleMediaService.uploadFleetPhoto(vehicleId, file);
      onFleetImageUpdated?.(updated.fleet_image_url);
      success('Fleet photo updated');
    } catch (err) {
      showError(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleDocumentChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !vehicleId) return;
    if (file.size > 10 * 1024 * 1024) {
      showError('Document must be under 10 MB');
      return;
    }
    try {
      setUploadingDoc(true);
      await fleetVehicleMediaService.addDocument(vehicleId, {
        documentType: docType,
        documentName: docName.trim() || undefined,
        file,
      });
      success('Document uploaded');
      setDocName('');
      await loadDocuments();
    } catch (err) {
      showError(err.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Remove this document?')) return;
    try {
      await fleetVehicleMediaService.deleteDocument(docId);
      success('Document removed');
      await loadDocuments();
    } catch (err) {
      showError(err.message || 'Failed to delete document');
    }
  };

  return (
    <div className="space-y-8">
      <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          Fleet photo
        </h3>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-full sm:w-56 h-40 rounded-xl overflow-hidden bg-gray-200 border border-gray-300 flex items-center justify-center shrink-0">
            {fleetImageUrl ? (
              <img src={fleetImageUrl} alt="Fleet vehicle" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-gray-500 p-4">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No photo yet</p>
              </div>
            )}
          </div>
          <div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              disabled={uploadingPhoto}
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {uploadingPhoto ? 'Uploading…' : fleetImageUrl ? 'Change photo' : 'Upload fleet photo'}
            </button>
            <p className="text-xs text-gray-500 mt-2 max-w-sm">
              Shown on fleet cards and profile header. JPEG/PNG, max 5 MB.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Documents & attachments
        </h3>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[200px]"
          >
            {FLEET_DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Optional label"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 min-w-[160px]"
          />
          <input ref={docInputRef} type="file" className="hidden" onChange={handleDocumentChange} />
          <button
            type="button"
            disabled={uploadingDoc}
            onClick={() => docInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploadingDoc ? 'Uploading…' : 'Add document'}
          </button>
        </div>

        {loadingDocs ? (
          <p className="text-sm text-gray-500">Loading documents…</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-gray-500">
            No attachments yet. Upload registration card, insurance, or other fleet documents.
          </p>
        ) : (
          <ul className="space-y-3">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg border border-gray-200"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.document_name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {doc.document_type?.replace(/_/g, ' ')}
                    {doc.created_at && ` · ${new Date(doc.created_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Open"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default FleetVehicleMediaSection;
