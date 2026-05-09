import { adminRoutes } from './admin-route-registry.js';

export class SovereignCommandPalette {
    constructor() {
        this.routes = adminRoutes;
        this.isOpen = false;
        this.selectedIndex = 0;
        this.filteredRoutes = [...this.routes];
        this.initDOM();
    }

    initDOM() {
        if (document.getElementById('sovereign-omni-nav')) return;

        this.overlay = document.createElement('div');
        this.overlay.id = 'sovereign-omni-nav';
        this.overlay.className = 'omni-nav-overlay';
        
        this.container = document.createElement('div');
        this.container.className = 'omni-nav-container';

        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'omni-nav-input';
        this.input.placeholder = 'Karargâh Hedefi Girin (Örn: Radar)...';
        this.input.autocomplete = 'off';
        
        this.resultsList = document.createElement('ul');
        this.resultsList.className = 'omni-nav-results';

        this.container.appendChild(this.input);
        this.container.appendChild(this.resultsList);
        this.overlay.appendChild(this.container);
        document.body.appendChild(this.overlay);

        this.bindEvents();
    }

    bindEvents() {
        this.input.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.moveSelection(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.moveSelection(-1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.executeSelection();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.close();
            }
        });
    }

    handleSearch(query) {
        query = query.toLowerCase().trim();
        if (!query) {
            this.filteredRoutes = [...this.routes];
        } else {
            this.filteredRoutes = this.routes.filter(route => 
                route.label.toLowerCase().includes(query) || 
                route.group.toLowerCase().includes(query) ||
                route.keywords.some(k => k.includes(query))
            );
        }
        this.selectedIndex = 0;
        this.renderResults();
    }

    moveSelection(direction) {
        if (this.filteredRoutes.length === 0) return;
        this.selectedIndex += direction;
        
        if (this.selectedIndex < 0) this.selectedIndex = this.filteredRoutes.length - 1;
        if (this.selectedIndex >= this.filteredRoutes.length) this.selectedIndex = 0;
        
        this.renderResults();
        
        const activeItem = this.resultsList.children[this.selectedIndex];
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'nearest' });
        }
    }

    executeSelection() {
        if (this.filteredRoutes.length === 0) return;
        const selected = this.filteredRoutes[this.selectedIndex];
        if (selected && selected.path) {
            window.location.href = selected.path;
        }
    }

    renderResults() {
        this.resultsList.innerHTML = '';
        
        if (this.filteredRoutes.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'omni-nav-empty';
            empty.innerText = 'Bölge Bulunamadı.';
            this.resultsList.appendChild(empty);
            return;
        }

        let currentGroup = '';

        this.filteredRoutes.forEach((route, index) => {
            if (route.group !== currentGroup) {
                const groupHeader = document.createElement('li');
                groupHeader.className = 'omni-nav-group';
                groupHeader.innerText = route.group;
                this.resultsList.appendChild(groupHeader);
                currentGroup = route.group;
            }

            const item = document.createElement('li');
            item.className = 'omni-nav-item' + (index === this.selectedIndex ? ' active' : '');
            
            const dotColor = route.group === 'Radarlar' ? '#ff3366' : '#10b981';
            
            item.innerHTML = `
                <div class="omni-item-left">
                    <span class="omni-item-dot" style="background-color: ${dotColor}; box-shadow: 0 0 10px ${dotColor}"></span>
                    <span class="omni-item-label">${route.label}</span>
                </div>
                <div class="omni-item-path">${route.path}</div>
            `;
            
            item.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.renderResults();
            });
            item.addEventListener('click', () => {
                this.executeSelection();
            });

            this.resultsList.appendChild(item);
        });
    }

    open() {
        this.isOpen = true;
        this.overlay.style.display = 'flex';
        setTimeout(() => {
            this.input.value = '';
            this.handleSearch('');
            this.input.focus();
            this.overlay.classList.add('visible');
            document.body.classList.add('omni-nav-blur');
        }, 10);
    }

    close() {
        this.isOpen = false;
        this.overlay.classList.remove('visible');
        document.body.classList.remove('omni-nav-blur');
        setTimeout(() => {
            this.overlay.style.display = 'none';
        }, 300);
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }
}
