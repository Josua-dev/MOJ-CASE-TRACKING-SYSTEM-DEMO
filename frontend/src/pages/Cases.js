import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import CaseModal from '../components/CaseModal';
import CaseDetailModal from '../components/CaseDetailModal';
import { useToast } from '../context/ToastContext';
import FilterBar from '../components/cases/FilterBar';
import CasesTable from '../components/cases/CasesTable';
import Pagination from '../components/cases/Pagination';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const { success, error: toastError } = useToast();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (sortBy) {
        params.sort_by = sortBy;
        params.sort_order = sortOrder;
      }

      const { data } = await axios.get('/api/cases', { params });
      setCases(data.data || []);
      setTotal(data.meta?.total || 0);
      setTotalPages(data.meta?.totalPages || 0);
    } catch {
      setCases([]);
      setError('Failed to load cases.');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    debouncedSearch,
    statusFilter,
    typeFilter,
    priorityFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Listen for case:select event from global search
  useEffect(() => {
    const handler = (e) => {
      setSelectedCase({ id: e.detail.caseId });
    };
    window.addEventListener('case:select', handler);
    return () => window.removeEventListener('case:select', handler);
  }, []);

  function handleSort(column) {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  }

  function handleFilterChange(field, value) {
    switch (field) {
      case 'search':
        setSearch(value);
        break;
      case 'status':
        setStatusFilter(value);
        setPage(1);
        break;
      case 'type':
        setTypeFilter(value);
        setPage(1);
        break;
      case 'priority':
        setPriorityFilter(value);
        setPage(1);
        break;
    }
  }

  function handleCreated() {
    setShowCreate(false);
    success('Case created successfully.');
    fetchCases();
  }

  function handleUpdated() {
    setSelectedCase(null);
    success('Case updated successfully.');
    fetchCases();
  }

  async function handleExport() {
    try {
      const { data } = await axios.get('/api/cases/export/csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(
        new Blob([data], { type: 'text/csv;charset=utf-8' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `moj-cases-${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success('Cases exported successfully.');
    } catch (err) {
      toastError('Failed to export cases.');
    }
  }

  return (
    <div>
      {/* ── Page header ──────────────────────────────────── */}
      <div className="dashboard-header">
        <h1>Case Register</h1>
        <p>Manage and track magistrate court cases</p>
      </div>

      {/* ── Filters ──────────────────────────────────────── */}
      <FilterBar
        filters={{
          search,
          status: statusFilter,
          type: typeFilter,
          priority: priorityFilter,
        }}
        onFilterChange={handleFilterChange}
        onCreate={() => setShowCreate(true)}
        onExport={handleExport}
      />

      {/* ── Table and pagination ─────────────────────────── */}
      <motion.div
        className="card"
        style={{ padding: 0, overflow: 'hidden' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05, ease: 'easeOut' }}
      >
        <CasesTable
          cases={cases}
          onCaseClick={(c) => setSelectedCase(c)}
          isLoading={loading}
          error={error}
          sortField={sortBy}
          sortDir={sortOrder}
          onSort={handleSort}
          onRetry={fetchCases}
          totalItems={total}
          currentPage={page}
          pageSize={limit}
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={limit}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setLimit(size);
            setPage(1);
          }}
        />
      </motion.div>

      {/* ── Modals with exit animations ───────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <CaseModal
            onClose={() => setShowCreate(false)}
            onSaved={handleCreated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCase && (
          <CaseDetailModal
            caseData={selectedCase}
            onClose={() => setSelectedCase(null)}
            onUpdated={handleUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
