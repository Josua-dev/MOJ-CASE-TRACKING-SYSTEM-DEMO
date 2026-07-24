import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import VisCard from '../components/VisCard';
import VisBuilder from '../components/VisBuilder';
import PlaylistPanel from '../components/PlaylistPanel';
import { useToast } from '../context/ToastContext';
import { CATEGORIES } from '../components/charts/ChartRegistry';

function SortableVisCard(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.vis.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <VisCard {...props} dragHandleProps={listeners} />
    </div>
  );
}

export default function Visualisations() {
  const [visualisations, setVisualisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingVis, setEditingVis] = useState(null);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const { success, error: toastError } = useToast();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const fetchVisualisations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      const { data } = await axios.get('/api/visualisations', { params });
      setVisualisations(data.data || []);
    } catch {
      setError('Failed to load visualisations.');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { fetchVisualisations(); }, [fetchVisualisations]);

  async function handleCreate(visData) {
    try {
      const { data } = await axios.post('/api/visualisations', visData);
      success('Visualisation created.');
      setShowBuilder(false);
      fetchVisualisations();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to create.');
    }
  }

  async function handleUpdate(id, visData) {
    try {
      await axios.put(`/api/visualisations/${id}`, visData);
      success('Visualisation updated.');
      setShowBuilder(false);
      setEditingVis(null);
      fetchVisualisations();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to update.');
    }
  }

  async function handleDelete(vis) {
    if (!window.confirm(`Delete "${vis.name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/visualisations/${vis.id}`);
      success('Visualisation deleted.');
      fetchVisualisations();
    } catch {
      toastError('Failed to delete.');
    }
  }

  async function handleDuplicate(id) {
    try {
      await axios.post(`/api/visualisations/${id}/duplicate`);
      success('Visualisation duplicated.');
      fetchVisualisations();
    } catch {
      toastError('Failed to duplicate.');
    }
  }

  async function handleToggle(id, enabled) {
    try {
      await axios.put(`/api/visualisations/${id}`, { enabled });
      setVisualisations(prev => prev.map(v => v.id === id ? { ...v, enabled } : v));
    } catch {
      toastError('Failed to update.');
    }
  }

  async function handleFavourite(id, is_favourite) {
    try {
      await axios.put(`/api/visualisations/${id}`, { is_favourite });
      setVisualisations(prev => prev.map(v => v.id === id ? { ...v, is_favourite } : v));
    } catch {
      toastError('Failed to update favourite.');
    }
  }

  function handleEdit(vis) {
    setEditingVis(vis);
    setShowBuilder(true);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visualisations.findIndex(v => v.id === active.id);
    const newIndex = visualisations.findIndex(v => v.id === over.id);
    const reordered = arrayMove(visualisations, oldIndex, newIndex);
    setVisualisations(reordered);

    // Persist new order
    const items = reordered.map((v, i) => ({ id: v.id, display_order: i }));
    axios.put('/api/visualisations/reorder', { items }).catch(() => {
      fetchVisualisations(); // revert on failure
    });
  }

  const favourites = visualisations.filter(v => v.is_favourite);
  const displayVis = category === '__favourites' ? favourites : visualisations;

  return (
    <div>
      {/* Page header */}
      <div className="dashboard-header">
        <div className="dashboard-header-row">
          <div>
            <h1>Visualisations</h1>
            <p>Create and manage data visualisations for display screens</p>
          </div>
          <div className="vis-header-actions">
            <button className="btn btn-ghost" onClick={() => setShowPlaylists(!showPlaylists)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              Playlists
            </button>
            <button className="btn btn-primary" onClick={() => { setEditingVis(null); setShowBuilder(true); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Visualisation
            </button>
          </div>
        </div>
      </div>

      <div className="vis-layout" style={{ display: 'flex', gap: 'var(--space-5)' }}>
        {/* Main content */}
        <div className="vis-main" style={{ flex: 1, minWidth: 0 }}>
          {/* Search & category filters */}
          <motion.div
            className="card"
            style={{ marginBottom: 'var(--space-5)' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="card-body" style={{ padding: 'var(--space-4) var(--space-5)' }}>
              <div className="filters-bar">
                <div className="search-field">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    placeholder="Search visualisations..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    aria-label="Search visualisations"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }} aria-label="Clear search">&times;</button>
                  )}
                </div>
              </div>
              <div className="vis-categories" style={{ display: 'flex', gap: 4, marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c.key}
                    className={`btn btn-sm ${category === c.key ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setCategory(c.key)}
                  >
                    {c.label}
                    {c.key === '__favourites' && favourites.length > 0 && (
                      <span className="nav-badge" style={{ marginLeft: 4 }}>{favourites.length}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Visualisations grid */}
          {loading ? (
            <div className="vis-grid">
              {Array.from({ length: 6 }, (_, i) => (
                <div className="vis-card" key={i}>
                  <div className="skeleton" style={{ width: '70%', height: 16, marginBottom: 12 }} />
                  <div className="skeleton" style={{ width: '100%', height: 140, borderRadius: 8 }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="error-state">
              <h3>Failed to load visualisations</h3>
              <p>{error}</p>
              <button className="btn btn-ghost" onClick={fetchVisualisations}>Retry</button>
            </div>
          ) : displayVis.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
                <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" />
              </svg>
              <h3>{search || category ? 'No matching visualisations' : 'No visualisations yet'}</h3>
              <p>{search || category ? 'Try adjusting your search or filters.' : 'Create your first visualisation to start building your display dashboard.'}</p>
              {!search && !category && (
                <button className="btn btn-primary" onClick={() => { setEditingVis(null); setShowBuilder(true); }}>
                  Create Visualisation
                </button>
              )}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={displayVis.map(v => v.id)} strategy={rectSortingStrategy}>
                <motion.div
                  className="vis-grid"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
                >
                  <AnimatePresence>
                    {displayVis.map(v => (
                      <SortableVisCard
                        key={v.id}
                        vis={v}
                        onEdit={handleEdit}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDelete}
                        onToggle={handleToggle}
                        onFavourite={handleFavourite}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Playlist sidebar */}
        <AnimatePresence>
          {showPlaylists && (
            <motion.div
              className="playlist-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <PlaylistPanel
                visualisations={visualisations}
                onClose={() => setShowPlaylists(false)}
                onRefresh={fetchVisualisations}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* VisBuilder modal */}
      {showBuilder && (
        <VisBuilder
          existing={editingVis}
          onClose={() => { setShowBuilder(false); setEditingVis(null); }}
          onSaved={(data) => editingVis ? handleUpdate(editingVis.id, data) : handleCreate(data)}
        />
      )}
    </div>
  );
}
