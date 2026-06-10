import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimetable } from '../context/TimetableContext';
import { generateTimeSlots, generateInitialSchedule } from '../utils/scheduler';

import { exportToPDF } from '../utils/pdfExport';
import TimetableGrid from '../components/TimetableGrid';
import { cn } from '../utils/cn';

function TimetableEditor() {
  const navigate = useNavigate();
  const { state, dispatch } = useTimetable();
  const [validationError, setValidationError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [title, setTitle] = useState(state.schoolName || '');

  if (!state.schedule || state.schedule.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <span className="material-symbols-outlined text-[64px] text-primary/30 mb-4 animate-float">calendar_month</span>
        <p className="text-xl text-on-surface-variant mb-6 font-title-md">No timetable generated yet.</p>
        <button onClick={() => navigate('/chat')} className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl btn-3d">
          Go to AI Generator
        </button>
      </div>
    );
  }

  const handleTimeChange = (field, value, breakIndex = null) => {
    const newTiming = { ...state.schoolTiming };
    const newBreaks = [...(state.breaks || [])];
    let duration = state.classDuration;

    if (field === 'schoolStart') newTiming.start = value;
    if (field === 'schoolEnd') newTiming.end = value;
    if (field === 'breakStart' && breakIndex !== null) newBreaks[breakIndex].start = value;
    if (field === 'breakEnd' && breakIndex !== null) newBreaks[breakIndex].end = value;
    if (field === 'duration') duration = parseInt(value, 10);

    const newSlots = generateTimeSlots(newTiming, duration, newBreaks);
    const newSchedule = generateInitialSchedule(newSlots, state.workingDays, state.subjects);

    dispatch({
      type: 'SET_TIMETABLE_STATE',
      payload: {
        schoolTiming: newTiming,
        breaks: newBreaks,
        classDuration: duration,
        schedule: newSchedule
      }
    });
  };



  // Find next class for the "Up Next" card
  const getNextClass = () => {
    // simplified mock logic since we don't track live time
    for (let day of state.schedule) {
      for (let slot of day.slots) {
        if (slot.subject) return { name: slot.subject.name, time: slot.start };
      }
    }
    return { name: "No upcoming classes", time: "" };
  };
  const nextClass = getNextClass();

  return (
    <div className="max-w-7xl mx-auto px-gutter py-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-4 bg-primary text-on-primary font-bold px-6 py-4 rounded-xl shadow-2xl z-[200] animate-in slide-in-from-right-8">
          {toastMessage}
        </div>
      )}

      {/* Floating Adjust Button */}
      <div className="flex justify-between items-end mb-8">
        <div className="space-y-1">
          <p className="font-label-sm text-primary uppercase tracking-widest">Live Schedule</p>
          <div className="flex items-center gap-4 w-full">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                dispatch({ type: 'SET_SCHOOL_NAME', payload: e.target.value });
              }}
              className="font-headline-lg text-headline-lg-mobile md:text-headline-lg bg-transparent border-none text-on-background focus:outline-none focus:ring-0 focus:border-b-2 focus:border-primary/40 hover:bg-white/5 transition-all px-2 py-0.5 rounded-lg w-full max-w-md md:max-w-xl"
              placeholder="Enter timetable title..."
            />
            {/* Undo/Redo */}
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => dispatch({ type: 'UNDO' })} disabled={state.history.length === 0} className="p-2 rounded-full bg-surface-container-high hover:bg-surface-variant disabled:opacity-30 transition-colors">
                <span className="material-symbols-outlined text-[20px]">undo</span>
              </button>
              <button onClick={() => dispatch({ type: 'REDO' })} disabled={state.redoStack.length === 0} className="p-2 rounded-full bg-surface-container-high hover:bg-surface-variant disabled:opacity-30 transition-colors">
                <span className="material-symbols-outlined text-[20px]">redo</span>
              </button>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 bg-surface-container-high border border-outline-variant/30 text-primary-fixed px-5 py-3 rounded-xl shadow-xl hover:bg-surface-variant transition-all"
        >
          <span className="material-symbols-outlined">tune</span>
          <span className="font-label-sm hidden sm:inline">Adjust Timing</span>
        </button>
      </div>

      {/* Dynamic Time Controls */}
      {showSettings && (
        <div className="bg-surface-container-low p-6 rounded-2xl shadow-xl border border-white/5 mb-8 flex flex-wrap gap-6 animate-fade-up">
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">School Start</label>
            <input type="time" value={state.schoolTiming.start} onChange={(e) => handleTimeChange('schoolStart', e.target.value)} className="w-full bg-surface-dim border border-white/10 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary" />
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">School End</label>
            <input type="time" value={state.schoolTiming.end} onChange={(e) => handleTimeChange('schoolEnd', e.target.value)} className="w-full bg-surface-dim border border-white/10 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary" />
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">Duration (min)</label>
            <input type="number" min="10" max="180" value={state.classDuration} onChange={(e) => handleTimeChange('duration', e.target.value)} className="w-full bg-surface-dim border border-white/10 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary" />
          </div>
          {state.breaks?.map((b, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">{b.name} Start</label>
                <input type="time" value={b.start} onChange={(e) => handleTimeChange('breakStart', e.target.value, idx)} className="w-full bg-surface-dim border border-white/10 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">{b.name} End</label>
                <input type="time" value={b.end} onChange={(e) => handleTimeChange('breakEnd', e.target.value, idx)} className="w-full bg-surface-dim border border-white/10 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary" />
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Timetable Grid */}
      <TimetableGrid setValidationError={setValidationError} />

      {/* Validation Feedback */}
      {validationError && (
        <div className="mt-6 p-4 bg-error-container/20 border border-error/50 text-error rounded-xl font-medium flex items-center gap-3">
          <span className="material-symbols-outlined">error</span> {validationError}
        </div>
      )}

      {/* 3D Action Buttons */}
      <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6">
        <button 
          onClick={() => exportToPDF(state)} 
          disabled={!title.trim()}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-primary text-on-primary px-8 py-4 rounded-xl font-label-sm uppercase btn-3d disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
          title={!title.trim() ? "Please enter a timetable title to enable download" : ""}
        >
          <span className="material-symbols-outlined">picture_as_pdf</span>
          DOWNLOAD PDF
        </button>

        <button onClick={() => {
          const newSlots = generateTimeSlots(state.schoolTiming, state.classDuration, state.breaks);
          const newSchedule = generateInitialSchedule(newSlots, state.workingDays, state.subjects);
          dispatch({ type: 'SET_TIMETABLE_STATE', payload: { schedule: newSchedule } });
        }} className="w-full md:w-auto flex items-center justify-center gap-3 bg-surface-container-highest text-on-surface px-8 py-4 rounded-xl font-label-sm uppercase btn-3d">
          <span className="material-symbols-outlined">refresh</span>
          REGENERATE
        </button>
      </div>

      {/* Mobile Undo/Redo */}
      <div className="flex md:hidden justify-center gap-6 mt-8">
        <button onClick={() => dispatch({ type: 'UNDO' })} disabled={state.history.length === 0} className="flex items-center gap-2 px-4 py-2 bg-surface-container-high border border-outline-variant/30 text-on-surface rounded-lg disabled:opacity-30">
          <span className="material-symbols-outlined">undo</span> Undo
        </button>
        <button onClick={() => dispatch({ type: 'REDO' })} disabled={state.redoStack.length === 0} className="flex items-center gap-2 px-4 py-2 bg-surface-container-high border border-outline-variant/30 text-on-surface rounded-lg disabled:opacity-30">
          <span className="material-symbols-outlined">redo</span> Redo
        </button>
      </div>
    </div>
  );
}

export default TimetableEditor;
