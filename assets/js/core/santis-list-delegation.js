export function attachVirtualListDelegation(container, handlers = {}) {
    if (!container) throw new Error("container is required");

    const onClick = (event) => {
        const actionEl = event.target.closest("[data-action]");
        const rowEl = event.target.closest("[data-row-index]");

        if (!rowEl) return;

        const index = Number(rowEl.dataset.rowIndex);
        const action = actionEl?.dataset?.action || null;

        if (action && typeof handlers.onAction === "function") {
            handlers.onAction({
                action,
                index,
                rowEl,
                originalEvent: event,
            });
            return;
        }

        if (typeof handlers.onRowClick === "function") {
            handlers.onRowClick({
                index,
                rowEl,
                originalEvent: event,
            });
        }
    };

    container.addEventListener("click", onClick);

    return () => {
        container.removeEventListener("click", onClick);
    };
}
