import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

export default function SearchBar({ navigateTo }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const listboxIdRef = useRef(`search-listbox-${Math.random().toString(36).substring(2, 9)}`);

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Search when debounced changes
  useEffect(() => {
    if (!debounced.trim()) { setResults(null); return; }
    let cancelled = false;
    setLoading(true);
    setError('');
    axios.get('/api/search', { params: { q: debounced.trim(), limit: 10 } })
      .then(({ data }) => {
        if (!cancelled) setResults(data.data);
      })
      .catch(() => {
        if (!cancelled) setError('Search failed.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debounced]);

  // Keyboard shortcuts: Ctrl+K or / to focus
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === 'Escape' && focused) {
        setFocused(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focused]);

  // Arrow key navigation + Enter
  const allResults = useCallback(() => {
    if (!results) return [];
    const items = [];
    if (results.cases?.length) items.push(...results.cases.map(r => ({ ...r, _type: 'case' })));
    if (results.documents?.length) items.push(...results.documents.map(r => ({ ...r, _type: 'document' })));
    if (results.logs?.length) items.push(...results.logs.map(r => ({ ...r, _type: 'log' })));
    return items;
  }, [results]);

  const handleKeyDown = (e) => {
    if (!results) return;
    const items = allResults();
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(items[selectedIndex]);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (item) => {
    setFocused(false);
    setQuery('');
    setSelectedIndex(-1);
    if (item._type === 'case') {
      navigateTo('cases');
      // Small delay to let Cases page mount before dispatching
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('case:select', { detail: { caseId: item.id } }));
      }, 100);
    } else if (item._type === 'document') {
      navigateTo('cases');
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('case:select', { detail: { caseId: item.case_id, tab: 'documents' } }));
      }, 100);
    } else if (item._type === 'log') {
      navigateTo('cases');
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('case:select', { detail: { caseId: item.case_id } }));
      }, 100);
    }
  };

  const showPanel = focused && query.trim().length >= 1;
  const listboxId = listboxIdRef.current;
  const items = allResults();
  const activeDescendant = selectedIndex >= 0 && selectedIndex < items.length ? `${listboxId}-option-${selectedIndex}` : undefined;
  const caseCount = results?.cases?.length ?? 0;
  const docCount = results?.documents?.length ?? 0;

  return (
    <div className="search-bar-container">
      <div className="search-bar-wrapper">
        <svg className="search-bar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="search-bar-input"
          placeholder="Search cases, documents...  "
          value={query}
          onChange={e => { setQuery(e.target.value); setSelectedIndex(-1); }}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={showPanel ? listboxId : undefined}
          aria-activedescendant={activeDescendant}
          aria-haspopup="listbox"
          aria-label="Global search"
          autoComplete="off"
        />
        {query && (
          <button className="search-bar-clear" onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }} aria-label="Clear search">
            &times;
          </button>
        )}
      </div>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            ref={panelRef}
            className="search-panel"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            {loading ? (
              <div className="search-panel-loading">
                <div className="spinner spinner-sm" />
                <span>Searching...</span>
              </div>
            ) : error ? (
              <div className="search-panel-error">{error}</div>
            ) : !results || (!results.cases?.length && !results.documents?.length && !results.logs?.length) ? (
              <div className="search-panel-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <p>No results for "{debounced}"</p>
                <span className="text-xs text-muted">Try different keywords or check spelling</span>
              </div>
            ) : (
              <div className="search-results" ref={listRef} role="listbox" id={listboxId}>
                {results.cases?.length > 0 && (
                  <div className="search-group" role="presentation">
                    <div className="search-group-label" role="presentation">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Cases
                    </div>
                    {results.cases.map((c, i) => {
                      const globalIdx = i;
                      const optionId = `${listboxId}-option-${globalIdx}`;
                      return (
                        <button
                          key={c.id}
                          id={optionId}
                          role="option"
                          aria-selected={globalIdx === selectedIndex}
                          className={`search-result-item ${globalIdx === selectedIndex ? 'selected' : ''}`}
                          onClick={() => handleSelect({ ...c, _type: 'case' })}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          dangerouslySetInnerHTML={{
                            __html: `<span class="search-result-primary">${c.title_hl || c.title}</span><span class="search-result-secondary">${c.case_number_hl || c.case_number} — ${c.case_type}</span>`
                          }}
                        />
                      );
                    })}
                  </div>
                )}
                {results.documents?.length > 0 && (
                  <div className="search-group" role="presentation">
                    <div className="search-group-label" role="presentation">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      Documents
                    </div>
                    {results.documents.map((d, i) => {
                      const globalIdx = caseCount + i;
                      const optionId = `${listboxId}-option-${globalIdx}`;
                      return (
                        <button
                          key={d.id}
                          id={optionId}
                          role="option"
                          aria-selected={globalIdx === selectedIndex}
                          className={`search-result-item ${globalIdx === selectedIndex ? 'selected' : ''}`}
                          onClick={() => handleSelect({ ...d, _type: 'document' })}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          dangerouslySetInnerHTML={{
                            __html: `<span class="search-result-primary">${d.name_hl || d.original_name}</span><span class="search-result-secondary">${d.case_number || ''} — ${(d.size / 1024).toFixed(1)} KB</span>`
                          }}
                        />
                      );
                    })}
                  </div>
                )}
                {results.logs?.length > 0 && (
                  <div className="search-group" role="presentation">
                    <div className="search-group-label" role="presentation">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Activity Logs
                    </div>
                    {results.logs.map((l, i) => {
                      const globalIdx = caseCount + docCount + i;
                      const optionId = `${listboxId}-option-${globalIdx}`;
                      return (
                        <button
                          key={l.id}
                          id={optionId}
                          role="option"
                          aria-selected={globalIdx === selectedIndex}
                          className={`search-result-item ${globalIdx === selectedIndex ? 'selected' : ''}`}
                          onClick={() => handleSelect({ ...l, _type: 'log' })}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          dangerouslySetInnerHTML={{
                            __html: `<span class="search-result-primary">${l.action_hl || l.action}</span><span class="search-result-secondary">${l.case_number || ''} — ${l.performed_at || ''}</span>`
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
