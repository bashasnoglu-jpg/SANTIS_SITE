export async function sendGovernanceOutcome(payload: any) {
  try {
    await fetch('/api/governance/outcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (error) {
    console.warn('[governance.outcome] failed', error);
  }
}
