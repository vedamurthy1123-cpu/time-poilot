import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  const getLinkClass = (targetPath) => {
    const isActive = path === targetPath;
    if (isActive) {
      return "flex flex-col items-center justify-center bg-primary text-on-primary rounded-full px-6 py-1.5 scale-90 duration-200";
    }
    return "flex flex-col items-center justify-center text-on-surface-variant/60 p-2 hover:text-primary transition-all";
  };

  const getIconStyle = (targetPath) => {
    return path === targetPath ? { fontVariationSettings: "'FILL' 1" } : {};
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-surface-container-high/90 backdrop-blur-2xl border-t border-white/5 shadow-[0_-8px_30px_rgb(0,0,0,0.4)] rounded-t-xl md:hidden">
      <Link className={getLinkClass('/')} to="/">
        <span className="material-symbols-outlined" style={getIconStyle('/')}>home</span>
        <span className="font-label-sm text-label-sm mt-0.5">Home</span>
      </Link>
      <Link className={getLinkClass('/chat')} to="/chat">
        <span className="material-symbols-outlined" style={getIconStyle('/chat')}>smart_toy</span>
        <span className="font-label-sm text-label-sm mt-0.5">Chat</span>
      </Link>
      <Link className={getLinkClass('/editor')} to="/editor">
        <span className="material-symbols-outlined" style={getIconStyle('/editor')}>calendar_view_month</span>
        <span className="font-label-sm text-label-sm mt-0.5">Schedule</span>
      </Link>
    </nav>
  );
}

export default BottomNav;
