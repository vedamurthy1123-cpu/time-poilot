import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

function Layout() {
  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0">
      <Navbar />
      <main className="flex-grow w-full relative">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

export default Layout;
