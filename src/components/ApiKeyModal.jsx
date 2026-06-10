import React, { useState } from 'react';
import { saveApiKey, getApiKey } from '../services/geminiApi';

function ApiKeyModal({ onKeySet }) {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setError('Please enter your API key.');
      return;
    }
    if (!trimmed.startsWith('AIza')) {
      setError('This does not look like a valid Gemini API key. Keys start with "AIza...".');
      return;
    }
    setLoading(true);
    setError('');
    saveApiKey(trimmed);
    setTimeout(() => {
      setLoading(false);
      onKeySet();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-surface-container-high rounded-3xl border border-white/10 p-6 shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <span className="material-symbols-outlined text-primary text-3xl">key</span>
          <div>
            <h2 className="font-headline-md text-xl font-bold text-on-background">Gemini API Key Required</h2>
            <p className="text-on-surface-variant text-xs mt-0.5">Your key is saved locally and never sent to our servers.</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-surface-container rounded-2xl p-4 mb-5 border border-white/5 text-sm text-on-surface-variant leading-relaxed space-y-2">
          <p>To use TIME-PILOT AI, you need a free <strong className="text-primary">Google Gemini API key</strong>:</p>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Visit <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-primary underline hover:brightness-125 transition">aistudio.google.com/apikey</a></li>
            <li>Sign in with your Google account</li>
            <li>Click <strong>"Create API Key"</strong></li>
            <li>Copy and paste the key below</li>
          </ol>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => { setInputKey(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="AIza..."
              className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary/60 focus:ring-0 rounded-xl px-4 py-3 text-on-background font-mono text-sm outline-none transition-all placeholder:text-on-surface-variant/40"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-error text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={loading || !inputKey.trim()}
            className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Save & Continue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApiKeyModal;
