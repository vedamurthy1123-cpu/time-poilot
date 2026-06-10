import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { TimetableProvider } from './context/TimetableContext';
import LandingPage from './pages/LandingPage';
import ChatInterface from './pages/ChatInterface';
import TimetableEditor from './pages/TimetableEditor';
import Layout from './components/Layout';

function App() {
  return (
    <TimetableProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="chat" element={<ChatInterface />} />
          <Route path="editor" element={<TimetableEditor />} />
        </Route>
      </Routes>
    </TimetableProvider>
  );
}

export default App;
