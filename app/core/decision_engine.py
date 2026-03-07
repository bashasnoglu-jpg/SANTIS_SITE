import json
import logging
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)

class DecisionEngine:
    """
    Santis Revenue OS - Judgment Layer
    Evaluates real-time intent against tenant-specific sovereign rules.
    Operates in Shadow Mode to validate AI recommendations.
    """
    
    @staticmethod
    async def get_active_rules(db: AsyncSession, tenant_id: str) -> List[Dict]:
        """Fetch cached rules for the tenant."""
        res = await db.execute(text(
            "SELECT * FROM decision_rules WHERE tenant_id = :tid AND enabled = 1 ORDER BY priority DESC"
        ), {"tid": tenant_id})
        return [dict(r._mapping) for r in res.fetchall()]

    @staticmethod
    def _evaluate_condition(op: str, val: float, target: float) -> bool:
        if op == ">": return target > val
        if op == "<": return target < val
        if op == ">=": return target >= val
        if op == "<=": return target <= val
        if op == "==": return target == val
        return False

    @staticmethod
    def evaluate_intent(rules: List[Dict], state: Dict[str, Any]) -> tuple[str, str, bool, dict]:
        """
        Evaluate current state against rules.
        Returns: (Decision Action, Rule Name, is_autonomous, action_params)
        """
        current_intent = float(state.get("intent_score", 0))
        current_occupancy = float(state.get("occupancy_pct", 0.0))

        for rule in rules:
            try:
                conds = json.loads(rule["conditions"])
                match = True
                for field, ops in conds.items():
                    if field == "intent_score":
                        if not DecisionEngine._evaluate_condition(ops["op"], ops["value"], current_intent):
                            match = False; break
                    elif field == "occupancy":
                        if not DecisionEngine._evaluate_condition(ops["op"], ops["value"], current_occupancy):
                            match = False; break
                if match:
                    is_auto = bool(rule.get("is_autonomous", 0))
                    params = {}
                    if rule.get("action_params"):
                        try: params = json.loads(rule["action_params"])
                        except: pass
                    return rule["action"], rule["name"], is_auto, params
            except Exception as e:
                logger.error(f"[Decision Engine] Rule evaluation error: {e}")
                continue
        return "HOLD", "Default Hold", False, {}

    @staticmethod
    async def log_shadow_decision(
        db: AsyncSession,
        tenant_id: str,
        event_id: str,
        ai_rec: str,
        rule_dec: str,
        actual: str = "OBSERVED",
        confidence: float = 0.95,
        revenue_delta: float = 0.0,
        was_autonomous: bool = False,
        lift_estimate: float = 0.0
    ):
        """Record the silent struggle between AI suggestion and Hard Rule."""
        await db.execute(text(
            "INSERT INTO shadow_decisions "
            "(tenant_id, event_id, ai_recommendation, rule_decision, actual_outcome, confidence_score, revenue_delta, was_autonomous, lift_estimate) "
            "VALUES (:tid, :eid, :ai, :rule, :actual, :conf, :rev, :auto, :lift)"
        ), {
            "tid": tenant_id, "eid": event_id, "ai": ai_rec, "rule": rule_dec,
            "actual": actual, "conf": confidence, "rev": revenue_delta,
            "auto": int(was_autonomous), "lift": lift_estimate
        })
        await db.commit()
