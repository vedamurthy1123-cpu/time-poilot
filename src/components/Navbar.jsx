import React from 'react';
import { useTimetable } from '../context/TimetableContext';
import { Link } from 'react-router-dom';

function Navbar() {
  const { state, dispatch } = useTimetable();

  return (
    <header className="docked full-width top-0 sticky z-[100] bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-lg shadow-primary/5">
      <div className="flex justify-between items-center px-gutter w-full max-w-container-max mx-auto h-20">
        <Link to="/" className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[28px]">menu</span>
          <span className="font-display-lg text-headline-md tracking-tighter text-on-background">TIME-PILOT</span>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
