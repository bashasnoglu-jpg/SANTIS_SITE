export class SantisVirtualList {
    constructor({
        container,
        items = [],
        itemHeight = 72,
        overscan = 6,
        renderItem,
        keyExtractor = (item, index) => item?.id ?? index,
        emptyState = null,
        className = "santis-virtual-list",
    }) {
        if (!container) throw new Error("container is required");
        if (typeof renderItem !== "function") {
            throw new Error("renderItem must be a function");
        }

        this.container = container;
        this.items = Array.isArray(items) ? items : [];
        this.itemHeight = itemHeight;
        this.overscan = overscan;
        this.renderItem = renderItem;
        this.keyExtractor = keyExtractor;
        this.emptyState = emptyState;
        this.className = className;

        this.scrollTop = 0;
        this.viewportHeight = container.clientHeight || 0;
        this._raf = null;
        this._ticking = false;
        this._destroyed = false;

        this._build();
        this._bind();
        this.render();
    }

    _build() {
        this.container.classList.add(this.className);
        this.container.style.overflow = "auto";
        if (!this.container.style.position) {
            this.container.style.position = "relative";
        }

        this.viewport = document.createElement("div");
        this.viewport.className = "santis-vlist-viewport";

        this.spacer = document.createElement("div");
        this.spacer.className = "santis-vlist-spacer";
        this.spacer.style.position = "relative";
        this.spacer.style.height = `${this.items.length * this.itemHeight}px`;

        this.content = document.createElement("div");
        this.content.className = "santis-vlist-content";
        this.content.style.position = "absolute";
        this.content.style.left = "0";
        this.content.style.right = "0";
        this.content.style.top = "0";
        this.content.style.willChange = "transform";

        this.empty = document.createElement("div");
        this.empty.className = "santis-vlist-empty";
        this.empty.hidden = true;

        if (typeof this.emptyState === "string") {
            this.empty.innerHTML = this.emptyState;
        } else if (this.emptyState instanceof HTMLElement) {
            this.empty.appendChild(this.emptyState);
        } else {
            this.empty.innerHTML = `<div class="santis-vlist-empty-copy">No data</div>`;
        }

        this.spacer.appendChild(this.content);
        this.viewport.appendChild(this.spacer);

        this.container.innerHTML = "";
        this.container.appendChild(this.viewport);
        this.container.appendChild(this.empty);
    }

    _bind() {
        this._onScroll = () => {
            this.scrollTop = this.container.scrollTop;
            this._scheduleRender();
        };

        this._onResize = () => {
            this.viewportHeight = this.container.clientHeight || 0;
            this._scheduleRender();
        };

        this.container.addEventListener("scroll", this._onScroll, {
            passive: true,
        });
        window.addEventListener("resize", this._onResize, { passive: true });
    }

    _scheduleRender() {
        if (this._destroyed || this._ticking) return;

        this._ticking = true;
        this._raf = requestAnimationFrame(() => {
            this._ticking = false;
            this.render();
        });
    }

    getVisibleRange() {
        const visibleCount = Math.max(
            1,
            Math.ceil(
                (this.viewportHeight || this.itemHeight) / this.itemHeight,
            ),
        );

        const start = Math.max(
            0,
            Math.floor(this.scrollTop / this.itemHeight) - this.overscan,
        );

        const end = Math.min(
            this.items.length,
            start + visibleCount + this.overscan * 2,
        );

        return { start, end, visibleCount };
    }

    render() {
        if (this._destroyed) return;

        const total = this.items.length;

        if (total === 0) {
            this.viewport.hidden = true;
            this.empty.hidden = false;
            return;
        }

        this.viewport.hidden = false;
        this.empty.hidden = true;

        const { start, end } = this.getVisibleRange();
        const offsetY = start * this.itemHeight;

        this.spacer.style.height = `${total * this.itemHeight}px`;
        this.content.style.transform = `translate3d(0, ${offsetY}px, 0)`;

        const fragment = document.createDocumentFragment();

        for (let i = start; i < end; i++) {
            const item = this.items[i];
            const key = this.keyExtractor(item, i);

            const node = this.renderItem(item, i);

            if (!(node instanceof HTMLElement)) continue;

            node.dataset.virtualKey = String(key);
            node.dataset.virtualIndex = String(i);
            node.style.height = `${this.itemHeight}px`;
            node.style.boxSizing = "border-box";

            fragment.appendChild(node);
        }

        this.content.replaceChildren(fragment);
    }

    setItems(nextItems) {
        this.items = Array.isArray(nextItems) ? nextItems : [];
        this.scrollTop = this.container.scrollTop;
        this._scheduleRender();
    }

    scrollToIndex(index, align = "start") {
        const safeIndex = Math.max(0, Math.min(index, this.items.length - 1));
        const itemTop = safeIndex * this.itemHeight;
        const itemBottom = itemTop + this.itemHeight;
        const viewportTop = this.container.scrollTop;
        const viewportBottom = viewportTop + this.container.clientHeight;

        let nextTop = itemTop;

        if (align === "center") {
            nextTop =
                itemTop - this.container.clientHeight / 2 + this.itemHeight / 2;
        } else if (align === "end") {
            nextTop = itemBottom - this.container.clientHeight;
        } else if (align === "auto") {
            if (itemTop >= viewportTop && itemBottom <= viewportBottom) {
                return;
            }
            if (itemTop < viewportTop) nextTop = itemTop;
            if (itemBottom > viewportBottom)
                nextTop = itemBottom - this.container.clientHeight;
        }

        this.container.scrollTop = Math.max(0, nextTop);
        this.scrollTop = this.container.scrollTop;
        this._scheduleRender();
    }

    getItem(index) {
        return this.items[index] ?? null;
    }

    destroy() {
        this._destroyed = true;
        this.container.removeEventListener("scroll", this._onScroll);
        window.removeEventListener("resize", this._onResize);
        if (this._raf) cancelAnimationFrame(this._raf);
        this.container.innerHTML = "";
    }
}
