import { SantisVirtualList } from "../core/santis-virtual-list.js";
import { attachVirtualListDelegation } from "../core/santis-list-delegation.js";

export function mountBoardroomIncidentFeed({
    container,
    items = [],
    onInspect,
}) {
    const list = new SantisVirtualList({
        container,
        items,
        itemHeight: 72,
        overscan: 10,
        emptyState: `<div class="santis-vlist-empty-copy">No live incidents.</div>`,
        keyExtractor: (item) => item.id,
        renderItem: (item, index) => {
            const row = document.createElement("div");
            row.className = `santis-row ${item.level === "critical" ? "santis-row--critical" : ""}`;
            row.dataset.rowIndex = String(index);

            row.innerHTML = `
        <div class="santis-row__primary">
          <div class="santis-row__title">${escapeHtml(item.title)}</div>
          <div class="santis-row__sub">${escapeHtml(item.description || "")}</div>
        </div>

        <div class="santis-row__secondary">
          <div class="santis-row__sub">${escapeHtml(item.timestampLabel || "")}</div>
        </div>

        <div class="santis-row__meta">
          <span class="santis-row__pill">${escapeHtml(item.level || "info")}</span>
        </div>

        <div class="santis-row__actions">
          <button class="santis-row__action" data-action="inspect">Inspect</button>
        </div>
      `;

            return row;
        },
    });

    const detach = attachVirtualListDelegation(container, {
        onAction: ({ action, index }) => {
            const item = list.getItem(index);
            if (!item) return;

            if (action === "inspect") {
                onInspect?.(item, index);
            }
        },
    });

    return {
        setItems(nextItems) {
            list.setItems(nextItems);
        },
        destroy() {
            detach();
            list.destroy();
        },
    };
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
