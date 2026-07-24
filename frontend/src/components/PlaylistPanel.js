import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

export default function PlaylistPanel({ visualisations = [], onClose, onRefresh }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const { success, error: toastError } = useToast();

  useEffect(() => { fetchPlaylists(); }, []);

  async function fetchPlaylists() {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/playlists', { params: { limit: 50 } });
      setPlaylists(data.data || []);
    } catch {
      toastError('Failed to load playlists.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      await axios.post('/api/playlists', { name: newName.trim(), description: newDesc.trim() });
      success('Playlist created.');
      setNewName('');
      setNewDesc('');
      fetchPlaylists();
    } catch {
      toastError('Failed to create playlist.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this playlist?')) return;
    try {
      await axios.delete(`/api/playlists/${id}`);
      success('Playlist deleted.');
      fetchPlaylists();
    } catch {
      toastError('Failed to delete.');
    }
  }

  async function handleAddItem(playlistId, visId) {
    try {
      const pl = playlists.find(p => p.id === playlistId);
      const items = [...(pl?.items || []), { visualisation_id: visId, duration_seconds: 30 }];
      await axios.put(`/api/playlists/${playlistId}`, { items });
      success('Item added.');
      fetchPlaylists();
    } catch {
      toastError('Failed to add item.');
    }
  }

  async function handleRemoveItem(playlistId, itemId) {
    try {
      const pl = playlists.find(p => p.id === playlistId);
      const items = (pl?.items || []).filter(it => it.id !== itemId).map(it => ({
        visualisation_id: it.visualisation_id,
        duration_seconds: it.duration_seconds,
      }));
      await axios.put(`/api/playlists/${playlistId}`, { items });
      fetchPlaylists();
    } catch {
      toastError('Failed to remove item.');
    }
  }

  async function handleUpdateDuration(playlistId, itemId, duration_seconds) {
    try {
      const pl = playlists.find(p => p.id === playlistId);
      const items = (pl?.items || []).map(it => ({
        visualisation_id: it.visualisation_id,
        duration_seconds: it.id === itemId ? duration_seconds : it.duration_seconds,
      }));
      await axios.put(`/api/playlists/${playlistId}`, { items });
    } catch {
      toastError('Failed to update duration.');
    }
  }

  function startDisplay(playlistId) {
    window.open(`/display?playlist=${playlistId}`, '_blank');
  }

  return (
    <motion.div
      className="playlist-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="playlist-panel-header">
        <h4>Playlists</h4>
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
      </div>

      {/* Create playlist form */}
      <div className="playlist-create" style={{ marginBottom: 'var(--space-4)' }}>
        <input
          className="form-input"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New playlist name..."
          style={{ marginBottom: 'var(--space-2)' }}
        />
        <input
          className="form-input"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          placeholder="Description (optional)"
          style={{ marginBottom: 'var(--space-2)', fontSize: '0.8rem' }}
        />
        <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={!newName.trim()}>Create Playlist</button>
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-4)' }}>
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 12, borderRadius: 8 }} />)}
        </div>
      ) : playlists.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>
          <p>No playlists yet.</p>
        </div>
      ) : (
        <div className="playlist-list" style={{ overflowY: 'auto', flex: 1 }}>
          {playlists.map(pl => (
            <motion.div
              key={pl.id}
              className="playlist-item-group"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="playlist-header">
                <div>
                  <strong>{pl.name}</strong>
                  {pl.description && <p className="text-xs text-muted">{pl.description}</p>}
                  <span className="text-xs text-muted">{pl.items?.length || 0} items</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => startDisplay(pl.id)} title="Start display">
                    ▶
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(pl.id)} title="Delete playlist">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>

              {/* Playlist items */}
              {pl.items && pl.items.length > 0 && (
                <div className="playlist-items">
                  {pl.items.map(item => (
                    <div key={item.id} className="playlist-item">
                      <span className="playlist-item-name">{item.visualisation_name || 'Unknown'}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number"
                          className="form-input"
                          value={item.duration_seconds}
                          onChange={e => handleUpdateDuration(pl.id, item.id, parseInt(e.target.value) || 30)}
                          min={5}
                          max={3600}
                          style={{ width: 48, padding: '2px 4px', fontSize: '0.75rem', height: 24 }}
                          title="Duration (seconds)"
                        />
                        <span className="text-xs text-muted">s</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveItem(pl.id, item.id)} style={{ padding: 2 }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add visualisation to playlist */}
              <div className="playlist-add-item" style={{ marginTop: 'var(--space-2)' }}>
                <select
                  className="form-input"
                  style={{ fontSize: '0.75rem', padding: '2px 4px', height: 28 }}
                  onChange={e => {
                    if (e.target.value) {
                      handleAddItem(pl.id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  value=""
                >
                  <option value="">+ Add visualisation</option>
                  {visualisations.filter(v => v.enabled).map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
