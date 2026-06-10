import React, { useState } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { Link } from 'react-router-dom';
import { getApiKey } from '../services/geminiApi';
import ApiKeyModal from './ApiKeyModal';

function Navbar() {
  const { state, dispatch } = useTimetable();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const hasKey = !!getApiKey();

  return (
    <>
      <header className="docked full-width top-0 sticky z-[100] bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-lg shadow-primary/5">
        <div className="flex justify-between items-center px-gutter w-full max-w-container-max mx-auto h-20">
          <Link to="/" className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[28px]">menu</span>
            <span className="font-display-lg text-headline-md tracking-tighter text-on-background">TIME-PILOT</span>
          </Link>
          <button
            onClick={() => setShowKeyModal(true)}
            title={hasKey ? 'API Key configured — click to change' : 'Set your Gemini API Key'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/20 hover:border-primary/40 hover:bg-white/5 transition-all text-sm"
          >
            <span className={`material-symbols-outlined text-lg ${hasKey ? 'text-primary' : 'text-error'}`}>
              {hasKey ? 'key' : 'key_off'}
            </span>
            <span className={`hidden sm:inline font-label-sm text-xs ${hasKey ? 'text-on-surface-variant' : 'text-error'}`}>
              {hasKey ? 'API Key Set' : 'Set API Key'}
            </span>
          </button>
        </div>
      </header>
      {showKeyModal && <ApiKeyModal onKeySet={() => setShowKeyModal(false)} />}
    </>
  );
}

export default Navbar;
