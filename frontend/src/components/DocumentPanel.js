import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

export default function DocumentPanel({ caseId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    if (caseId) fetchDocuments();
  }, [caseId]);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/cases/${caseId}/documents`);
      setDocuments(data.data || []);
    } catch { setDocuments([]); }
    finally { setLoading(false); }
  }

  async function handleUpload(files) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      await axios.post(`/api/cases/${caseId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      success('Document uploaded.');
      fetchDocuments();
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      toastError(err.response?.data?.error || 'Upload failed.');
    } finally { setUploading(false); }
  }

  async function handleDownload(doc) {
    try {
      const { data } = await axios.get(`/api/documents/${doc.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url; a.download = doc.original_name;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { toastError('Download failed.'); }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Delete "${doc.original_name}"?`)) return;
    try {
      await axios.delete(`/api/documents/${doc.id}`);
      success('Document deleted.');
      fetchDocuments();
    } catch { toastError('Delete failed.'); }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  const getIcon = (mime) => {
    if (mime.includes('pdf')) return '📄';
    if (mime.includes('image')) return '🖼️';
    if (mime.includes('word') || mime.includes('document')) return '📝';
    if (mime.includes('sheet') || mime.includes('excel')) return '📊';
    return '📎';
  };

  return (
    <div className="document-panel">
      <div className="document-upload-area">
        <input
          ref={fileRef}
          type="file"
          onChange={e => { if (e.target.files?.length) handleUpload(e.target.files); }}
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
        />
        <motion.button
          className="btn btn-ghost upload-btn"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {uploading ? 'Uploading...' : 'Upload Document'}
        </motion.button>
        <span className="text-xs text-muted">PDF, DOC, XLS, JPG, PNG (max 50MB)</span>
      </div>

      {loading ? (
        <div style={{ padding: 16 }}>{[1,2].map(i => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8, borderRadius: 6 }} />)}</div>
      ) : documents.length === 0 ? (
        <div className="empty-state" style={{ padding: 24 }}><p>No documents attached.</p></div>
      ) : (
        <div className="document-list">
          <AnimatePresence>
            {documents.map((doc, i) => (
              <motion.div
                key={doc.id}
                className="document-item"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ delay: i * 0.03, duration: 0.15 }}
              >
                <span className="document-icon">{getIcon(doc.mime_type)}</span>
                <div className="document-info">
                  <span className="document-name">{doc.original_name}</span>
                  <span className="document-meta">
                    {formatSize(doc.size)} — {doc.uploaded_by_name || 'Unknown'}
                  </span>
                </div>
                <div className="document-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDownload(doc)} title="Download">⬇</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(doc)} title="Delete" style={{ color: 'var(--danger)' }}>✕</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
