import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CaseModal from './CaseModal';

export default function CaseDetailModal({ caseData, onClose, onUpdated }) {
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = () => axios.get(`/api/cases/${caseData.id}`).then(r => setDetail(r.data));

  useEffect(() => { load(); }, [caseData.id]);

  const submitNote = async () => {
    if (!note.trim()) return;
    setAddingNote(true);
    await axios.post(`/api/cases/${caseData.id}/logs`, { note });
    setNote('');
    setAddingNote(false);
    load();
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-NA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  if (!detail) return (
    <div className="modal-overlay">
      <div className="modal" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
    </div>
  );

  if (editing) return <CaseModal existing={detail} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); onUpdated(); }} />;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 760 }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 16 }}>{detail.title}</h2>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--blue-accent)', fontWeight: 700 }}>{detail.case_number}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left column */}
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <span className={`badge badge-${detail.status.toLowerCase()}`}>{detail.status}</span>
                <span className={`badge`} style={{ background: '#F0F0F0', color: '#555' }}>{detail.case_type}</span>
                <span className={`priority-${detail.priority.toLowerCase()}`} style={{ fontSize: 12, display: 'flex', alignItems: 'center' }}>● {detail.priority}</span>
              </div>
              {detail.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{detail.description}</p>}
            </div>

            {[
              { label: 'Plaintiff', value: detail.plaintiff },
              { label: 'Defendant', value: detail.defendant },
              { label: 'Presiding Officer', value: detail.presiding_officer || '—' },
              { label: 'Hearing Date', value: detail.hearing_date || '—' },
              { label: 'Next Action', value: detail.next_action || '—' },
              { label: 'Filed On', value: formatDate(detail.created_at) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Right column — audit log */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 12 }}>Audit Log</p>
            <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 16 }}>
              {detail.logs.length === 0 ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No activity yet.</p> : detail.logs.map(log => (
                <div className="log-item" key={log.id}>
                  <div className="log-dot" />
                  <div>
                    <div className="log-text"><strong>{log.action}</strong>{log.note ? ` — ${log.note}` : ''}</div>
                    <div className="log-time">{log.user_name} · {formatDate(log.performed_at)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="form-label">Add Note</label>
              <textarea className="form-control" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Enter a case note or update..." style={{ minHeight: 70 }} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={submitNote} disabled={addingNote || !note.trim()}>
              {addingNote ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
