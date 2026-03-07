import time
import math
from typing import Dict, List, Any

class TelemetryStats:
    def __init__(self):
        # Core Counters
        self.requests_total: int = 0
        self.edge_304_count: int = 0
        self.edge_200_count: int = 0
        
        self.integrity_breach_count: int = 0
        self.rate_limit_trigger_count: int = 0
        self.rollback_count: int = 0
        self.draft_approval_count: int = 0
        
        # Latency Buckets (keeping last 100 or sliding window for MVP)
        self.publish_latency_ms: List[float] = []
        self.resolver_latency_ms: List[float] = []
        
        self.max_history = 1000

    def record_request(self, status: int):
        self.requests_total += 1
        if status == 304:
            self.edge_304_count += 1
        elif status == 200:
            self.edge_200_count += 1
            
    def record_publish_latency(self, ms: float):
        self.publish_latency_ms.append(ms)
        if len(self.publish_latency_ms) > self.max_history:
            self.publish_latency_ms.pop(0)
            
    def record_resolve_latency(self, ms: float):
        self.resolver_latency_ms.append(ms)
        if len(self.resolver_latency_ms) > self.max_history:
            self.resolver_latency_ms.pop(0)

    def _calc_percentile(self, data: List[float], p: float) -> float:
        if not data:
            return 0.0
        sdata = sorted(data)
        k = (len(sdata) - 1) * p
        f = math.floor(k)
        c = math.ceil(k)
        if f == c:
            return sdata[int(k)]
        d0 = sdata[int(f)] * (c - k)
        d1 = sdata[int(c)] * (k - f)
        return round(d0 + d1, 2)

    def get_metrics(self) -> Dict[str, Any]:
        ratio_304 = 0.0
        total_edge = self.edge_200_count + self.edge_304_count
        if total_edge > 0:
            ratio_304 = round((self.edge_304_count / total_edge) * 100, 2)
            
        pub_p50 = self._calc_percentile(self.publish_latency_ms, 0.50)
        pub_p95 = self._calc_percentile(self.publish_latency_ms, 0.95)
        
        res_p50 = self._calc_percentile(self.resolver_latency_ms, 0.50)
        res_p95 = self._calc_percentile(self.resolver_latency_ms, 0.95)
        res_p99 = self._calc_percentile(self.resolver_latency_ms, 0.99)
        
        return {
            "core": {
                "requests_total": self.requests_total,
                "edge_304_ratio_pct": ratio_304,
                "integrity_breach_count": self.integrity_breach_count,
                "rate_limit_trigger_count": self.rate_limit_trigger_count,
                "rollback_count": self.rollback_count,
                "draft_approval_count": self.draft_approval_count
            },
            "performance": {
                "resolver_p50_ms": res_p50,
                "resolver_p95_ms": res_p95,
                "resolver_p99_ms": res_p99,
                "publish_p50_ms": pub_p50,
                "publish_p95_ms": pub_p95
            }
        }

# Global Singleton for MVP Telemetry Collection
telemetry = TelemetryStats()
