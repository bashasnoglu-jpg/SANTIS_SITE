import { SantisVirtualList } from "../core/santis-virtual-list.js";
import { attachVirtualListDelegation } from "../core/santis-list-delegation.js";

export function mountAdminBookingsList({
    container,
    items,
    onOpen,
    onAcknowledge,
}) {
    let selectedIndex = -1;

    const list = new SantisVirtualList({
        container,
        items,
        itemHeight: 88,
        overscan: 8,
        emptyState: `
      <div class="santis-vlist-empty-copy">
        No bookings available.
      </div>
    `,
        keyExtractor: (item) => item.id,
        renderItem: (item, index) => {
            const row = document.createElement("div");
            row.className = `santis-row ${selectedIndex === index ? "santis-row--selected" : ""}`;
            row.dataset.rowIndex = String(index);

            row.innerHTML = `
        <div class="santis-row__primary">
          <div class="santis-row__title">${escapeHtml(item.guestName)}</div>
          <div class="santis-row__sub">${escapeHtml(item.serviceName)}</div>
        </div>

        <div class="santis-row__secondary">
          <div class="santis-row__title">${escapeHtml(item.therapistName || "Pending")}</div>
          <div class="santis-row__sub">${escapeHtml(item.dateLabel || "")}</div>
        </div>

        <div class="santis-row__meta">
          <span class="santis-row__pill">${escapeHtml(item.status || "New")}</span>
        </div>

        <div class="santis-row__actions">
          <button class="santis-row__action" data-action="open">Open</button>
        </div>
      `;

            return row;
        },
    });

    const detach = attachVirtualListDelegation(container, {
        onRowClick: ({ index }) => {
            selectedIndex = index;
            list.render();
        },
        onAction: ({ action, index }) => {
            const item = list.getItem(index);
            if (!item) return;

            selectedIndex = index;
            list.render();

            if (action === "open") {
                onOpen?.(item, index);
            }

            if (action === "ack") {
                onAcknowledge?.(item, index);
            }
        },
    });

    return {
        setItems(nextItems) {
            list.setItems(nextItems);
        },
        scrollToIndex(index, align = "auto") {
            list.scrollToIndex(index, align);
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
