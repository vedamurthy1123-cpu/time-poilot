import React, { createContext, useContext, useReducer, useEffect } from 'react';

const TimetableContext = createContext();

const initialState = {
  subjects: [],
  schoolTiming: { start: '09:00', end: '16:00' },
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  breaks: [
    { name: 'Tea Break', start: '11:00', end: '11:15' },
    { name: 'Lunch Break', start: '13:00', end: '14:00' }
  ],
  classDuration: 50,
  schedule: [], // the generated grid
  schoolName: '',
  history: [],
  redoStack: [],
  isDark: false, // will initialize from localStorage
};

function timetableReducer(state, action) {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return { ...state, ...action.payload };
    case 'SET_TIMETABLE_STATE': {
      // Save current state to history (up to 30 actions)
      const currentSnapshot = {
        schedule: state.schedule,
        subjects: state.subjects,
        schoolTiming: state.schoolTiming,
        workingDays: state.workingDays,
        breaks: state.breaks,
        classDuration: state.classDuration,
      };
      const newHistory = [...state.history, currentSnapshot].slice(-30);
      
      return {
        ...state,
        ...action.payload,
        history: newHistory,
        redoStack: [], // clear redo stack on new action
      };
    }
    case 'UNDO': {
      if (state.history.length === 0) return state;
      const previousSnapshot = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      
      const currentSnapshot = {
        schedule: state.schedule,
        subjects: state.subjects,
        schoolTiming: state.schoolTiming,
        workingDays: state.workingDays,
        breaks: state.breaks,
        classDuration: state.classDuration,
      };
      
      return {
        ...state,
        ...previousSnapshot,
        history: newHistory,
        redoStack: [...state.redoStack, currentSnapshot],
      };
    }
    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      const nextSnapshot = state.redoStack[state.redoStack.length - 1];
      const newRedoStack = state.redoStack.slice(0, -1);
      
      const currentSnapshot = {
        schedule: state.schedule,
        subjects: state.subjects,
        schoolTiming: state.schoolTiming,
        workingDays: state.workingDays,
        breaks: state.breaks,
        classDuration: state.classDuration,
      };
      
      return {
        ...state,
        ...nextSnapshot,
        history: [...state.history, currentSnapshot],
        redoStack: newRedoStack,
      };
    }
    case 'SET_SCHOOL_NAME':
      return { ...state, schoolName: action.payload };
    case 'TOGGLE_THEME': {
      const newIsDark = !state.isDark;
      localStorage.setItem('timepilot-theme', newIsDark ? 'dark' : 'light');
      if (newIsDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { ...state, isDark: newIsDark };
    }
    case 'INIT_THEME': {
      return { ...state, isDark: action.payload };
    }
    default:
      return state;
  }
}

export function TimetableProvider({ children }) {
  const [state, dispatch] = useReducer(timetableReducer, initialState);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('timepilot-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    dispatch({ type: 'INIT_THEME', payload: isDark });
  }, []);

  return (
    <TimetableContext.Provider value={{ state, dispatch }}>
      {children}
    </TimetableContext.Provider>
  );
}

export function useTimetable() {
  const context = useContext(TimetableContext);
  if (!context) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
}
