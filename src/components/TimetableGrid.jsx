import React, { useState, useEffect } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { cn } from '../utils/cn';

function TimetableGrid({ setValidationError }) {
  const { state, dispatch } = useTimetable();
  const [draggedItem, setDraggedItem] = useState(null);

  const [contextMenu, setContextMenu] = useState(null);
  const [moveMode, setMoveMode] = useState(null);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectForm, setNewSubjectForm] = useState({ name: '', teacher: '', requiredPeriods: 1 });
  const [modalTarget, setModalTarget] = useState(null);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    if (contextMenu) {
      setTimeout(() => {
        document.addEventListener('click', handleGlobalClick);
      }, 0);
    }
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [contextMenu]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMoveMode(null);
        setContextMenu(null);
        setShowAddSubjectModal(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!state.schedule || state.schedule.length === 0) return null;

  const firstDaySlots = state.schedule[0].slots;
  const dayCount = state.schedule.length;

  const handleDragStart = (e, dayIndex, slotIndex, subject) => {
    if (!subject) { e.preventDefault(); return; }
    setDraggedItem({ dayIndex, slotIndex, subject });
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
  };

  const handleDragOver = (e, slotType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = slotType === 'period' ? 'move' : 'none';
  };

  const handleDrop = (e, targetDayIndex, targetSlotIndex) => {
    e.preventDefault();
    if (!draggedItem) return;

    const sourceSubject = draggedItem.subject;
    const targetSlot    = state.schedule[targetDayIndex].slots[targetSlotIndex];
    const targetSubject = targetSlot.subject;

    const newSchedule = JSON.parse(JSON.stringify(state.schedule));
    newSchedule[draggedItem.dayIndex].slots[draggedItem.slotIndex].subject = targetSubject;
    newSchedule[targetDayIndex].slots[targetSlotIndex].subject = sourceSubject;

    dispatch({ type: 'SET_TIMETABLE_STATE', payload: { schedule: newSchedule } });
    setValidationError('');
  };

  const handleCellClick = (e, dayIndex, slotIndex, subject) => {
    e.stopPropagation();

    if (moveMode) {
      if (!subject) {
        const newSchedule = JSON.parse(JSON.stringify(state.schedule));
        newSchedule[moveMode.dayIndex].slots[moveMode.slotIndex].subject = null;
        newSchedule[dayIndex].slots[slotIndex].subject = moveMode.subject;
        dispatch({ type: 'SET_TIMETABLE_STATE', payload: { schedule: newSchedule } });
        setValidationError('');
      } else {
        setValidationError('Please select an empty cell to move the class to, or press Esc to cancel.');
      }
      setMoveMode(null);
      setContextMenu(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + (rect.width / 2);
    const y = rect.bottom + 5;
    
    setContextMenu({ x, y, dayIndex, slotIndex, subject, isEmpty: !subject });
  };

  const handleChangeSubject = (e, newSubjectId) => {
    e.stopPropagation();
    if (!newSubjectId) return;
    const selectedSubject = state.subjects.find(s => s.id === newSubjectId || s.name === newSubjectId);
    if (!selectedSubject) return;
    const newSchedule = JSON.parse(JSON.stringify(state.schedule));
    newSchedule[contextMenu.dayIndex].slots[contextMenu.slotIndex].subject = selectedSubject;
    dispatch({ type: 'SET_TIMETABLE_STATE', payload: { schedule: newSchedule } });
    setContextMenu(null);
  };

  const handleDeleteClass = (e) => {
    e.stopPropagation();
    const newSchedule = JSON.parse(JSON.stringify(state.schedule));
    newSchedule[contextMenu.dayIndex].slots[contextMenu.slotIndex].subject = null;
    dispatch({ type: 'SET_TIMETABLE_STATE', payload: { schedule: newSchedule } });
    setContextMenu(null);
  };

  const handleDeleteSubject = (e) => {
    e.stopPropagation();
    const subjectToDelete = contextMenu.subject;
    const newSchedule = JSON.parse(JSON.stringify(state.schedule));
    newSchedule.forEach(day => {
      day.slots.forEach(slot => {
        if (slot.subject) {
          const matchId = slot.subject.id && subjectToDelete.id && slot.subject.id === subjectToDelete.id;
          const matchName = slot.subject.name === subjectToDelete.name;
          if (matchId || matchName) {
            slot.subject = null;
          }
        }
      });
    });
    const newSubjects = state.subjects.filter(s => {
      const matchId = s.id && subjectToDelete.id && s.id === subjectToDelete.id;
      const matchName = s.name === subjectToDelete.name;
      return !(matchId || matchName);
    });
    dispatch({ type: 'SET_TIMETABLE_STATE', payload: { schedule: newSchedule, subjects: newSubjects } });
    setContextMenu(null);
  };

  const handleMoveClass = (e) => {
    e.stopPropagation();
    setMoveMode({ dayIndex: contextMenu.dayIndex, slotIndex: contextMenu.slotIndex, subject: contextMenu.subject });
    setContextMenu(null);
    setValidationError('');
  };

  const handleAddClass = (e, subjectId) => {
    e.stopPropagation();
    if (!subjectId) return;
    const selectedSubject = state.subjects.find(s => s.id === subjectId || s.name === subjectId);
    if (!selectedSubject) return;
    const newSchedule = JSON.parse(JSON.stringify(state.schedule));
    newSchedule[contextMenu.dayIndex].slots[contextMenu.slotIndex].subject = selectedSubject;
    dispatch({ type: 'SET_TIMETABLE_STATE', payload: { schedule: newSchedule } });
    setContextMenu(null);
  };

  const handleOpenAddSubjectModal = (e) => {
    e.stopPropagation();
    setModalTarget({ dayIndex: contextMenu.dayIndex, slotIndex: contextMenu.slotIndex });
    setNewSubjectForm({ name: '', teacher: '', requiredPeriods: 1 });
    setShowAddSubjectModal(true);
    setContextMenu(null);
  };

  const handleSubmitNewSubject = (e) => {
    e.preventDefault();
    if (!newSubjectForm.name.trim()) return;
    const newSubject = {
      id: `subj_${Date.now()}`,
      name: newSubjectForm.name.trim(),
      teacher: newSubjectForm.teacher.trim() || undefined,
      requiredPeriods: parseInt(newSubjectForm.requiredPeriods, 10) || 1,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`
    };
    const newSubjects = [...state.subjects, newSubject];
    const newSchedule = JSON.parse(JSON.stringify(state.schedule));
    newSchedule[modalTarget.dayIndex].slots[modalTarget.slotIndex].subject = newSubject;
    dispatch({ type: 'SET_TIMETABLE_STATE', payload: { schedule: newSchedule, subjects: newSubjects } });
    setShowAddSubjectModal(false);
  };

  return (
    <div className="relative">
      {/* Context Menu Overlay */}
      {contextMenu && (
        <div 
          className="fixed z-[100] bg-surface-container-high border border-white/10 shadow-2xl rounded-xl w-64 p-2 text-sm text-on-surface animate-in fade-in zoom-in-95 duration-100"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 260), top: Math.min(contextMenu.y, window.innerHeight - 300) }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-white/5 mb-2 bg-surface-container-lowest rounded-t-lg">
            <span className="font-semibold">{contextMenu.isEmpty ? 'Empty Cell' : contextMenu.subject.name}</span>
          </div>

          {!contextMenu.isEmpty ? (
            <div className="flex flex-col gap-1">
              <div className="px-2 py-1">
                <label className="text-xs text-on-surface-variant font-semibold mb-1 block">Change Subject</label>
                <select 
                  className="w-full bg-surface-dim border border-white/10 rounded px-2 py-1.5 focus:outline-none focus:border-primary cursor-pointer text-on-surface"
                  onChange={(e) => handleChangeSubject(e, e.target.value)}
                  value=""
                >
                  <option value="" disabled>Select new subject...</option>
                  {state.subjects.map(s => (
                    <option key={s.id || s.name} value={s.id || s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              
              <button onClick={handleMoveClass} className="text-left px-3 py-2 rounded-md hover:bg-primary/10 text-primary-fixed font-medium transition-colors">
                Move Class
              </button>
              <button onClick={handleDeleteClass} className="text-left px-3 py-2 rounded-md hover:bg-tertiary/10 text-tertiary-fixed font-medium transition-colors">
                Delete Class
              </button>
              <div className="h-px bg-white/5 my-1"></div>
              <button onClick={handleDeleteSubject} className="text-left px-3 py-2 rounded-md hover:bg-error/10 text-error font-medium transition-colors">
                Delete Entire Subject
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="px-2 py-1">
                <label className="text-xs text-on-surface-variant font-semibold mb-1 block">Add Existing Subject</label>
                <select 
                  className="w-full bg-surface-dim border border-white/10 rounded px-2 py-1.5 focus:outline-none focus:border-primary cursor-pointer text-on-surface"
                  onChange={(e) => handleAddClass(e, e.target.value)}
                  value=""
                >
                  <option value="" disabled>Select subject...</option>
                  {state.subjects.map(s => (
                    <option key={s.id || s.name} value={s.id || s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="h-px bg-white/5 my-1"></div>
              <button onClick={handleOpenAddSubjectModal} className="text-left px-3 py-2 rounded-md hover:bg-primary/10 text-primary-fixed font-medium transition-colors">
                + Add New Subject
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add New Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-high rounded-xl shadow-2xl max-w-sm w-full p-6 border border-white/10 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-on-surface mb-4">Create New Subject</h3>
            <form onSubmit={handleSubmitNewSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">Subject Name *</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  className="w-full bg-surface-dim border border-white/10 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                  value={newSubjectForm.name}
                  onChange={e => setNewSubjectForm({...newSubjectForm, name: e.target.value})}
                  placeholder="e.g. History"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">Teacher (Optional)</label>
                <input 
                  type="text" 
                  className="w-full bg-surface-dim border border-white/10 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                  value={newSubjectForm.teacher}
                  onChange={e => setNewSubjectForm({...newSubjectForm, teacher: e.target.value})}
                  placeholder="e.g. Mr. Smith"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddSubjectModal(false)}
                  className="flex-1 py-2 bg-surface border border-white/10 text-on-surface rounded-lg font-medium hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!newSubjectForm.name.trim()}
                  className="flex-1 py-2 bg-primary text-on-primary rounded-lg font-medium hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  Create & Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {moveMode && (
        <div className="mb-4 bg-primary/10 p-3 rounded-xl border border-primary/20 text-center text-sm text-primary font-medium border-dashed animate-pulse">
          Select an empty cell to move <b>{moveMode.subject.name}</b>, or press Esc to cancel.
        </div>
      )}

      <div className="overflow-x-auto no-scrollbar glass-card rounded-2xl shadow-2xl relative select-none">
        <table className="w-full border-collapse table-fixed">
          {/* Header Row: Time Slots */}
          <thead>
            <tr>
              {/* DAY corner cell */}
              <th className="p-2 text-center font-label-sm text-primary uppercase bg-surface-container-highest/30 rounded-tl-xl" style={{ width: '72px' }}>
                DAY
              </th>
              {firstDaySlots.map((slot, i) => {
                const isBreak = slot.type === 'break';
                const isBuffer = slot.type === 'buffer';
                // Hide buffer/free slots entirely
                if (isBuffer) return null;
                return (
                  <th
                    key={`th-${i}`}
                    className={cn(
                      'p-2 text-center font-label-sm leading-tight bg-surface-container-highest/10',
                      isBreak ? 'text-amber-500' : 'text-outline',
                      i === firstDaySlots.length - 1 && 'rounded-tr-xl'
                    )}
                    style={{ width: isBreak ? '60px' : 'auto' }}
                  >
                    {isBreak ? (
                      <>
                        <span className="block text-[10px]">{slot.name || 'Break'}</span>
                        <span className="block text-[9px] opacity-60 mt-0.5">{slot.start}–{slot.end}</span>
                      </>
                    ) : (
                      <>
                        <span className="block text-[10px]">{slot.start}</span>
                        <span className="block text-[9px] opacity-50">–{slot.end}</span>
                      </>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body Rows: Days */}
          <tbody>
            {state.schedule.map((daySchedule, dayIndex) => (
              <tr key={`row-${dayIndex}`}>
                {/* Day label cell */}
                <td className="p-1 text-center font-label-sm text-[11px] text-primary uppercase bg-surface-container-highest/20 border-t border-white/5 leading-tight" style={{ width: '72px' }}>
                  {daySchedule.day}
                </td>

                {daySchedule.slots.map((slot, slotIndex) => {
                  const isBreak = slot.type === 'break';
                  const isBuffer = slot.type === 'buffer';

                  // Hide buffer/free columns entirely
                  if (isBuffer) return null;

                  // Break: render once spanning all rows
                  if (isBreak) {
                    if (dayIndex === 0) {
                      return (
                        <td
                          key={`slot-${dayIndex}-${slotIndex}`}
                          rowSpan={dayCount}
                          className="border-t border-white/5 text-center align-middle bg-primary/5"
                          style={{ width: '60px' }}
                        >
                          <span
                            className="font-label-sm text-[9px] text-primary uppercase tracking-[0.15em] whitespace-nowrap opacity-80"
                            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', display: 'inline-block' }}
                          >
                            {slot.name || 'Break'}
                          </span>
                        </td>
                      );
                    }
                    return null;
                  }

                  // Normal period cell
                  const subject = slot.subject;
                  const isEmpty = !subject;
                  const isMoveTarget = moveMode && isEmpty;
                  const isMoveSource = moveMode && moveMode.dayIndex === dayIndex && moveMode.slotIndex === slotIndex;

                  return (
                    <td
                      key={`slot-${dayIndex}-${slotIndex}`}
                      className="p-1 border-t border-white/5"
                      onDragOver={(e) => handleDragOver(e, slot.type)}
                      onDrop={(e) => handleDrop(e, dayIndex, slotIndex)}
                      onClick={(e) => handleCellClick(e, dayIndex, slotIndex, subject)}
                    >
                      <div
                        draggable={!!subject && !moveMode}
                        onDragStart={(e) => handleDragStart(e, dayIndex, slotIndex, subject)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'w-full min-h-[68px] rounded-lg p-2 flex flex-col justify-between transition-transform cursor-pointer border',
                          subject
                            ? 'glass-card hover:scale-[1.01]'
                            : 'bg-surface-container-highest/10 border-dashed border-outline-variant/10 hover:bg-surface-container-highest/30 items-center justify-center',
                          isMoveTarget && 'border-primary border-dashed bg-primary/10 animate-pulse',
                          isMoveSource && 'opacity-30',
                          subject && !moveMode && 'cursor-grab active:cursor-grabbing'
                        )}
                        style={subject ? {
                          borderLeft: `3px solid ${subject.color || '#6bd8cb'}`,
                          background: `linear-gradient(90deg, ${subject.color || '#6bd8cb'}18 0%, transparent 100%)`
                        } : {}}
                      >
                        {subject ? (
                          <>
                            <p className="text-[11px] font-semibold leading-tight text-on-surface line-clamp-2">{subject.name}</p>
                            <span className="text-[9px] opacity-50 text-on-surface-variant line-clamp-1 mt-1">{subject.teacher || '—'}</span>
                          </>
                        ) : (
                          <span className="text-[10px] text-outline italic text-center w-full block">—</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TimetableGrid;
