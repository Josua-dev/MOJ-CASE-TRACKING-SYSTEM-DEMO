/**
 * InstallPrompt — PWA install button
 *
 * Listens for the beforeinstallprompt event and shows a small banner
 * allowing the user to install the app as a standalone PWA.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Don't show immediately — wait a bit so the page loads first
      setTimeout(() => {
        if (!dismissed) setShow(true);
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  // Also check if already installed (standalone mode)
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      setShow(false);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && deferredPrompt && (
        <motion.div
          className="install-prompt"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className="install-prompt-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div className="install-prompt-text">
            <strong>Install MOJ Cases</strong>
            <span>Open instantly from your home screen</span>
          </div>
          <div className="install-prompt-actions">
            <button className="btn btn-sm btn-primary" onClick={handleInstall}>
              Install
            </button>
            <button className="btn btn-sm btn-ghost" onClick={handleDismiss} aria-label="Dismiss">
              &times;
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
