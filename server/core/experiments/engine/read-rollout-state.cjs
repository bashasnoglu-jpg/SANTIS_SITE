const fs = require('node:fs');
const path = require('node:path');

function isActiveStatus(status) {
  return status === 'scheduled' || status === 'running';
}

function readJsonFileSafe(filePath) {
  const resolved = path.resolve(filePath);

  try {
    const raw = fs.readFileSync(resolved, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function getActivePlanByExperimentIdFromFile(input) {
  const state = readJsonFileSafe(input.filePath);
  if (!state) return null;

  const rolloutId = state.rolloutIdByExperimentId?.[input.experimentId];
  if (!rolloutId) return null;

  const plan = state.plansByRolloutId?.[rolloutId];
  if (!plan) return null;

  return isActiveStatus(plan.status) ? plan : null;
}

function getApprovalByRolloutIdFromFile(input) {
  const state = readJsonFileSafe(input.filePath);
  if (!state) return null;

  return state.approvals?.[input.rolloutId] ?? null;
}

function getHealthWindowByRolloutIdFromFile(input) {
  const state = readJsonFileSafe(input.filePath);
  if (!state) return null;

  return state.windows?.[input.rolloutId] ?? null;
}

module.exports = {
  readJsonFileSafe,
  getActivePlanByExperimentIdFromFile,
  getApprovalByRolloutIdFromFile,
  getHealthWindowByRolloutIdFromFile,
};
