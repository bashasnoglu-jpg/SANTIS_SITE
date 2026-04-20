// PURE TYPE CONTRACT (future Zod ready)

export const FlightRiskSchema = {
  sessionDuration: "number",
  inactivityMs: "number",
  scrollDepth: "number",
  interactions: "number",
  exitIntent: "boolean",
};
