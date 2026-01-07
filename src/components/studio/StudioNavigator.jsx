import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { KCButton } from '../ui';

const lineTransition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] };

const StudioNavigator = ({ steps, activeStepId, onStepChange }) => {
  const activeIndex = useMemo(() => steps.findIndex((step) => step.id === activeStepId), [steps, activeStepId]);
  const progress = useMemo(() => Math.round(((activeIndex + 1) / steps.length) * 100), [activeIndex, steps.length]);
  const activeStep = steps[activeIndex] || steps[0];
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  
  // Refs for scroll containers and step elements
  const desktopScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);

  const handleChange = (id) => {
    onStepChange(id);
    if (window.innerWidth < 1024) {
      setMobilePanelOpen(true);
    }
  };

  // Build a fixed window of [previous, current, next] to keep active centered
  const stepWindow = useMemo(() => {
    const prev = activeIndex > 0 ? steps[activeIndex - 1] : null;
    const curr = steps[activeIndex] || null;
    const next = activeIndex < steps.length - 1 ? steps[activeIndex + 1] : null;
    return [prev, curr, next];
  }, [activeIndex, steps]);

  const closeMobilePanel = () => setMobilePanelOpen(false);

  return (
    <>
      {/* Desktop stepper */}
      <div className="hidden lg:flex lg:flex-col lg:gap-6">
        <div
          className="relative p-7 text-white"
          style={{
            background: 'rgba(20, 20, 20, 0.6)',
            border: '1px solid rgba(255, 215, 0, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.08)',
            overflow: 'visible',
          }}
        >
          <div className="mb-6 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.32em] text-white/70" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
            <span>Studio design flow</span>
            <span>
              Step {activeIndex + 1} of {steps.length} · {progress}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${progress}%` }}
                transition={lineTransition}
                style={{
                  background: 'linear-gradient(90deg, #caa562 0%, #e3c690 100%)',
                  boxShadow: '0 0 10px rgba(227, 198, 144, 0.5)',
                }}
              />
            </div>
          </div>

          <div className="relative overflow-hidden">
            {/* Left fade gradient */}
            <div 
              className="pointer-events-none absolute left-0 top-0 z-20 h-full w-20 bg-gradient-to-r from-[rgba(20,20,20,0.9)] to-transparent"
              style={{ display: desktopScrollRef.current?.scrollLeft > 10 ? 'block' : 'none' }}
            />
            {/* Right fade gradient */}
            <div 
              className="pointer-events-none absolute right-0 top-0 z-20 h-full w-20 bg-gradient-to-l from-[rgba(20,20,20,0.9)] to-transparent"
            />
            <div 
              ref={desktopScrollRef}
              className="relative z-10 flex items-center gap-6 overflow-x-auto pb-3 pt-1 desktop-steps-scroll"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {stepWindow.map((step, index) => {
                if (!step) {
                  return <div key={`placeholder-${index}`} className="flex min-w-[110px] flex-shrink-0 flex-col items-center gap-4 opacity-0" />;
                }
                const stepIndex = steps.findIndex((s) => s.id === step.id);
                const isActive = step.id === activeStepId;
                const isCompleted = stepIndex < activeIndex;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      onStepChange(step.id);
                    }}
                    className="group relative flex min-w-[110px] flex-shrink-0 flex-col items-center gap-4 focus:outline-none pt-1"
                  >
                    <motion.div
                      className={`relative flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-300 ${
                        isActive
                          ? 'border-[#e3c690] bg-gradient-to-br from-[#caa562] to-[#e3c690] text-[#1a1a1a]'
                          : isCompleted
                          ? 'border-white/20 bg-white/10 text-white'
                          : 'border-white/10 bg-white/5 text-white/60'
                      }`}
                      whileHover={!isActive ? { scale: 1.1, boxShadow: '0 0 20px rgba(227, 198, 144, 0.4)' } : {}}
                      style={
                        isActive
                          ? {
                              boxShadow: '0 0 25px rgba(227, 198, 144, 0.6), 0 0 50px rgba(227, 198, 144, 0.3), inset 0 0 20px rgba(202, 165, 98, 0.2)',
                            }
                          : {}
                      }
                      aria-label={step.label}
                    >
                      {isCompleted ? <Check size={20} /> : step.icon ? <step.icon size={20} /> : stepIndex + 1}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-[#e3c690]"
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          style={{ opacity: 0.6 }}
                        />
                      )}
                    </motion.div>
                    <span
                      className={`text-xs font-semibold transition-colors ${isActive ? 'text-[#e3c690]' : 'text-white/60 group-hover:text-white'}`}
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                    >
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStepId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={lineTransition}
            className="p-6 text-white"
            style={{
              background: 'rgba(20, 20, 20, 0.6)',
              border: '1px solid rgba(255, 215, 0, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.05)',
            }}
          >
            {activeStep?.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile horizontal scrollable stepper */}
      <div className="lg:hidden">
        <div
          className="mb-4 overflow-x-auto px-4 py-4"
          style={{
            background: 'rgba(20, 20, 20, 0.6)',
            border: '1px solid rgba(255, 215, 0, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.05)',
          }}
        >
          <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.32em] text-white/60" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
            <span>Step {activeIndex + 1} of {steps.length}</span>
            <span>{progress}% complete</span>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${progress}%` }}
                transition={lineTransition}
                style={{
                  background: 'linear-gradient(90deg, #caa562 0%, #e3c690 100%)',
                  boxShadow: '0 0 10px rgba(227, 198, 144, 0.5)',
                }}
              />
            </div>
          </div>

          <div className="relative overflow-hidden">
            {/* Left fade gradient */}
            <div 
              className="pointer-events-none absolute left-0 top-0 z-20 h-full w-12 bg-gradient-to-r from-[rgba(20,20,20,0.9)] to-transparent"
            />
            {/* Right fade gradient */}
            <div 
              className="pointer-events-none absolute right-0 top-0 z-20 h-full w-12 bg-gradient-to-l from-[rgba(20,20,20,0.9)] to-transparent"
            />
            <div 
              ref={mobileScrollRef}
              className="relative z-10 flex items-center gap-3 overflow-x-auto pb-2 mobile-steps-scroll" 
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
            >
            {stepWindow.map((step, index) => {
              if (!step) {
                return <div key={`mobile-placeholder-${index}`} className="flex min-w-[80px] flex-shrink-0 flex-col items-center gap-2 opacity-0" />;
              }
              const stepIndex = steps.findIndex((s) => s.id === step.id);
              const isActive = step.id === activeStepId;
              const isCompleted = stepIndex < activeIndex;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    handleChange(step.id);
                  }}
                  className="group relative flex min-w-[80px] flex-shrink-0 flex-col items-center gap-2 focus:outline-none"
                >
                  <motion.div
                    className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      isActive
                        ? 'border-[#e3c690] bg-gradient-to-br from-[#caa562] to-[#e3c690] text-[#1a1a1a]'
                        : isCompleted
                        ? 'border-white/20 bg-white/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/60'
                    }`}
                    whileHover={!isActive ? { scale: 1.1, boxShadow: '0 0 20px rgba(227, 198, 144, 0.4)' } : {}}
                    style={
                      isActive
                        ? {
                            boxShadow: '0 0 25px rgba(227, 198, 144, 0.6), 0 0 50px rgba(227, 198, 144, 0.3)',
                          }
                        : {}
                    }
                    aria-label={step.label}
                  >
                    {isCompleted ? <Check size={18} /> : step.icon ? <step.icon size={18} /> : stepIndex + 1}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-[#e3c690]"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ opacity: 0.6 }}
                      />
                    )}
                  </motion.div>
                  <span
                    className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-[#e3c690]' : 'text-white/60 group-hover:text-white'}`}
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobilePanelOpen ? (
            <motion.div
              className="fixed inset-0 z-50 flex flex-col bg-[rgba(15,15,16,0.9)] backdrop-blur"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="ml-auto p-4 text-right"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <KCButton variant="ghost" className="border border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={closeMobilePanel}>
                  Close
                </KCButton>
              </motion.div>
              <motion.div
                className="flex-1 overflow-y-auto rounded-t-[20px] border-t border-[#e3c690]/20 p-6 text-white"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={lineTransition}
                style={{
                  background: 'rgba(20, 20, 20, 0.95)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="mb-4 flex items-center justify-between text-sm text-white/70" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                  <span className="uppercase tracking-[0.32em]">{activeStep?.label}</span>
                  <span>
                    Step {activeIndex + 1} · {progress}%
                  </span>
                </div>
                {activeStep?.content}
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
};

export default StudioNavigator;
