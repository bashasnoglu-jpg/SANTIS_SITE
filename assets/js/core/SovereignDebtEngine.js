/**
 * SovereignDebtEngine.js
 * Santis OS - Governance Hardening Core
 * Serializable, Time-Travel friendly, auto-capturing debt engine.
 */

const DEFAULT_SEED_URL = "/assets/json/debt-seed.json";
const DEFAULT_STORAGE_KEY = "santis:debt-board:v1";
const MAX_SNAPSHOTS = 50;
const MAX_EVIDENCE_ITEMS = 10;
const MAX_SCOPE_ITEMS = 10;
const MAX_AUDIT_EVENTS = 200;

const VALID_SEVERITIES = new Set(["P1", "P2", "P3", "P4"]);
const VALID_CATEGORIES = new Set([
    "Architecture",
    "Hygiene",
    "Dependency",
    "UI/UX",
    "Performance",
    "Security",
    "Runtime",
]);
const VALID_STATUSES = new Set([
    "OPEN",
    "IN_PROGRESS",
    "BLOCKED",
    "RESOLVED",
    "ACCEPTED",
]);
const VALID_OWNERS = new Set([
    "Frontend",
    "Backend",
    "Design",
    "Infra",
    "Shared",
    "Unassigned",
]);

function isoNow() {
    return new Date().toISOString();
}

function safeString(value, fallback = "") {
    if (value === null || value === undefined) return fallback;
    return String(value);
}

function safeArray(value, max = 50) {
    if (!Array.isArray(value)) return [];
    return value
        .slice(0, max)
        .map((x) => safeString(x))
        .filter(Boolean);
}

function clampPriorityScore(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeSeverity(value) {
    return VALID_SEVERITIES.has(value) ? value : "P4";
}

function normalizeCategory(value) {
    return VALID_CATEGORIES.has(value) ? value : "Hygiene";
}

function normalizeStatus(value) {
    return VALID_STATUSES.has(value) ? value : "OPEN";
}

function normalizeOwner(value) {
    return VALID_OWNERS.has(value) ? value : "Unassigned";
}

function generateDebtId(prefix = "DEBT") {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${Date.now()}-${rand}`;
}

function normalizeDebtRecord(record) {
    const normalized = {
        id: safeString(record?.id, generateDebtId()),
        title: safeString(record?.title, "Untitled Debt"),
        category: normalizeCategory(record?.category),
        severity: normalizeSeverity(record?.severity),
        status: normalizeStatus(record?.status),
        owner: normalizeOwner(record?.owner),
        reason: safeString(record?.reason),
        impact: safeString(record?.impact),
        nextAction: safeString(record?.nextAction),
        evidence: safeArray(record?.evidence, MAX_EVIDENCE_ITEMS),
        scope: safeArray(record?.scope, MAX_SCOPE_ITEMS),
        createdAt: safeString(record?.createdAt, isoNow()),
        resolvedAt: record?.resolvedAt ?? null,
        discoveredBy: safeString(record?.discoveredBy, "Unknown"),
        priorityScore: clampPriorityScore(record?.priorityScore),
    };

    if (!normalized.reason) normalized.reason = "No reason provided";
    if (!normalized.impact) normalized.impact = "Impact not specified";
    if (!normalized.nextAction)
        normalized.nextAction = "Triaged but next action not specified";

    return normalized;
}

function compareDebtRecords(a, b) {
    if (b.priorityScore !== a.priorityScore)
        return b.priorityScore - a.priorityScore;

    const severityRank = { P1: 4, P2: 3, P3: 2, P4: 1 };
    if (severityRank[b.severity] !== severityRank[a.severity]) {
        return severityRank[b.severity] - severityRank[a.severity];
    }

    return String(a.createdAt).localeCompare(String(b.createdAt));
}

function deepCloneSerializable(value) {
    return JSON.parse(JSON.stringify(value));
}

function createInitialState() {
    return {
        records: [],
        filters: {
            severity: null,
            category: null,
            status: null,
            owner: null,
            scope: null,
            query: "",
        },
        selectedId: null,
        selectedIds: [],
        auditLog: [],
        meta: {
            seedLoaded: false,
            seedUrl: null,
            hydrationSource: "init",
            lastUpdatedAt: isoNow(),
            version: "1.2.0",
        },
    };
}

function computeVisibleRecords(state) {
    const { records, filters } = state;

    return records.filter((r) => {
        if (filters.severity && r.severity !== filters.severity) return false;
        if (filters.category && r.category !== filters.category) return false;
        if (filters.status && r.status !== filters.status) return false;
        if (filters.owner && r.owner !== filters.owner) return false;
        if (filters.scope && !r.scope.includes(filters.scope)) return false;

        if (filters.query) {
            const haystack = [
                r.id,
                r.title,
                r.category,
                r.severity,
                r.status,
                r.owner,
                r.reason,
                r.impact,
                r.nextAction,
                ...r.evidence,
                ...r.scope,
            ]
                .join(" ")
                .toLowerCase();

            if (!haystack.includes(filters.query.toLowerCase())) return false;
        }

        return true;
    });
}

function summarizeValue(value) {
    if (value === null || value === undefined) return null;
    if (Array.isArray(value)) return JSON.stringify(value);
    if (typeof value === "object") return JSON.stringify(value);
    return value;
}

function buildDiff(before, after, fields) {
    const keys =
        Array.isArray(fields) && fields.length
            ? fields
            : [
                  ...new Set([
                      ...Object.keys(before || {}),
                      ...Object.keys(after || {}),
                  ]),
              ];

    const changes = [];

    keys.forEach((field) => {
        const prev = summarizeValue(before?.[field]);
        const next = summarizeValue(after?.[field]);

        if (JSON.stringify(prev) !== JSON.stringify(next)) {
            changes.push({
                field,
                before: prev,
                after: next,
            });
        }
    });

    return changes;
}

function generateAuditId(prefix = "AUDIT") {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${Date.now()}-${rand}`;
}

export function createSovereignDebtEngine(options = {}) {
    const seedUrl = options.seedUrl || DEFAULT_SEED_URL;
    const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
    const snapshotLimit = Number.isFinite(options.snapshotLimit)
        ? Math.max(1, options.snapshotLimit)
        : MAX_SNAPSHOTS;

    /**
     * Sovereign Debt Engine - Temporal Kernel Memory Optimizer
     * DEBT-016: State Snapshot Hafıza Sınırı Yönetimi
     */
    class StateMemoryManager {
        constructor(limit = 50) {
            this.history = [];
            this.limit = limit;
            this.timeIndex = -1;
            this.version = 0;
        }

        #stableHash(value) {
            try {
                return JSON.stringify(value);
            } catch {
                return String(Date.now());
            }
        }

        push(state, meta) {
            const nextHash = this.#stableHash(state);
            const current = this.history[this.timeIndex];
            const currentHash = current?.meta?.hash ?? null;

            // Duplicate snapshot koruması (Gizli memory leak engeli)
            if (currentHash === nextHash) {
                return current;
            }

            const snapshot = {
                state: deepCloneSerializable(state),
                meta: { at: isoNow(), hash: nextHash, ...meta },
            };

            // Eğer Time-Travel ile geçmişe dönülmüşken yeni işlem yapılırsa,
            // gelecekteki alternatif timeline'ı (ghost state) kesip atarız.
            if (this.timeIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.timeIndex + 1);
            }

            this.history.push(snapshot);

            let trimmed = 0;
            if (this.history.length > this.limit) {
                trimmed = this.history.length - this.limit;
                this.history.splice(0, trimmed);
            }

            this.timeIndex = this.history.length - 1;
            this.version++;

            if (trimmed > 0) {
                console.debug("[DEBT-016] Snapshot history trimmed", {
                    trimmed,
                    limit: this.limit,
                    size: this.history.length,
                });
            }

            return snapshot;
        }

        undo(currentState) {
            if (this.timeIndex > 0) {
                this.timeIndex--;
                this.version++;
                return deepCloneSerializable(
                    this.history[this.timeIndex].state,
                );
            }
            return currentState;
        }

        redo(currentState) {
            if (this.timeIndex < this.history.length - 1) {
                this.timeIndex++;
                this.version++;
                return deepCloneSerializable(
                    this.history[this.timeIndex].state,
                );
            }
            return currentState;
        }

        get currentSnapshots() {
            return this.history;
        }
    }

    let state = createInitialState();
    const subscribers = new Set();
    const memoryManager = new StateMemoryManager(snapshotLimit);

    function appendAuditEvent(event) {
        const normalized = {
            id: safeString(event?.id, generateAuditId()),
            at: safeString(event?.at, isoNow()),
            type: safeString(event?.type, "unknown"),
            actor: safeString(event?.actor, "Sovereign Operator"),
            recordIds: Array.isArray(event?.recordIds)
                ? event.recordIds.map((x) => safeString(x)).filter(Boolean)
                : [],
            summary: safeString(event?.summary, "No summary"),
            changes: Array.isArray(event?.changes)
                ? event.changes.map((c) => ({
                      field: safeString(c?.field),
                      before: c?.before ?? null,
                      after: c?.after ?? null,
                  }))
                : [],
        };

        const nextAuditLog = [...(state.auditLog || []), normalized].slice(
            -MAX_AUDIT_EVENTS,
        );

        state = {
            ...state,
            auditLog: nextAuditLog,
        };

        return normalized;
    }

    function getAuditLog() {
        return deepCloneSerializable(state.auditLog || []);
    }

    function getRecordHistory(id) {
        return deepCloneSerializable(
            (state.auditLog || []).filter(
                (event) =>
                    Array.isArray(event.recordIds) &&
                    event.recordIds.includes(id),
            ),
        );
    }

    let originalConsoleWarn = null;
    let originalConsoleError = null;
    let consoleTrapInstalled = false;
    let globalErrorInstalled = false;
    let rejectionInstalled = false;

    function exportCoreState() {
        return {
            records: deepCloneSerializable(state.records),
            filters: deepCloneSerializable(state.filters),
            selectedId: state.selectedId,
            selectedIds: deepCloneSerializable(state.selectedIds || []),
            auditLog: deepCloneSerializable(state.auditLog || []),
            meta: {
                seedLoaded: Boolean(state.meta.seedLoaded),
                seedUrl: state.meta.seedUrl || null,
                hydrationSource: state.meta.hydrationSource || "runtime",
                lastUpdatedAt: state.meta.lastUpdatedAt || isoNow(),
                version: state.meta.version || "1.2.0",
            },
        };
    }

    function saveToStorage() {
        try {
            const payload = exportCoreState();
            localStorage.setItem(storageKey, JSON.stringify(payload));
            return true;
        } catch (err) {
            if (originalConsoleError) {
                originalConsoleError(
                    "[SovereignDebtEngine] saveToStorage failed",
                    err,
                );
            }
            return false;
        }
    }

    function loadFromStorage() {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            const records = Array.isArray(parsed?.records)
                ? parsed.records
                      .map(normalizeDebtRecord)
                      .sort(compareDebtRecords)
                : [];

            const filters = {
                severity: parsed?.filters?.severity ?? null,
                category: parsed?.filters?.category ?? null,
                status: parsed?.filters?.status ?? null,
                owner: parsed?.filters?.owner ?? null,
                scope: parsed?.filters?.scope ?? null,
                query: safeString(parsed?.filters?.query, ""),
            };

            const hydrated = {
                records,
                filters,
                selectedId: parsed?.selectedId ?? null,
                selectedIds: Array.isArray(parsed?.selectedIds)
                    ? parsed.selectedIds
                          .map((x) => safeString(x))
                          .filter(Boolean)
                    : [],
                auditLog: Array.isArray(parsed?.auditLog)
                    ? parsed.auditLog.slice(-MAX_AUDIT_EVENTS).map((event) => ({
                          id: safeString(event?.id, generateAuditId()),
                          at: safeString(event?.at, isoNow()),
                          type: safeString(event?.type, "unknown"),
                          actor: safeString(event?.actor, "Sovereign Operator"),
                          recordIds: Array.isArray(event?.recordIds)
                              ? event.recordIds
                                    .map((x) => safeString(x))
                                    .filter(Boolean)
                              : [],
                          summary: safeString(event?.summary, "No summary"),
                          changes: Array.isArray(event?.changes)
                              ? event.changes.map((c) => ({
                                    field: safeString(c?.field),
                                    before: c?.before ?? null,
                                    after: c?.after ?? null,
                                }))
                              : [],
                      }))
                    : [],
                meta: {
                    seedLoaded: Boolean(parsed?.meta?.seedLoaded),
                    seedUrl: parsed?.meta?.seedUrl ?? null,
                    hydrationSource: "storage",
                    lastUpdatedAt: safeString(
                        parsed?.meta?.lastUpdatedAt,
                        isoNow(),
                    ),
                    version: safeString(parsed?.meta?.version, "1.2.0"),
                },
            };

            return hydrated;
        } catch (err) {
            if (originalConsoleError) {
                originalConsoleError(
                    "[SovereignDebtEngine] loadFromStorage failed",
                    err,
                );
            }
            return null;
        }
    }

    function clearStorage() {
        try {
            localStorage.removeItem(storageKey);
            return true;
        } catch {
            return false;
        }
    }

    function pushSnapshot(nextState, meta = {}) {
        memoryManager.push(nextState, meta);
    }

    function emit() {
        const payload = api.getPublicState();
        subscribers.forEach((fn) => {
            try {
                fn(payload);
            } catch (err) {
                if (originalConsoleError) {
                    originalConsoleError(
                        "[SovereignDebtEngine] subscriber failed",
                        err,
                    );
                }
            }
        });
    }

    function commit(nextState, meta = {}) {
        state = {
            ...nextState,
            meta: {
                ...nextState.meta,
                lastUpdatedAt: isoNow(),
            },
        };

        pushSnapshot(state, meta);
        saveToStorage();
        emit();
    }

    function hydrateState(nextState, meta = {}) {
        state = {
            ...createInitialState(),
            ...nextState,
            meta: {
                ...createInitialState().meta,
                ...nextState.meta,
                lastUpdatedAt: isoNow(),
            },
        };

        snapshots.length = 0;
        timeIndex = -1;

        if (meta.audit) {
            const nextAuditLog = [...(state.auditLog || []), meta.audit].slice(
                -MAX_AUDIT_EVENTS,
            );
            state.auditLog = nextAuditLog;
        }

        pushSnapshot(state, meta);
        saveToStorage();
        emit();
    }

    function setRecords(records, meta = {}) {
        const normalized = records
            .map(normalizeDebtRecord)
            .sort(compareDebtRecords);

        commit(
            {
                ...state,
                records: normalized,
            },
            meta,
        );
    }

    function upsertRecord(record, meta = {}) {
        const normalized = normalizeDebtRecord(record);
        const existingIndex = state.records.findIndex(
            (r) => r.id === normalized.id,
        );

        let nextRecords;
        if (existingIndex === -1) {
            nextRecords = [...state.records, normalized];
        } else {
            nextRecords = state.records.map((r, i) =>
                i === existingIndex ? { ...r, ...normalized } : r,
            );
        }

        nextRecords.sort(compareDebtRecords);

        commit(
            {
                ...state,
                records: nextRecords,
            },
            meta,
        );

        return normalized;
    }

    function updateRecord(id, patch, meta = {}) {
        const current = state.records.find((r) => r.id === id);
        if (!current) return null;

        const merged = normalizeDebtRecord({
            ...current,
            ...patch,
            id: current.id,
            createdAt: current.createdAt,
        });

        if (merged.status === "RESOLVED" && !merged.resolvedAt) {
            merged.resolvedAt = isoNow();
        }

        if (merged.status !== "RESOLVED") {
            merged.resolvedAt = null;
        }

        const changes = buildDiff(current, merged, [
            "status",
            "owner",
            "priorityScore",
            "title",
            "category",
            "severity",
            "reason",
            "impact",
            "nextAction",
            "resolvedAt",
        ]);

        const updated = upsertRecord(merged, meta);

        if (changes.length) {
            appendAuditEvent({
                type: safeString(meta?.type, "record:update"),
                actor: safeString(meta?.actor, "Sovereign Operator"),
                recordIds: [id],
                summary: `Updated ${id}`,
                changes,
            });
            saveToStorage();
            emit();
        }

        return updated;
    }

    function setPriorityScore(id, value, meta = {}) {
        return updateRecord(
            id,
            { priorityScore: clampPriorityScore(value) },
            { type: "ui:priority", ...meta },
        );
    }

    function getSelectedIds() {
        return state.selectedIds ? [...state.selectedIds] : [];
    }

    function toggleSelectedId(id, meta = {}) {
        const current = new Set(state.selectedIds || []);
        if (current.has(id)) {
            current.delete(id);
        } else {
            current.add(id);
        }

        commit(
            {
                ...state,
                selectedIds: [...current],
            },
            { type: "selection:toggle", ...meta },
        );
    }

    function clearSelectedIds(meta = {}) {
        commit(
            {
                ...state,
                selectedIds: [],
            },
            { type: "selection:clear", ...meta },
        );
    }

    function selectAllVisible(meta = {}) {
        const visibleIds = computeVisibleRecords(state).map((r) => r.id);

        commit(
            {
                ...state,
                selectedIds: visibleIds,
            },
            { type: "selection:all-visible", ...meta },
        );
    }

    function bulkUpdateRecords(ids, patch, meta = {}) {
        const idSet = new Set(ids || []);
        if (!idSet.size) return 0;

        let changed = 0;
        const aggregateChanges = [];

        const nextRecords = state.records.map((record) => {
            if (!idSet.has(record.id)) return record;

            const merged = normalizeDebtRecord({
                ...record,
                ...patch,
                id: record.id,
                createdAt: record.createdAt,
            });

            if (merged.status === "RESOLVED" && !merged.resolvedAt) {
                merged.resolvedAt = isoNow();
            }

            if (merged.status !== "RESOLVED") {
                merged.resolvedAt = null;
            }

            const diff = buildDiff(record, merged, [
                "status",
                "owner",
                "priorityScore",
                "resolvedAt",
            ]);

            if (diff.length) {
                changed += 1;
                aggregateChanges.push(...diff);
                return merged;
            }

            return record;
        });

        nextRecords.sort(compareDebtRecords);

        commit(
            {
                ...state,
                records: nextRecords,
            },
            { type: "records:bulk-update", ...meta },
        );

        if (changed > 0) {
            const dedupedChanges = [];
            const seen = new Set();

            aggregateChanges.forEach((change) => {
                const key = `${change.field}:${JSON.stringify(change.before)}:${JSON.stringify(change.after)}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    dedupedChanges.push(change);
                }
            });

            appendAuditEvent({
                type: safeString(meta?.type, "records:bulk-update"),
                actor: safeString(meta?.actor, "Sovereign Operator"),
                recordIds: [...idSet],
                summary: `Bulk-updated ${changed} records`,
                changes: dedupedChanges,
            });
            saveToStorage();
            emit();
        }

        return changed;
    }

    function exportJson(pretty = true) {
        const payload = exportCoreState();
        return JSON.stringify(payload, null, pretty ? 2 : 0);
    }

    function importJson(raw, meta = {}) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

        const imported = {
            records: Array.isArray(parsed?.records)
                ? parsed.records
                      .map(normalizeDebtRecord)
                      .sort(compareDebtRecords)
                : [],
            filters: {
                severity: parsed?.filters?.severity ?? null,
                category: parsed?.filters?.category ?? null,
                status: parsed?.filters?.status ?? null,
                owner: parsed?.filters?.owner ?? null,
                scope: parsed?.filters?.scope ?? null,
                query: safeString(parsed?.filters?.query, ""),
            },
            selectedId: parsed?.selectedId ?? null,
            selectedIds: Array.isArray(parsed?.selectedIds)
                ? parsed.selectedIds.map((x) => safeString(x)).filter(Boolean)
                : [],
            auditLog: Array.isArray(parsed?.auditLog)
                ? parsed.auditLog.slice(-MAX_AUDIT_EVENTS)
                : [],
            meta: {
                seedLoaded: Boolean(parsed?.meta?.seedLoaded),
                seedUrl: parsed?.meta?.seedUrl ?? null,
                hydrationSource: "import",
                lastUpdatedAt: isoNow(),
                version: safeString(parsed?.meta?.version, "1.2.0"),
            },
        };

        hydrateState(imported, {
            type: "import:json",
            ...meta,
            audit: {
                id: generateAuditId(),
                at: isoNow(),
                type: safeString(meta?.type, "import:json"),
                actor: safeString(meta?.actor, "Sovereign Operator"),
                recordIds: imported.records.map((r) => r.id),
                summary: `Imported ${imported.records.length} records from JSON`,
                changes: [],
            },
        });

        return imported;
    }

    function removeRecord(id, meta = {}) {
        const nextSelectedIds = (state.selectedIds || []).filter(
            (x) => x !== id,
        );
        const nextRecords = state.records.filter((r) => r.id !== id);

        commit(
            {
                ...state,
                records: nextRecords,
                selectedId: state.selectedId === id ? null : state.selectedId,
                selectedIds: nextSelectedIds,
            },
            meta,
        );
    }

    function setFilter(key, value, meta = {}) {
        if (!(key in state.filters)) return;

        commit(
            {
                ...state,
                filters: {
                    ...state.filters,
                    [key]: value,
                },
            },
            meta,
        );
    }

    function clearFilters(meta = {}) {
        commit(
            {
                ...state,
                filters: {
                    severity: null,
                    category: null,
                    status: null,
                    owner: null,
                    scope: null,
                    query: "",
                },
            },
            meta,
        );
    }

    function selectRecord(id, meta = {}) {
        commit(
            {
                ...state,
                selectedId: id,
            },
            meta,
        );
    }

    function undo() {
        const nextState = memoryManager.undo(state);
        if (nextState !== state) {
            state = nextState;
            saveToStorage();
            emit();
            return true;
        }
        return false;
    }

    function redo() {
        const nextState = memoryManager.redo(state);
        if (nextState !== state) {
            state = nextState;
            saveToStorage();
            emit();
            return true;
        }
        return false;
    }

    async function loadSeed(url = seedUrl) {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
            throw new Error(`Debt seed HTTP ${res.status}`);
        }

        const raw = await res.json();
        const rows = Array.isArray(raw) ? raw : [];
        const normalized = rows
            .map(normalizeDebtRecord)
            .sort(compareDebtRecords);

        hydrateState(
            {
                ...state,
                records: normalized,
                meta: {
                    ...state.meta,
                    seedLoaded: true,
                    seedUrl: url,
                    hydrationSource: "seed",
                },
            },
            {
                type: "seed:load",
                audit: {
                    id: generateAuditId(),
                    at: isoNow(),
                    type: "seed:load",
                    actor: "Sovereign Auto",
                    recordIds: normalized.map((r) => r.id),
                    summary: `Loaded ${normalized.length} records from seed`,
                    changes: [],
                },
            },
        );

        return normalized;
    }

    function subscribe(fn) {
        subscribers.add(fn);
        return () => subscribers.delete(fn);
    }

    function getPublicState() {
        const visibleRecords = computeVisibleRecords(state);
        const selectedRecord =
            state.records.find((r) => r.id === state.selectedId) || null;

        const snapshots = memoryManager.currentSnapshots;
        return {
            ...deepCloneSerializable(state),
            visibleRecords,
            selectedRecord,
            selectedIds: deepCloneSerializable(state.selectedIds || []),
            auditLog: deepCloneSerializable(state.auditLog || []),
            snapshotMeta: {
                count: snapshots.length,
                index: memoryManager.timeIndex,
                limit: memoryManager.limit,
            },
            storageMeta: {
                key: storageKey,
            },
        };
    }

    function createAutoDebt(payload = {}) {
        return normalizeDebtRecord({
            id: payload.id || generateDebtId(payload.prefix || "AUTO"),
            title: payload.title || "Untitled Auto Debt",
            category: payload.category || "Runtime",
            severity: payload.severity || "P3",
            status: payload.status || "OPEN",
            owner: payload.owner || "Shared",
            reason:
                payload.reason ||
                "Automatically captured by SovereignDebtEngine",
            impact: payload.impact || "Potential runtime or governance risk",
            nextAction:
                payload.nextAction || "Inspect evidence and triage root cause",
            evidence: payload.evidence || [],
            scope: payload.scope || ["runtime"],
            discoveredBy: payload.discoveredBy || "Sovereign Auto",
            priorityScore: payload.priorityScore ?? 70,
            createdAt: payload.createdAt || isoNow(),
            resolvedAt: payload.resolvedAt ?? null,
        });
    }

    function pipeDebt(payload = {}, meta = {}) {
        const record = createAutoDebt(payload);
        const existing = state.records.find((r) => r.id === record.id) || null;

        upsertRecord(record, {
            type: "debt:pipe",
            ...meta,
        });

        appendAuditEvent({
            type: safeString(meta?.type, "debt:pipe"),
            actor: safeString(
                meta?.actor,
                payload?.discoveredBy || "Sovereign Auto",
            ),
            recordIds: [record.id],
            summary: existing
                ? `Auto-updated ${record.id}`
                : `Auto-created ${record.id}`,
            changes: existing ? buildDiff(existing, record) : [],
        });

        saveToStorage();
        emit();

        return record;
    }

    function installGlobalErrorTrap() {
        if (globalErrorInstalled) return;
        window.addEventListener("error", (event) => {
            pipeDebt(
                {
                    prefix: "ERR",
                    title: safeString(event.message, "Unhandled Error"),
                    category: "Runtime",
                    severity: "P2",
                    status: "OPEN",
                    owner: "Frontend",
                    reason: "Unhandled runtime error reached global window boundary",
                    impact: "Potential UI break, partial hydration failure, or silent feature collapse",
                    nextAction:
                        "Inspect stack, isolate source module, and add guard or fix root cause",
                    evidence: [
                        safeString(event.filename),
                        `line:${safeString(event.lineno)}`,
                        `col:${safeString(event.colno)}`,
                        safeString(event.error?.stack),
                    ].filter(Boolean),
                    scope: ["runtime", "global-error"],
                    discoveredBy: "Window Error Trap",
                    priorityScore: 88,
                },
                { source: "window.error" },
            );
        });
        globalErrorInstalled = true;
    }

    function installUnhandledRejectionTrap() {
        if (rejectionInstalled) return;
        window.addEventListener("unhandledrejection", (event) => {
            pipeDebt(
                {
                    prefix: "PROMISE",
                    title: "Unhandled Promise Rejection",
                    category: "Runtime",
                    severity: "P2",
                    status: "OPEN",
                    owner: "Frontend",
                    reason: "Async control flow escaped without catch handler",
                    impact: "State inconsistency, hidden async failure, or broken background workflow",
                    nextAction:
                        "Wrap async chain in try/catch and normalize rejected payload",
                    evidence: [safeString(event.reason?.stack || event.reason)],
                    scope: ["runtime", "async", "promise"],
                    discoveredBy: "Promise Rejection Trap",
                    priorityScore: 86,
                },
                { source: "window.unhandledrejection" },
            );
        });
        rejectionInstalled = true;
    }

    function installConsoleTrap() {
        if (consoleTrapInstalled) return;

        originalConsoleWarn = console.warn.bind(console);
        originalConsoleError = console.error.bind(console);

        console.warn = (...args) => {
            try {
                pipeDebt(
                    {
                        prefix: "WARN",
                        title: safeString(args[0], "Console warning"),
                        category: "Hygiene",
                        severity: "P3",
                        status: "OPEN",
                        owner: "Shared",
                        reason: "Console warning surfaced during runtime",
                        impact: "Production noise, hidden compatibility issue, or degraded operator trust",
                        nextAction:
                            "Inspect emitting module and either fix or intentionally suppress",
                        evidence: args
                            .map((x) => safeString(x))
                            .slice(0, MAX_EVIDENCE_ITEMS),
                        scope: ["console", "warning"],
                        discoveredBy: "Console Warn Trap",
                        priorityScore: 55,
                    },
                    { source: "console.warn" },
                );
            } catch (_) {}

            originalConsoleWarn(...args);
        };

        console.error = (...args) => {
            try {
                pipeDebt(
                    {
                        prefix: "CERR",
                        title: safeString(args[0], "Console error"),
                        category: "Runtime",
                        severity: "P2",
                        status: "OPEN",
                        owner: "Shared",
                        reason: "Console error surfaced during runtime",
                        impact: "Production-visible failure signal or partial feature collapse",
                        nextAction:
                            "Trace emitting module and classify as runtime, dependency, or transport failure",
                        evidence: args
                            .map((x) => safeString(x))
                            .slice(0, MAX_EVIDENCE_ITEMS),
                        scope: ["console", "error"],
                        discoveredBy: "Console Error Trap",
                        priorityScore: 78,
                    },
                    { source: "console.error" },
                );
            } catch (_) {}

            originalConsoleError(...args);
        };

        consoleTrapInstalled = true;
    }

    function installAllTraps() {
        installGlobalErrorTrap();
        installUnhandledRejectionTrap();
        installConsoleTrap();
    }

    function bindList(container, renderItem) {
        if (!container) return () => {};

        return subscribe((publicState) => {
            const rows = publicState.visibleRecords;

            container.innerHTML = "";

            if (!rows.length) {
                container.innerHTML =
                    '<div class="debt-board__empty">No debt records found.</div>';
                return;
            }

            const fragment = document.createDocumentFragment();

            rows.forEach((row) => {
                const node = renderItem
                    ? renderItem(row, publicState)
                    : defaultRenderItem(row);
                if (node) fragment.appendChild(node);
            });

            container.appendChild(fragment);
        });
    }

    function defaultRenderItem(row) {
        const el = document.createElement("article");
        el.className = "debt-card";
        el.dataset.id = row.id;
        el.innerHTML = `
      <header class="debt-card__header">
        <strong class="debt-card__title">${escapeHtml(row.title)}</strong>
        <span class="debt-card__score">Score: ${row.priorityScore}</span>
      </header>
      <div class="debt-card__meta">
        <span>${escapeHtml(row.id)}</span>
        <span>${escapeHtml(row.severity)}</span>
        <span>${escapeHtml(row.category)}</span>
        <span>${escapeHtml(row.status)}</span>
        <span>${escapeHtml(row.owner)}</span>
      </div>
      <p class="debt-card__reason">${escapeHtml(row.reason)}</p>
    `;
        return el;
    }

    function escapeHtml(value) {
        return safeString(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    const api = {
        loadSeed,
        setRecords,
        upsertRecord,
        updateRecord,
        removeRecord,
        setFilter,
        clearFilters,
        selectRecord,
        subscribe,
        getPublicState,
        undo,
        redo,
        installAllTraps,
        installGlobalErrorTrap,
        installUnhandledRejectionTrap,
        installConsoleTrap,
        bindList,
        pipeDebt,
        exportCoreState,
        saveToStorage,
        loadFromStorage,
        clearStorage,
        hydrateState,
        setPriorityScore,
        getSelectedIds,
        toggleSelectedId,
        clearSelectedIds,
        selectAllVisible,
        bulkUpdateRecords,
        exportJson,
        importJson,
        getAuditLog,
        getRecordHistory,
    };

    pushSnapshot(state, { type: "engine:init" });

    return api;
}

export async function bootSovereignDebtEngine(options = {}) {
    const existing = window.__SANTIS_DEBT_ENGINE__;
    if (existing) return existing;

    const engine = createSovereignDebtEngine(options);

    window.__SANTIS_DEBT_ENGINE__ = engine;
    window.__SANTIS_DEBT_PIPE__ = (payload) =>
        engine.pipeDebt(payload, { source: "global-pipe" });
    window.__SANTIS_DEBT_UNDO__ = () => engine.undo();
    window.__SANTIS_DEBT_REDO__ = () => engine.redo();

    if (options.installTraps !== false) {
        engine.installAllTraps();
    }

    const stored = engine.loadFromStorage();

    if (stored) {
        engine.hydrateState(stored, {
            type: "storage:hydrate",
            audit: {
                id: generateAuditId(),
                at: isoNow(),
                type: "storage:hydrate",
                actor: "Sovereign Auto",
                recordIds: (stored.records || []).map((r) => r.id),
                summary: `Hydrated ${stored.records?.length || 0} records from local storage`,
                changes: [],
            },
        });
        return engine;
    }

    if (options.autoLoadSeed !== false) {
        try {
            await engine.loadSeed(options.seedUrl || DEFAULT_SEED_URL);
        } catch (err) {
            engine.pipeDebt({
                prefix: "SEED",
                title: "Debt seed load failure",
                category: "Dependency",
                severity: "P2",
                status: "OPEN",
                owner: "Frontend",
                reason: "Debt bootstrap JSON could not be loaded during engine boot",
                impact: "Debt Board starts without canonical governance baseline",
                nextAction:
                    "Verify seed URL, JSON validity, and static asset serving path",
                evidence: [safeString(err?.message), safeString(err?.stack)],
                scope: ["debt-board", "bootstrap", "seed"],
                discoveredBy: "Sovereign Debt Boot",
                priorityScore: 84,
            });
        }
    }

    return engine;
}
