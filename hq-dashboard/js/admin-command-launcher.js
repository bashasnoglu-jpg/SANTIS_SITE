/**
 * SANTIS SOVEREIGN OS - ADMIN COMMAND LAUNCHER
 * Safe, read-only command palette.
 * Zero network, zero storage, quiet luxury design.
 */

(function () {
    if (window.SantisAdminCommandLauncher) {
        console.warn('SantisAdminCommandLauncher already initialized. Skipping.');
        return;
    }

    class AdminCommandLauncher {
        constructor() {
            this.isOpen = false;
            this.selectedIndex = 0;
            this.commands = [
                { id: 'radar_open', title: 'Open Radar', description: 'Scroll to and focus admin radar view' },
                { id: 'radar_refresh', title: 'Refresh Radar View', description: 'Force a safe sync with backend state' },
                { id: 'radar_exit_history', title: 'Exit Historical Mode', description: 'Return to live state stream' },
                { id: 'open_kiosk', title: 'Open Clinic Kiosk', description: 'Launch the patient kiosk interface' },
                { id: 'open_debt', title: 'Open Technical Debt Register', description: 'View architectural records in console' },
                { id: 'toggle_focus', title: 'Toggle Quiet Focus Mode', description: 'Enable distraction-free admin view' },
                { id: 'sys_snapshot', title: 'Show System Snapshot', description: 'Display current runtime state' }
            ];
            this.filteredCommands = [...this.commands];
            this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            this.initDOM();
            this.bindEvents();
        }

        initDOM() {
            if (document.getElementById('santis-command-palette-wrapper')) return;

            this.wrapper = document.createElement('div');
            this.wrapper.id = 'santis-command-palette-wrapper';
            this.wrapper.className = 'fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] pointer-events-none transition-all duration-300 opacity-0';
            this.wrapper.style.backdropFilter = 'blur(0px)';
            this.wrapper.style.backgroundColor = 'rgba(5, 5, 5, 0)';

            this.modal = document.createElement('div');
            this.modal.className = 'w-full max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto transform scale-95 transition-all duration-300';
            this.modal.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(212, 175, 55, 0.1)';

            const inputContainer = document.createElement('div');
            inputContainer.className = 'flex items-center px-6 py-4 border-b border-white/5';

            inputContainer.innerHTML = `<svg class="w-5 h-5 text-santisGold/50 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>`;

            this.input = document.createElement('input');
            this.input.type = 'text';
            this.input.placeholder = 'Type a command or search...';
            this.input.className = 'flex-1 bg-transparent border-none outline-none text-white/90 placeholder-white/30 text-lg font-light focus:ring-0';
            this.input.setAttribute('autocomplete', 'off');
            this.input.setAttribute('spellcheck', 'false');

            inputContainer.appendChild(this.input);
            this.modal.appendChild(inputContainer);

            this.listContainer = document.createElement('div');
            this.listContainer.className = 'max-h-[60vh] overflow-y-auto py-2 px-2 custom-scrollbar';
            this.modal.appendChild(this.listContainer);

            this.wrapper.appendChild(this.modal);
            document.body.appendChild(this.wrapper);

            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'santis-toast-container';
            this.toastContainer.className = 'fixed bottom-8 right-8 z-[10000] flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(this.toastContainer);

            this.renderList();
        }

        bindEvents() {
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                    e.preventDefault();
                    this.toggle();
                }

                if (!this.isOpen) return;

                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.close();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredCommands.length - 1);
                    this.renderList();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                    this.renderList();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.executeSelected();
                }
            });

            this.wrapper.addEventListener('click', (e) => {
                if (e.target === this.wrapper) {
                    this.close();
                }
            });

            this.input.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                this.filteredCommands = this.commands.filter(cmd =>
                    cmd.title.toLowerCase().includes(query) ||
                    cmd.description.toLowerCase().includes(query)
                );
                this.selectedIndex = 0;
                this.renderList();
            });
        }

        toggle() {
            if (this.isOpen) this.close();
            else this.open();
        }

        open() {
            this.isOpen = true;
            this.input.value = '';
            this.filteredCommands = [...this.commands];
            this.selectedIndex = 0;
            this.renderList();

            this.wrapper.style.backgroundColor = 'rgba(5, 5, 5, 0.4)';
            this.wrapper.style.backdropFilter = 'blur(4px)';
            this.wrapper.style.opacity = '1';
            this.wrapper.style.pointerEvents = 'auto';

            this.modal.style.transform = 'scale(1)';

            setTimeout(() => this.input.focus(), 50);
        }

        close() {
            this.isOpen = false;

            this.wrapper.style.backgroundColor = 'rgba(5, 5, 5, 0)';
            this.wrapper.style.backdropFilter = 'blur(0px)';
            this.wrapper.style.opacity = '0';
            this.wrapper.style.pointerEvents = 'none';

            this.modal.style.transform = 'scale(0.95)';
            this.input.blur();
        }

        renderList() {
            this.listContainer.innerHTML = '';

            if (this.filteredCommands.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'py-8 text-center text-white/30 text-sm font-light';
                emptyState.textContent = 'No sovereign commands found.';
                this.listContainer.appendChild(emptyState);
                this.listItems = [];
                return;
            }

            this.listItems = [];
            this.filteredCommands.forEach((cmd, index) => {
                const item = document.createElement('div');
                item.className = 'px-4 py-3 mx-2 my-1 rounded-lg cursor-pointer flex items-center justify-between transition-colors bg-transparent border border-transparent hover:bg-white/5';

                const textContainer = document.createElement('div');
                textContainer.className = 'flex flex-col';

                const title = document.createElement('span');
                title.className = 'text-sm text-white/80 cmd-title';
                title.textContent = cmd.title;

                const desc = document.createElement('span');
                desc.className = 'text-xs text-white/40 mt-0.5';
                desc.textContent = cmd.description;

                textContainer.appendChild(title);
                textContainer.appendChild(desc);
                item.appendChild(textContainer);

                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.selectedIndex = index;
                    this.executeSelected();
                });

                item.addEventListener('mouseenter', () => {
                    this.selectedIndex = index;
                    this.updateSelectionVisuals();
                });

                this.listContainer.appendChild(item);
                this.listItems.push({ item, title });
            });

            this.updateSelectionVisuals();
        }

        updateSelectionVisuals() {
            if (!this.listItems) return;

            this.listItems.forEach((obj, index) => {
                const isSelected = index === this.selectedIndex;

                if (isSelected) {
                    obj.item.className = 'px-4 py-3 mx-2 my-1 rounded-lg cursor-pointer flex items-center justify-between transition-colors bg-santisGold/10 border border-santisGold/20';
                    obj.title.className = 'text-sm cmd-title text-santisGold';
                    obj.item.scrollIntoView({ block: 'nearest' });
                } else {
                    obj.item.className = 'px-4 py-3 mx-2 my-1 rounded-lg cursor-pointer flex items-center justify-between transition-colors bg-transparent border border-transparent hover:bg-white/5';
                    obj.title.className = 'text-sm cmd-title text-white/80';
                }
            });
        }

        executeSelected() {
            const cmd = this.filteredCommands[this.selectedIndex];
            if (!cmd) return;

            this.close();

            try {
                switch (cmd.id) {
                    case 'radar_open':
                        window.scrollTo({ top: 0, behavior: this.isReducedMotion ? 'auto' : 'smooth' });
                        break;
                    case 'radar_refresh':
                        if (window.RadarEngine && typeof window.RadarEngine.syncWithBackend === 'function') {
                            window.RadarEngine.syncWithBackend();
                            this.showToast('Radar View Refreshed', 'Successfully triggered sync loop.');
                        } else {
                            console.warn('CommandLauncher: RadarEngine not available for refresh.');
                            this.showToast('Refresh Failed', 'RadarEngine is offline or inaccessible.', 'error');
                        }
                        break;
                    case 'radar_exit_history':
                        if (window.RadarEngine && typeof window.RadarEngine.exitHistoricalMode === 'function') {
                            window.RadarEngine.exitHistoricalMode();
                            this.showToast('Historical Mode Exited', 'Returned to live stream.');
                        } else {
                            console.warn('CommandLauncher: exitHistoricalMode not available.');
                        }
                        break;
                    case 'open_kiosk':
                        window.open('/clinic-kiosk/index.html', '_blank');
                        break;
                    case 'open_debt':
                        console.info('Sovereign Architectural Record: See docs/technical-debt-register.md');
                        this.showToast('Debt Register', 'Path printed to console. File opening is restricted.', 'info');
                        break;
                    case 'toggle_focus':
                        document.body.classList.toggle('santis-command-focus');
                        if (!document.getElementById('santis-focus-style')) {
                            const style = document.createElement('style');
                            style.id = 'santis-focus-style';
                            style.textContent = `
                                body.santis-command-focus *:not(#santis-command-palette-wrapper):not(#santis-command-palette-wrapper *):not(#santis-toast-container):not(#santis-toast-container *) {
                                    filter: grayscale(100%) opacity(0.8) !important;
                                }
                            `;
                            document.head.appendChild(style);
                        }
                        break;
                    case 'sys_snapshot':
                        const snapshot = [
                            `URL: ${window.location.pathname}`,
                            `Time: ${new Date().toLocaleTimeString()}`,
                            `Radar: ${window.RadarEngine ? 'Online' : 'Offline'}`,
                            `Chart: ${typeof Chart !== 'undefined' ? 'Available' : 'Missing'}`
                        ].join(' | ');
                        this.showToast('System Snapshot', snapshot);
                        break;
                }
            } catch (error) {
                console.warn('CommandLauncher Execution Error:', error);
            }
        }

        showToast(title, message, type = 'success') {
            const toast = document.createElement('div');
            const color = type === 'error' ? 'border-red-500/30 text-red-400' : 'border-santisGold/30 text-santisGold';

            toast.className = `bg-[#0a0a0a]/90 backdrop-blur-md border ${color} px-5 py-4 rounded-xl shadow-xl transform translate-x-full transition-all duration-300 flex flex-col min-w-[280px] pointer-events-none mt-2`;

            const tEl = document.createElement('span');
            tEl.className = 'font-semibold text-sm mb-1';
            tEl.textContent = title;

            const mEl = document.createElement('span');
            mEl.className = 'text-xs text-white/60';
            mEl.textContent = message;

            toast.appendChild(tEl);
            toast.appendChild(mEl);
            this.toastContainer.appendChild(toast);

            requestAnimationFrame(() => {
                toast.style.transform = 'translateX(0)';
            });

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px)';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }
    }

    window.SantisAdminCommandLauncher = new AdminCommandLauncher();

})();
