import React, { useState, useEffect, useRef } from 'react';
import { Search, Terminal, Activity, ArrowRight, Lock } from 'lucide-react';

export default function SovereignCommandPalette({ setActiveTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const inputRef = useRef(null);

  const commands = [
    { id: 'radar_open', title: 'Open Radar', description: 'Scroll to and focus admin radar view', enabled: true },
    { id: 'radar_exit_history', title: 'Exit Historical Mode', description: 'Return to live state stream', enabled: true },
    { id: 'sys_snapshot', title: 'Show System Snapshot', description: 'Display current runtime state', enabled: true },
    { id: 'radar_refresh', title: 'Refresh Radar View', description: 'Force a safe sync with backend state', enabled: false },
    { id: 'open_kiosk', title: 'Open Clinic Kiosk', description: 'Launch the patient kiosk interface', enabled: false },
    { id: 'open_debt', title: 'Open Technical Debt Register', description: 'View architectural records in console', enabled: false },
    { id: 'toggle_focus', title: 'Toggle Quiet Focus Mode', description: 'Enable distraction-free admin view', enabled: false }
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeCommand(filteredCommands[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const showToast = (title, message) => {
    setToastMessage({ title, message });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const executeCommand = (cmd) => {
    if (!cmd || !cmd.enabled) return;

    setIsOpen(false);

    switch (cmd.id) {
      case 'radar_open':
        setActiveTab('journey');
        break;
      case 'radar_exit_history':
        setActiveTab('telemetry');
        break;
      case 'sys_snapshot':
        const snapshot = `Time: ${new Date().toLocaleTimeString()} | Tab: Current | Radar: UI-Shell`;
        console.info('[Sovereign System Snapshot]', snapshot);
        showToast('System Snapshot', snapshot);
        break;
      default:
        break;
    }
  };

  if (!isOpen && !toastMessage) return null;

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-[10000] flex flex-col pointer-events-none animate-fade-in">
          <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-sovereign-gold/30 px-5 py-4 rounded-xl shadow-xl flex flex-col min-w-[280px]">
            <span className="font-semibold text-sm text-sovereign-gold mb-1">{toastMessage.title}</span>
            <span className="text-xs text-white/60">{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Command Palette Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-[#050505]/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            onClick={e => e.stopPropagation()}
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(212, 175, 55, 0.1)' }}
          >
            <div className="flex items-center px-6 py-4 border-b border-white/5">
              <Search className="w-5 h-5 text-sovereign-gold/50 mr-4" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent border-none outline-none text-white/90 placeholder-white/30 text-lg font-light focus:ring-0"
                autoComplete="off"
                spellCheck="false"
              />
              <div className="flex items-center gap-2 text-xs font-mono text-sovereign-muted">
                <span className="bg-white/10 px-1.5 py-0.5 rounded">esc</span> to close
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto py-2 px-2 custom-scrollbar">
              {filteredCommands.length === 0 ? (
                <div className="py-8 text-center text-white/30 text-sm font-light">
                  No sovereign commands found.
                </div>
              ) : (
                filteredCommands.map((cmd, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={cmd.id}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`px-4 py-3 mx-2 my-1 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-sovereign-gold/10 border border-sovereign-gold/20'
                          : 'bg-transparent border border-transparent hover:bg-white/5'
                      } ${!cmd.enabled ? 'opacity-50' : ''}`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-sm ${isSelected ? 'text-sovereign-gold' : 'text-white/80'}`}>
                          {cmd.title}
                        </span>
                        <span className="text-xs text-white/40 mt-0.5">
                          {cmd.description}
                        </span>
                      </div>
                      <div className="flex items-center">
                        {!cmd.enabled ? (
                          <div className="flex items-center gap-1.5 text-2xs text-sovereign-bronze border border-sovereign-bronze/30 px-2 py-0.5 rounded-sm bg-sovereign-bronze/5">
                            <Lock className="w-3 h-3" />
                            <span>Coming soon / Disabled in Legacy Freeze migration</span>
                          </div>
                        ) : isSelected && (
                          <ArrowRight className="w-4 h-4 text-sovereign-gold" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="px-4 py-2 border-t border-white/5 bg-[#0a0a0a] flex items-center justify-between text-2xs text-sovereign-muted font-mono uppercase tracking-widest">
              <div className="flex items-center">
                <Terminal className="w-3 h-3 mr-2" />
                Sovereign Command Engine
              </div>
              <div className="flex items-center">
                <Activity className="w-3 h-3 mr-2 text-sovereign-gold animate-pulse" />
                UI-Shell Mode
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
