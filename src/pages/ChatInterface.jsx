import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimetable } from '../context/TimetableContext';
import { generateTimetableData, generateTimetableFromPDF } from '../services/geminiApi';
import { generateTimeSlots, generateInitialSchedule } from '../utils/scheduler';
import { cn } from '../utils/cn';

function ChatInterface() {
  const navigate = useNavigate();
  const { dispatch } = useTimetable();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const validateInput = (text) => {
    const textLower = text.toLowerCase();
    const missing = [];
    if (!textLower.includes('subject') && !textLower.includes('-')) missing.push('Subjects');
    if (!textLower.includes('am') && !textLower.includes('pm') && !textLower.includes(':')) missing.push('School Timing');
    if (!textLower.includes('min') && !textLower.includes('duration')) missing.push('Class Duration');
    return missing;
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
    setInput('');
    setIsGenerating(true);

    const missing = validateInput(userMsg);
    if (userMsg.length < 20 || missing.length >= 2) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'ai', 
        content: `🛑 **I need more information!** Your prompt is too brief or missing crucial constraints.\n\nPlease explicitly state the following details: **${missing.length > 0 ? missing.join(', ') : 'All parameters (Subjects, Days, Timing, Breaks, Duration)'}**.`,
        isError: true
      }]);
      setIsGenerating(false);
      return;
    }

    try {
      setMessages(prev => [...prev, { id: 'loading', role: 'ai', content: "Generating your timetable...", isLoading: true }]);
      
      const parsedData = await generateTimetableData(userMsg);
      
      const breaksToUse = parsedData.breaks || 
        (parsedData.breakTiming ? [{ name: 'Lunch Break', ...parsedData.breakTiming }] : 
        [{ name: 'Lunch Break', start: '13:00', end: '14:00' }]);
      const slots = generateTimeSlots(parsedData.schoolTiming, parsedData.classDuration, breaksToUse);
      const schedule = generateInitialSchedule(slots, parsedData.workingDays, parsedData.subjects);
      
      dispatch({
        type: 'SET_TIMETABLE_STATE',
        payload: {
          ...parsedData,
          breaks: breaksToUse,
          schedule
        }
      });
      
      navigate('/editor');

    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== 'loading').concat({
        id: Date.now().toString(),
        role: 'ai',
        content: `❌ **Failed to generate timetable.**\n\nError: ${error.message}\n\nPlease try re-writing your prompt.`,
        isError: true
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePDFUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }

    setIsGenerating(true);
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'user', content: `📄 Uploaded PDF: ${file.name}` },
      { id: 'loading', role: 'ai', content: "Analyzing and extracting timetable from PDF...", isLoading: true }
    ]);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result.split(',')[1];
        const parsedData = await generateTimetableFromPDF(base64Data);

        const breaksToUse = parsedData.breaks || [];
        const slots = generateTimeSlots(parsedData.schoolTiming, parsedData.classDuration, breaksToUse);
        const schedule = parsedData.schedule || generateInitialSchedule(slots, parsedData.workingDays, parsedData.subjects);

        dispatch({
          type: 'SET_TIMETABLE_STATE',
          payload: {
            ...parsedData,
            breaks: breaksToUse,
            schedule
          }
        });

        navigate('/editor');
      } catch (err) {
        setMessages(prev => prev.filter(m => m.id !== 'loading').concat({
          id: Date.now().toString(),
          role: 'ai',
          content: `❌ **Failed to parse PDF timetable.**\n\nError: ${err.message}\n\nPlease verify that the PDF has a readable timetable structure or try copy-pasting details.`,
          isError: true
        }));
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const isChatStarted = messages.length > 0;

  return (
    <>
      <div className="fixed inset-0 bg-mesh -z-10"></div>
      
      {/* Centered Splash Layout when no messages */}
      {!isChatStarted ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-2xl mx-auto w-full text-center py-12">
          <div className="mb-6 space-y-2 animate-fade-up">
            <span className="material-symbols-outlined text-primary text-5xl animate-float">auto_awesome</span>
            <h1 className="font-headline-lg text-4xl font-bold tracking-tight text-on-background">TIME-PILOT AI</h1>
            <p className="text-on-surface-variant font-body-md max-w-sm mx-auto opacity-80">
              Upload an existing timetable PDF to edit, or prompt our AI to build a customized schedule from scratch.
            </p>
          </div>

          <form onSubmit={handleSend} className="w-full flex items-end gap-2 bg-surface-container-high p-2 rounded-[24px] shadow-2xl chat-glow border border-white/5 relative z-50 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex-1 relative">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isGenerating}
                className="w-full bg-transparent border-none focus:ring-0 text-on-background font-body-md py-3 px-4 resize-none max-h-32 placeholder:text-on-surface-variant/50" 
                placeholder="Ask me to build a timetable (e.g. 5 periods, 9AM to 4PM...)" 
                rows={1}
              ></textarea>
            </div>
            <button 
              type="submit"
              disabled={isGenerating || !input.trim()}
              className="bg-primary hover:brightness-110 text-on-primary w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 flex-shrink-0 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </form>

          {/* Action Buttons below Search Box */}
          <div className="flex flex-wrap justify-center gap-4 mt-6 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={handlePDFUploadClick}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl hover:bg-surface-variant/40 hover:border-primary/40 transition-all font-label-sm text-primary-fixed shadow-md active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">upload_file</span>
              Add Timetable (PDF)
            </button>
            <button
              onClick={() => setShowFormatModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl hover:bg-surface-variant/40 hover:border-primary/40 transition-all font-label-sm text-on-surface-variant shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">info</span>
              Input Format
            </button>
          </div>
        </div>
      ) : (
        /* Standard Scrollable Chat view when active */
        <main className="flex-1 overflow-y-auto pt-6 pb-40 px-4 md:px-gutter max-w-2xl mx-auto w-full flex flex-col gap-6 relative z-10">
          {messages.map((msg) => (
            msg.role === 'ai' ? (
              <div key={msg.id} className="flex flex-col items-start w-full">
                <div className={cn("ai-bubble p-4 rounded-2xl rounded-tl-none shadow-sm flex flex-col gap-3 w-full sm:max-w-[90%]", msg.isError ? "border-error/50 bg-error-container/20" : "")}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <span className="text-xs font-bold text-primary tracking-wide uppercase">Time-Pilot AI</span>
                  </div>
                  {msg.isLoading ? (
                    <div className="flex items-center gap-1.5 border-none shadow-none mt-1">
                      <div className="w-1.5 h-1.5 bg-primary/60 rounded-full typing-dot" style={{ animationDelay: '0s' }}></div>
                      <div className="w-1.5 h-1.5 bg-primary/60 rounded-full typing-dot" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-primary/60 rounded-full typing-dot" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  ) : (
                    <p className="font-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex flex-col items-end w-full">
                <div className="user-bubble px-5 py-3 rounded-2xl rounded-tr-none shadow-md max-w-[85%] sm:max-w-[80%]">
                  <p className="font-body-md leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            )
          ))}
          <div ref={messagesEndRef} />
        </main>
      )}

      {/* Persistent bottom input box when chat is started */}
      {isChatStarted && (
        <div className="fixed bottom-[4.5rem] md:bottom-0 left-0 w-full z-40 px-4 pb-6 pt-6 bg-gradient-to-t from-background via-background/90 to-transparent">
          <form onSubmit={handleSend} className="max-w-2xl mx-auto flex items-end gap-2 bg-surface-container-high p-1.5 rounded-[24px] shadow-2xl chat-glow border border-white/5 relative z-50">
            <button 
              type="button" 
              onClick={handlePDFUploadClick}
              disabled={isGenerating}
              className="p-3 rounded-full hover:bg-white/5 transition-all flex items-center justify-center text-on-surface-variant shrink-0"
              title="Upload PDF Timetable"
            >
              <span className="material-symbols-outlined text-[22px]">attach_file</span>
            </button>
            <div className="flex-1 relative">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isGenerating}
                className="w-full bg-transparent border-none focus:ring-0 text-on-background font-body-md py-3 px-2 resize-none max-h-32 placeholder:text-on-surface-variant/50" 
                placeholder="Provide details or upload a PDF..." 
                rows={1}
              ></textarea>
            </div>
            <button 
              type="submit"
              disabled={isGenerating || !input.trim()}
              className="bg-primary hover:brightness-110 text-on-primary w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 flex-shrink-0 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </form>
        </div>
      )}

      {/* Hidden File Input for PDF */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="application/pdf" 
        className="hidden" 
      />

      {/* Input Format Modal */}
      {showFormatModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-surface-container-high rounded-3xl border border-white/10 p-6 shadow-2xl animate-scale-up">
            <button 
              onClick={() => setShowFormatModal(false)}
              className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <span className="material-symbols-outlined text-primary text-2xl">info</span>
                <h2 className="font-headline-md text-xl font-bold text-on-background">Accepted Input Formats</h2>
              </div>

              <div className="space-y-5 overflow-y-auto max-h-[60vh] pr-1 font-body-md text-on-surface-variant text-sm leading-relaxed">
                <div>
                  <h3 className="text-primary font-bold text-sm uppercase tracking-wider mb-2">1. Text Prompts (From Scratch)</h3>
                  <p className="mb-2">For best results, include all scheduling details in your message:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Subjects:</strong> Name of subjects and total periods (e.g. Maths, Physics).</li>
                    <li><strong>Days:</strong> Working days (e.g., Monday to Friday).</li>
                    <li><strong>Timings:</strong> Start and end times (e.g., 9:00 AM to 4:00 PM).</li>
                    <li><strong>Breaks:</strong> All scheduled breaks (e.g., Recess 11:00-11:15 AM).</li>
                    <li><strong>Class Duration:</strong> Length of single period (e.g., 50 minutes).</li>
                  </ul>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <h3 className="text-primary font-bold text-sm uppercase tracking-wider mb-2">2. Uploading PDF Timetables</h3>
                  <p className="mb-2">You can upload any existing digital or scanned timetable PDF file:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>The PDF should contain a table, spreadsheet, grid, or text list representing the weekly schedule.</li>
                    <li>Gemini will read the PDF, parse all subject assignments, lunch/tea breaks, and school start/end hours.</li>
                    <li>Your schedule is then loaded directly into our interactive <strong>Weekly Flight Deck</strong>, letting you rearrange subjects and download it instantly.</li>
                    <li><strong>Important:</strong> Upload a clear timetable PDF with properly labeled class periods, subjects, and break periods (Tea Break, Lunch Break, etc.). Missing labels or poor formatting may prevent the AI from reading the timetable correctly.</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 text-right">
                <button
                  onClick={() => setShowFormatModal(false)}
                  className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:brightness-105 active:scale-95 transition-all text-sm uppercase"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatInterface;
