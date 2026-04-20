/**
 * SovereignDebtBoardUI.js
 * Vanilla UI binding layer for SovereignDebtEngine
 */

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function badgeClass(type, value) {
    const safe = String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-");
    return `debt-badge debt-badge--${type}-${safe}`;
}

function fmtDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
}

function renderSelectOptions(values, selected) {
    return values
        .map((value) => {
            const isSelected = value === selected ? "selected" : "";
            return `<option value="${escapeHtml(value)}" ${isSelected}>${escapeHtml(value)}</option>`;
        })
        .join("");
}

function renderCard(record, isSelected, isChecked) {
    return `
    <article class="debt-card ${isSelected ? "is-selected" : ""}" data-debt-id="${escapeHtml(record.id)}">
      <header class="debt-card__header">
        <label class="debt-card__check">
          <input type="checkbox" data-debt-select="${escapeHtml(record.id)}" ${isChecked ? "checked" : ""} />
          <span></span>
        </label>

        <div class="debt-card__title-wrap">
          <h3 class="debt-card__title">${escapeHtml(record.title)}</h3>
          <div class="debt-card__id">${escapeHtml(record.id)}</div>
        </div>

        <div class="debt-card__score">Priority ${escapeHtml(record.priorityScore)}</div>
      </header>

      <div class="debt-card__badges">
        <span class="${badgeClass("severity", record.severity)}">${escapeHtml(record.severity)}</span>
        <span class="${badgeClass("category", record.category)}">${escapeHtml(record.category)}</span>
        <span class="${badgeClass("status", record.status)}">${escapeHtml(record.status)}</span>
        <span class="${badgeClass("owner", record.owner)}">${escapeHtml(record.owner)}</span>
      </div>

      <p class="debt-card__reason">${escapeHtml(record.reason)}</p>

      <div class="debt-card__meta">
        <span>By: ${escapeHtml(record.discoveredBy)}</span>
        <span>Created: ${escapeHtml(fmtDate(record.createdAt))}</span>
      </div>
    </article>
  `;
}

function renderDetail(record) {
    if (!record) {
        return `
      <section class="debt-detail debt-detail--empty">
        <div class="debt-empty-state">
          <h3>No debt selected</h3>
          <p>Select a record to inspect evidence, impact, and next action.</p>
        </div>
      </section>
    `;
    }

    const statusValues = [
        "OPEN",
        "IN_PROGRESS",
        "BLOCKED",
        "RESOLVED",
        "ACCEPTED",
    ];
    const ownerValues = [
        "Frontend",
        "Backend",
        "Design",
        "Infra",
        "Shared",
        "Unassigned",
    ];

    const evidence =
        Array.isArray(record.evidence) && record.evidence.length
            ? record.evidence.map((x) => `<li>${escapeHtml(x)}</li>`).join("")
            : "<li>No evidence attached</li>";

    const scope =
        Array.isArray(record.scope) && record.scope.length
            ? record.scope
                  .map((x) => `<span class="debt-chip">${escapeHtml(x)}</span>`)
                  .join("")
            : '<span class="debt-chip">none</span>';

    return `
    <section class="debt-detail" data-debt-detail-id="${escapeHtml(record.id)}">
      <header class="debt-detail__header">
        <div>
          <div class="debt-detail__eyebrow">${escapeHtml(record.id)}</div>
          <h2 class="debt-detail__title">${escapeHtml(record.title)}</h2>
        </div>
        <div class="debt-detail__score">Priority ${escapeHtml(record.priorityScore)}</div>
      </header>

      <div class="debt-detail__badges">
        <span class="${badgeClass("severity", record.severity)}">${escapeHtml(record.severity)}</span>
        <span class="${badgeClass("category", record.category)}">${escapeHtml(record.category)}</span>
        <span class="${badgeClass("status", record.status)}">${escapeHtml(record.status)}</span>
        <span class="${badgeClass("owner", record.owner)}">${escapeHtml(record.owner)}</span>
      </div>

      <section class="debt-panel">
        <h3>Actions</h3>

        <div class="debt-inline-form">
          <label class="debt-inline-field">
            <span>Status</span>
            <select data-debt-inline="status" data-debt-id="${escapeHtml(record.id)}">
              ${renderSelectOptions(statusValues, record.status)}
            </select>
          </label>

          <label class="debt-inline-field">
            <span>Owner</span>
            <select data-debt-inline="owner" data-debt-id="${escapeHtml(record.id)}">
              ${renderSelectOptions(ownerValues, record.owner)}
            </select>
          </label>
        </div>

        <div class="debt-priority-editor">
          <label class="debt-inline-field">
            <span>Priority Score</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value="${escapeHtml(record.priorityScore)}"
              data-debt-inline="priorityScore"
              data-debt-id="${escapeHtml(record.id)}"
            />
          </label>
          <div class="debt-priority-value">Current: <strong>${escapeHtml(record.priorityScore)}</strong></div>
        </div>
      </section>

      <div class="debt-detail__grid">
        <section class="debt-panel">
          <h3>Reason</h3>
          <p>${escapeHtml(record.reason)}</p>
        </section>

        <section class="debt-panel">
          <h3>Impact</h3>
          <p>${escapeHtml(record.impact)}</p>
        </section>

        <section class="debt-panel">
          <h3>Next Action</h3>
          <p>${escapeHtml(record.nextAction)}</p>
        </section>

        <section class="debt-panel">
          <h3>Evidence</h3>
          <ul class="debt-list">
            ${evidence}
          </ul>
        </section>
      </div>

      <section class="debt-panel">
        <h3>Scope</h3>
        <div class="debt-chip-row">${scope}</div>
      </section>

      <section class="debt-panel">
        <h3>Lifecycle</h3>
        <div class="debt-kv">
          <div><strong>Created:</strong> ${escapeHtml(fmtDate(record.createdAt))}</div>
          <div><strong>Resolved:</strong> ${escapeHtml(fmtDate(record.resolvedAt))}</div>
          <div><strong>Discovered By:</strong> ${escapeHtml(record.discoveredBy)}</div>
        </div>
      </section>
    </section>
  `;
}

function uniqueValues(records, key) {
    return [...new Set(records.map((x) => x[key]).filter(Boolean))].sort();
}

function uniqueScope(records) {
    return [
        ...new Set(
            records.flatMap((x) => (Array.isArray(x.scope) ? x.scope : [])),
        ),
    ].sort();
}

function renderOptions(values, label = "All") {
    return [`<option value="">${escapeHtml(label)}</option>`]
        .concat(
            values.map(
                (v) =>
                    `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`,
            ),
        )
        .join("");
}

function renderAuditChanges(changes) {
    if (!Array.isArray(changes) || !changes.length) {
        return `<div class="debt-audit__nochange">No field-level diff</div>`;
    }

    return `
    <div class="debt-audit__changes">
      ${changes
          .map(
              (change) => `
            <div class="debt-audit__change">
              <div class="debt-audit__field">${escapeHtml(change.field)}</div>
              <div class="debt-audit__diff">
                <span class="debt-audit__before">${escapeHtml(change.before ?? "null")}</span>
                <span class="debt-audit__arrow">→</span>
                <span class="debt-audit__after">${escapeHtml(change.after ?? "null")}</span>
              </div>
            </div>
          `,
          )
          .join("")}
    </div>
  `;
}

function renderAuditEvent(event) {
    return `
    <article class="debt-audit-event">
      <header class="debt-audit-event__header">
        <div>
          <div class="debt-audit-event__type">${escapeHtml(event.type)}</div>
          <div class="debt-audit-event__summary">${escapeHtml(event.summary)}</div>
        </div>
        <div class="debt-audit-event__at">${escapeHtml(fmtDate(event.at))}</div>
      </header>

      <div class="debt-audit-event__meta">
        <span>Actor: ${escapeHtml(event.actor)}</span>
        <span>Records: ${escapeHtml((event.recordIds || []).join(", ") || "—")}</span>
      </div>

      ${renderAuditChanges(event.changes)}
    </article>
  `;
}

export function createSovereignDebtBoardUI(engine, options = {}) {
    if (!engine) {
        throw new Error(
            "SovereignDebtBoardUI requires a SovereignDebtEngine instance",
        );
    }

    const root = options.root || document.querySelector("[data-debt-board]");
    if (!root) {
        throw new Error("Debt Board root not found");
    }

    const els = {
        toolbar: root.querySelector("[data-debt-toolbar]"),
        list: root.querySelector("[data-debt-list]"),
        detail: root.querySelector("[data-debt-detail]"),
        stats: root.querySelector("[data-debt-stats]"),
        search: root.querySelector('[data-debt-filter="query"]'),
        severity: root.querySelector('[data-debt-filter="severity"]'),
        category: root.querySelector('[data-debt-filter="category"]'),
        status: root.querySelector('[data-debt-filter="status"]'),
        owner: root.querySelector('[data-debt-filter="owner"]'),
        scope: root.querySelector('[data-debt-filter="scope"]'),
        clear: root.querySelector('[data-debt-action="clear-filters"]'),
        undo: root.querySelector('[data-debt-action="undo"]'),
        redo: root.querySelector('[data-debt-action="redo"]'),
        storageReset: root.querySelector('[data-debt-action="reset-storage"]'),
        bulkStatus: root.querySelector('[data-debt-bulk="status"]'),
        bulkOwner: root.querySelector('[data-debt-bulk="owner"]'),
        bulkApply: root.querySelector('[data-debt-action="apply-bulk"]'),
        bulkSelectVisible: root.querySelector(
            '[data-debt-action="select-visible"]',
        ),
        bulkClearSelection: root.querySelector(
            '[data-debt-action="clear-selection"]',
        ),
        exportJson: root.querySelector('[data-debt-action="export-json"]'),
        importJson: root.querySelector('[data-debt-action="import-json"]'),
        importFile: root.querySelector("[data-debt-import-file]"),
        auditStats: root.querySelector("[data-debt-audit-stats]"),
        auditTimeline: root.querySelector("[data-debt-audit-timeline]"),
        recordTimeline: root.querySelector("[data-debt-record-timeline]"),
    };

    let unsubscribe = null;

    function renderStats(state) {
        if (!els.stats) return;
        const total = state.records.length;
        const visible = state.visibleRecords.length;
        const p1 = state.records.filter((x) => x.severity === "P1").length;
        const open = state.records.filter((x) => x.status === "OPEN").length;
        const selected = (state.selectedIds || []).length;
        const auditCount = (state.auditLog || []).length;

        els.stats.innerHTML = `
      <div class="debt-stat"><strong>${total}</strong><span>Total</span></div>
      <div class="debt-stat"><strong>${visible}</strong><span>Visible</span></div>
      <div class="debt-stat"><strong>${selected}</strong><span>Selected</span></div>
      <div class="debt-stat"><strong>${p1}</strong><span>P1</span></div>
      <div class="debt-stat"><strong>${open}</strong><span>Open</span></div>
      <div class="debt-stat"><strong>${auditCount}</strong><span>Audit Events</span></div>
      <div class="debt-stat"><strong>${state.snapshotMeta.count}</strong><span>Snapshots</span></div>
    `;
    }

    function renderFilters(state) {
        const records = state.records;

        if (els.severity) {
            els.severity.innerHTML = renderOptions(
                uniqueValues(records, "severity"),
            );
            els.severity.value = state.filters.severity || "";
        }
        if (els.category) {
            els.category.innerHTML = renderOptions(
                uniqueValues(records, "category"),
            );
            els.category.value = state.filters.category || "";
        }
        if (els.status) {
            els.status.innerHTML = renderOptions(
                uniqueValues(records, "status"),
            );
            els.status.value = state.filters.status || "";
        }
        if (els.owner) {
            els.owner.innerHTML = renderOptions(uniqueValues(records, "owner"));
            els.owner.value = state.filters.owner || "";
        }
        if (els.scope) {
            els.scope.innerHTML = renderOptions(uniqueScope(records));
            els.scope.value = state.filters.scope || "";
        }
        if (els.search) {
            els.search.value = state.filters.query || "";
        }
    }

    function renderList(state) {
        if (!els.list) return;

        if (!state.visibleRecords.length) {
            els.list.innerHTML = `
        <div class="debt-empty-state">
          <h3>No matching debt records</h3>
          <p>Adjust filters or clear the search query.</p>
        </div>
      `;
            return;
        }

        const checked = new Set(state.selectedIds || []);

        els.list.innerHTML = state.visibleRecords
            .map((record) =>
                renderCard(
                    record,
                    state.selectedRecord?.id === record.id,
                    checked.has(record.id),
                ),
            )
            .join("");
    }

    function renderDetailPanel(state) {
        if (!els.detail) return;
        els.detail.innerHTML = renderDetail(state.selectedRecord);
    }

    function renderAuditPanels(state) {
        const fullAudit = [...(state.auditLog || [])].reverse();
        const recordAudit = state.selectedRecord
            ? fullAudit.filter((event) =>
                  (event.recordIds || []).includes(state.selectedRecord.id),
              )
            : [];

        if (els.auditStats) {
            els.auditStats.innerHTML = `
        <div class="debt-stat"><strong>${fullAudit.length}</strong><span>Total Events</span></div>
        <div class="debt-stat"><strong>${recordAudit.length}</strong><span>Selected Record Events</span></div>
      `;
        }

        if (els.auditTimeline) {
            els.auditTimeline.innerHTML = fullAudit.length
                ? fullAudit.slice(0, 20).map(renderAuditEvent).join("")
                : `<div class="debt-empty-state"><h3>No audit events</h3><p>Actions will appear here.</p></div>`;
        }

        if (els.recordTimeline) {
            els.recordTimeline.innerHTML = recordAudit.length
                ? recordAudit.slice(0, 20).map(renderAuditEvent).join("")
                : `<div class="debt-empty-state"><h3>No record history</h3><p>Select a record and edit it to see diffs.</p></div>`;
        }
    }

    function render(state) {
        renderStats(state);
        renderFilters(state);
        renderList(state);
        renderDetailPanel(state);
        renderAuditPanels(state);
    }

    function bindEvents() {
        if (els.list) {
            els.list.addEventListener("click", (event) => {
                const checkbox = event.target.closest("[data-debt-select]");
                if (checkbox) return;

                const card = event.target.closest("[data-debt-id]");
                if (!card) return;
                engine.selectRecord(card.dataset.debtId, { type: "ui:select" });
            });

            els.list.addEventListener("change", (event) => {
                const checkbox = event.target.closest("[data-debt-select]");
                if (!checkbox) return;

                engine.toggleSelectedId(checkbox.dataset.debtSelect, {
                    type: "ui:toggle-selection",
                });
            });
        }

        if (els.detail) {
            els.detail.addEventListener("change", (event) => {
                const select = event.target.closest("[data-debt-inline]");
                if (!select) return;

                const recordId = select.dataset.debtId;
                const field = select.dataset.debtInline;
                const value = select.value;

                if (!recordId || !field) return;

                if (field === "status") {
                    engine.updateRecord(
                        recordId,
                        { status: value },
                        { type: "ui:inline-status" },
                    );
                }

                if (field === "owner") {
                    engine.updateRecord(
                        recordId,
                        { owner: value },
                        { type: "ui:inline-owner" },
                    );
                }

                if (field === "priorityScore") {
                    engine.setPriorityScore(recordId, Number(value), {
                        type: "ui:inline-priority",
                    });
                }
            });

            // Real-time listener for the input range so the number updates immediately
            els.detail.addEventListener("input", (event) => {
                const input = event.target.closest(
                    '[data-debt-inline="priorityScore"]',
                );
                if (!input) return;
                const parent = input.closest(".debt-priority-editor");
                if (parent) {
                    const valueLabel = parent.querySelector(
                        ".debt-priority-value strong",
                    );
                    if (valueLabel) valueLabel.textContent = input.value;
                }
            });
        }

        const filterMap = [
            ["query", els.search],
            ["severity", els.severity],
            ["category", els.category],
            ["status", els.status],
            ["owner", els.owner],
            ["scope", els.scope],
        ];

        filterMap.forEach(([key, el]) => {
            if (!el) return;
            const evt = key === "query" ? "input" : "change";
            el.addEventListener(evt, () => {
                engine.setFilter(
                    key,
                    el.value || (key === "query" ? "" : null),
                    { type: "ui:filter", key },
                );
            });
        });

        if (els.clear) {
            els.clear.addEventListener("click", () => {
                engine.clearFilters({ type: "ui:clear-filters" });
            });
        }

        if (els.undo) {
            els.undo.addEventListener("click", () => {
                engine.undo();
            });
        }

        if (els.redo) {
            els.redo.addEventListener("click", () => {
                engine.redo();
            });
        }

        if (els.storageReset) {
            els.storageReset.addEventListener("click", async () => {
                engine.clearStorage();
                location.reload();
            });
        }

        // Bulk Selection Handlers
        if (els.bulkSelectVisible) {
            els.bulkSelectVisible.addEventListener("click", () => {
                engine.selectAllVisible({ type: "ui:bulk-select-visible" });
            });
        }

        if (els.bulkClearSelection) {
            els.bulkClearSelection.addEventListener("click", () => {
                engine.clearSelectedIds({ type: "ui:bulk-clear-selection" });
            });
        }

        if (els.bulkApply) {
            els.bulkApply.addEventListener("click", () => {
                const ids = engine.getSelectedIds();
                if (!ids.length) return;

                const patch = {};
                if (els.bulkStatus?.value) patch.status = els.bulkStatus.value;
                if (els.bulkOwner?.value) patch.owner = els.bulkOwner.value;

                if (!Object.keys(patch).length) return;

                engine.bulkUpdateRecords(ids, patch, { type: "ui:bulk-apply" });

                // Reset the bulk select fields after applying
                if (els.bulkStatus) els.bulkStatus.value = "";
                if (els.bulkOwner) els.bulkOwner.value = "";
            });
        }

        // JSON Export / Import Handlers
        if (els.exportJson) {
            els.exportJson.addEventListener("click", () => {
                const blob = new Blob([engine.exportJson(true)], {
                    type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "santis-debt-board-export.json";
                a.click();
                URL.revokeObjectURL(url);
            });
        }

        if (els.importJson && els.importFile) {
            els.importJson.addEventListener("click", () => {
                els.importFile.click();
            });

            els.importFile.addEventListener("change", async () => {
                const file = els.importFile.files?.[0];
                if (!file) return;

                const text = await file.text();
                engine.importJson(text, { type: "ui:import-file" });
                els.importFile.value = "";
            });
        }
    }

    function mount() {
        bindEvents();
        unsubscribe = engine.subscribe(render);
        render(engine.getPublicState());
    }

    function destroy() {
        if (unsubscribe) unsubscribe();
    }

    return {
        mount,
        destroy,
        render: () => render(engine.getPublicState()),
    };
}
