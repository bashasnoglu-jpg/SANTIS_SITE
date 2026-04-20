// santis-homeostasis-supervisor.js
// SDCR V53.0 OMEGA - HARD-LOCK CONSTRAINT ENGINE (Homeostasis)

export class SystemState {
  constructor() {
    this.entropy = 0;
    this.mutationRate = 0;
    this.load = 0;
    this.capacity = 1.0;

    this.health = 1.0;
    this.mutationLocked = false;

    this.snapshotVersion = "INIT";
  }
}

export function EntropyLaw(state) {
  const entropy =
    (state.mutationRate * 0.6) +
    ((state.load / state.capacity) * 0.4);

  state.entropy = entropy;

  if (entropy >= 0.85) {
    return {
      action: "EMERGENCY_FREEZE",
      reason: "ENTROPY_COLLAPSE_THRESHOLD"
    };
  }

  if (entropy >= 0.7) {
    return {
      action: "REDUCE_MUTATION_BUDGET"
    };
  }

  return { action: "OK" };
}

export function MutationFirewall(node, state) {
  const allowed =
    state.mutationLocked === false &&
    state.entropy < 0.75 &&
    node.health > 0.5 &&
    state.load < state.capacity;

  if (!allowed) {
    return {
      allowed: false,
      reason: "FIREWALL_BLOCK"
    };
  }

  return {
    allowed: Math.random() < (1 - state.entropy)
  };
}

export function ConsensusLaw(nodes) {
  const stableNodes = nodes.filter(n => n.stability > 0.6);
  const weights = new Map();

  for (const node of stableNodes) {
    const key = node.dagHash;
    weights.set(key, (weights.get(key) || 0) + node.weight);
  }

  const sorted = [...weights.entries()].sort((a, b) => b[1] - a[1]);

  return {
    canonicalState: sorted[0]?.[0] || null,
    distribution: sorted
  };
}

export function FractureRecovery(graph, snapshot) {
  if(!graph || !graph.nodes) return graph;
  const orphans = graph.nodes.filter(n => !n.connected);

  if (orphans.length === 0) return graph;

  for (const node of orphans) {
    if(snapshot && snapshot.findClosestStable) {
        const match = snapshot.findClosestStable(node);
        if(match) graph.reconnect(node.id, match.id);
    }
  }

  return {
    ...graph,
    repaired: true
  };
}

export function HardLock(state) {
  if (state.entropy > 0.85) {
    state.mutationLocked = true;
    state.load = Math.min(state.load, state.capacity * 0.6);

    return {
      action: "FREEZE",
      reason: "GLOBAL_STABILITY_BREACH"
    };
  }

  if (state.health < 0.3) {
    return {
      action: "ROLLBACK_REQUIRED"
    };
  }

  return { action: "OK" };
}

export function HomeostasisSupervisor(state, nodes, graph, snapshot) {
  const entropyCheck = EntropyLaw(state);
  if (entropyCheck.action === "EMERGENCY_FREEZE") {
    return entropyCheck;
  }

  const hardLock = HardLock(state);
  if (hardLock.action === "FREEZE" || hardLock.action === "ROLLBACK_REQUIRED") {
    return hardLock;
  }

  const consensus = ConsensusLaw(nodes);
  const repairedGraph = FractureRecovery(graph, snapshot);

  return {
    status: "STABLE",
    entropy: state.entropy,
    canonicalState: consensus.canonicalState,
    graph: repairedGraph
  };
}
