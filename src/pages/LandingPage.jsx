import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const logo = `${import.meta.env.BASE_URL}3d_logo.png`;

function LandingPage() {
  const panelsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    panelsRef.current.forEach(panel => {
        if (panel) {
          panel.style.opacity = '0';
          panel.style.transform = 'translateY(20px)';
          panel.style.transition = 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
          observer.observe(panel);
        }
    });

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el) => {
    if (el && !panelsRef.current.includes(el)) {
      panelsRef.current.push(el);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-mesh -z-10"></div>
      
      <section className="flex flex-col items-center px-gutter pt-12 text-center overflow-hidden">
        <div className="relative w-72 h-72 md:w-96 md:h-96 mb-8 animate-float">
          <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full"></div>
          <img
            alt="TIME-PILOT 3D Logo"
            className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_40px_rgba(107,216,203,0.4)]"
            src={logo}
          />
        </div>
        
        <div className="max-w-xl mx-auto space-y-4">
          <h1 className="hero-text-entry animate-fade-up font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background tracking-tight" style={{ animationDelay: '0.2s' }}>
            Master Your Time with <span className="text-primary italic">AI Intelligence</span>
          </h1>
          <p className="hero-text-entry animate-fade-up font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto opacity-80" style={{ animationDelay: '0.4s' }}>
            The most advanced AI timetable assistant for schools and colleges. Precise. Intelligent. Effortless.
          </p>
        </div>
        
        <div className="mt-12 w-full max-w-xs hero-text-entry animate-fade-up" style={{ animationDelay: '0.6s' }}>
          <Link to="/chat" className="button-3d-push w-full py-5 px-8 bg-primary-container text-on-primary-container font-bold rounded-xl flex items-center justify-center gap-3 text-body-lg group">
            Get Started
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>
      </section>





      <footer className="relative w-full py-12 mt-20 bg-surface-container-lowest border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center px-gutter max-w-container-max mx-auto gap-4">
          <div className="text-center md:text-left">
            <span className="font-headline-md text-headline-md text-primary block mb-2 tracking-tight">TIME-PILOT</span>
            <p className="font-label-sm text-label-sm text-on-surface-variant/40">© 2024 TIME-PILOT AI. All systems operational.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a className="font-label-sm text-label-sm text-on-surface-variant/60 hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant/60 hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Terms of Service</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant/60 hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">AI Ethics</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant/60 hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Support</a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default LandingPage;
