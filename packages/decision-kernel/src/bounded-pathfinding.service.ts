import type { SovereignAction } from "@santis/domain-schema/src/core-state.interface";
import type { BiologicalTargetVector } from "@santis/domain-schema/src/intent.contract";
import type { Contraindication, RitualEdge, RitualGraph, RitualNode } from "./ritual-graph.contract";
import { scorePath, type PathScore, type PathStep } from "./path-scoring";

export type PathfindingRequest = {
  graph: RitualGraph;
  targetVector: BiologicalTargetVector;
  guestContraindications?: Contraindication[];
  maxDepth?: number;
  maxDurationMinutes?: number;
  maxResults?: number;
};

export type RitualPathCandidate = {
  steps: PathStep[];
  score: PathScore;
};

export type PathfindingResult = {
  status: "PATHS_FOUND" | "NO_SAFE_PATH";
  candidates: RitualPathCandidate[];
  discardedPaths: number;
};

const DEFAULT_MAX_DEPTH = 4;
const DEFAULT_MAX_DURATION = 240;
const DEFAULT_MAX_RESULTS = 3;

function buildAdjacency(edges: RitualEdge[]) {
  const map = new Map<string, RitualEdge[]>();
  for (const edge of edges) {
    const list = map.get(edge.fromNodeId) ?? [];
    list.push(edge);
    map.set(edge.fromNodeId, list);
  }
  return map;
}

function nodeMap(nodes: RitualNode[]) {
  return new Map(nodes.map(node => [node.id, node]));
}

function violatesContraindications(edge: RitualEdge | undefined, guestContraindications: Contraindication[]) {
  if (!edge) return false;
  return edge.constraints.contraindications.some(item => guestContraindications.includes(item));
}

function computeCurrentDuration(path: PathStep[]) {
  return path.reduce((sum, step) => sum + step.node.durationMinutes + step.restMinutesBefore, 0);
}

export const findBoundedRitualPaths: SovereignAction<PathfindingRequest, PathfindingResult> = async (ctx, request) => {
  if (request.graph.tenantId !== ctx.tenant.tenantId) {
    throw new Error("FATAL: Graph tenant mismatch");
  }

  const maxDepth = Math.max(1, Math.min(request.maxDepth ?? DEFAULT_MAX_DEPTH, 5));
  const maxDuration = Math.max(30, Math.min(request.maxDurationMinutes ?? DEFAULT_MAX_DURATION, 360));
  const maxResults = Math.max(1, Math.min(request.maxResults ?? DEFAULT_MAX_RESULTS, 5));
  const guestContraindications = request.guestContraindications ?? [];
  const adjacency = buildAdjacency(request.graph.edges);
  const nodesById = nodeMap(request.graph.nodes);
  const validCandidates: RitualPathCandidate[] = [];
  let discardedPaths = 0;

  function visit(path: PathStep[], visited: Set<string>) {
    const duration = computeCurrentDuration(path);

    if (path.length > maxDepth || duration > maxDuration) {
      discardedPaths += 1;
      return;
    }

    if (path.length > 0) {
      const score = scorePath(path, request.targetVector);
      if (score.loadPenalty === 0) {
        validCandidates.push({ steps: path, score });
      } else {
        discardedPaths += 1;
      }
    }

    if (path.length === maxDepth) return;

    const current = path.at(-1)?.node;
    const outgoing = current ? adjacency.get(current.id) ?? [] : [];

    for (const edge of outgoing) {
      const nextNode = nodesById.get(edge.toNodeId);
      if (!nextNode || visited.has(nextNode.id)) continue;
      if (violatesContraindications(edge, guestContraindications)) {
        discardedPaths += 1;
        continue;
      }

      visit([
        ...path,
        {
          node: nextNode,
          viaEdge: edge,
          restMinutesBefore: edge.constraints.minRestMinutes,
        },
      ], new Set([...visited, nextNode.id]));
    }
  }

  for (const startNode of request.graph.nodes) {
    visit([{ node: startNode, restMinutesBefore: 0 }], new Set([startNode.id]));
  }

  const candidates = validCandidates
    .sort((a, b) => b.score.totalScore - a.score.totalScore)
    .slice(0, maxResults);

  return {
    status: candidates.length > 0 ? "PATHS_FOUND" : "NO_SAFE_PATH",
    candidates,
    discardedPaths,
  };
};
