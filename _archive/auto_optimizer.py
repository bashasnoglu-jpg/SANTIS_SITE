import json
import os
import shutil
from datetime import datetime
from sentinel_metrics import SentinelMetrics 

CONFIG_PATH = "sentinel_config.json"
SUGGESTIONS_PATH = "reports/sentinel_suggestions.json"
IMPACT_LOG_PATH = "reports/sentinel_impact_log.json"
TEMP_BASELINE_DIR = "reports/temp_baselines"

class AutoOptimizer:
    """
    The 'Hands' & 'Learner' of Sentinel.
    Applies optimizations and verifies their impact.
    """

    @staticmethod
    def _safe_write_json(path, data):
        tmp_path = path + ".tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        if os.path.exists(path):
            os.replace(tmp_path, path)
        else:
            os.rename(tmp_path, path)

    @staticmethod
    def load_config():
        if not os.path.exists(CONFIG_PATH):
            return {}
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def save_config(config):
        AutoOptimizer._safe_write_json(CONFIG_PATH, config)

    @staticmethod
    def load_suggestions():
        if not os.path.exists(SUGGESTIONS_PATH):
            return []
        with open(SUGGESTIONS_PATH, "r", encoding="utf-8") as f:
            try: return json.load(f)
            except: return []

    @staticmethod
    def save_suggestions(suggestions):
        AutoOptimizer._safe_write_json(SUGGESTIONS_PATH, suggestions)

    @staticmethod
    def load_impact_log():
        if not os.path.exists(IMPACT_LOG_PATH):
            return []
        with open(IMPACT_LOG_PATH, "r", encoding="utf-8") as f:
            try: return json.load(f)
            except: return []

    @staticmethod
    def save_impact_log(logs):
        AutoOptimizer._safe_write_json(IMPACT_LOG_PATH, logs)

    @staticmethod
    def capture_snapshot(opt_id):
        if not os.path.exists(TEMP_BASELINE_DIR):
            os.makedirs(TEMP_BASELINE_DIR)
        
        metrics = SentinelMetrics.get_current()
        path = os.path.join(TEMP_BASELINE_DIR, f"{opt_id}.json")
        AutoOptimizer._safe_write_json(path, metrics)

    @staticmethod
    def load_state():
        if not os.path.exists("reports/sentinel_state.json"):
            return {"rollbacks_today": 0, "last_reset_date": "", "last_rollback_at": None}
        with open("reports/sentinel_state.json", "r") as f:
            return json.load(f)

    @staticmethod
    def save_state(state):
        AutoOptimizer._safe_write_json("reports/sentinel_state.json", state)

    @staticmethod
    def check_and_reset_daily_limit(state):
        today = datetime.utcnow().strftime("%Y-%m-%d")
        if state.get("last_reset_date") != today:
            state["rollbacks_today"] = 0
            state["last_reset_date"] = today
        return state

    @staticmethod
    def evaluate_rollback(target, score):
        config = AutoOptimizer.load_config().get("rollback_policy", {})
        
        # 1. FORBIDDEN?
        category = target["action_key"].split(".")[0]
        if category in config.get("never_rollback_types", []):
            return "FORBIDDEN"

        # 2. AUTO-ROLLBACK?
        if score <= config.get("auto_threshold", -300):
            state = AutoOptimizer.load_state()
            state = AutoOptimizer.check_and_reset_daily_limit(state)
            
            if state["rollbacks_today"] >= config.get("max_rollbacks_per_day", 2):
                return "LIMIT_REACHED"
            
            last_at_str = state.get("last_rollback_at")
            if last_at_str:
                last_at = datetime.fromisoformat(last_at_str)
                mins_passed = (datetime.utcnow() - last_at).total_seconds() / 60
                if mins_passed < config.get("cooldown_minutes", 10):
                    return "COOLDOWN"

            return "AUTO"

        # 3. MANUAL ROLLBACK?
        if score <= config.get("manual_threshold", -150):
            return "MANUAL"

        return "NONE"

    @staticmethod
    def perform_rollback(target, score):
        config = AutoOptimizer.load_config()
        parts = target["action_key"].split(".")
        
        prev_val = target.get("previous_value")
        if prev_val is None:
            curr = config[parts[0]][parts[1]]
            if isinstance(curr, bool): prev_val = not curr
            else: return # Cannot rollback safely
            
        config[parts[0]][parts[1]] = prev_val
        AutoOptimizer.save_config(config)
        
        state = AutoOptimizer.load_state()
        state = AutoOptimizer.check_and_reset_daily_limit(state)
        state["rollbacks_today"] += 1
        state["last_rollback_at"] = datetime.utcnow().isoformat()
        AutoOptimizer.save_state(state)
        
        log_entry = {
            "event": "rollback_executed",
            "optimization_id": target["id"],
            "action": target["action_key"],
            "impact_score": "ROLLBACK", 
            "score_val": score,
            "mode": "auto",
            "timestamp": datetime.utcnow().isoformat()
        }
        logs = AutoOptimizer.load_impact_log()
        logs.append(log_entry)
        AutoOptimizer.save_impact_log(logs)

    @staticmethod
    def apply_suggestion(sid):
        suggestions = AutoOptimizer.load_suggestions()
        target = next((s for s in suggestions if s["id"] == sid), None)
        
        if not target: return {"error": "Suggestion not found"}
        if target["status"] != "pending": return {"error": f"Status is {target['status']}"}

        # 1. CAPTURE SNAPSHOT (Atomic)
        AutoOptimizer.capture_snapshot(sid)

        # 2. APPLY CONFIG
        config = AutoOptimizer.load_config()
        parts = target["action_key"].split(".")
        if len(parts) != 2 or parts[0] not in config:
            return {"error": "Invalid action key"}
        
        # Store previous value for rollback
        current_val = config[parts[0]][parts[1]]
        target["previous_value"] = current_val

        config[parts[0]][parts[1]] = target["proposed_value"]
        AutoOptimizer.save_config(config)

        # 3. UPDATE STATUS to 'verifying'
        target["status"] = "verifying"
        target["applied_at"] = datetime.utcnow().isoformat()
        AutoOptimizer.save_suggestions(suggestions)

        return {"status": "applied", "message": "Optimization applied. Verifying impact..."}

    @staticmethod
    def calculate_impact(before, after):
        # Formula: (Before - After) for response time (improvement is positive)
        #          (Before - After) * 500 for error rate
        #          (Before - After) * 2 for CPU (improvement is positive, so Before > After)
        
        resp_delta = before.get("response_time_ms", 0) - after.get("response_time_ms", 0)
        err_delta = before.get("error_count", 0) - after.get("error_count", 0)
        # Using health score delta as proxy for system load improvement (higher health = better)
        health_delta = after.get("health_score", 100) - before.get("health_score", 100)

        # Noise Guard
        if abs(resp_delta) < 50:
            return "NEUTRAL", 0

        # Score Calculation
        # Positive resp_delta means means time decreased (GOOD)
        # Positive health_delta means health increased (GOOD)
        score = resp_delta + (err_delta * 500) + (health_delta * 10)
        
        if score > 200: return "POSITIVE", score
        if score < -150: return "NEGATIVE", score
        return "NEUTRAL", score

    @staticmethod
    def verify_optimization(sid):
        suggestions = AutoOptimizer.load_suggestions()
        target = next((s for s in suggestions if s["id"] == sid), None)
        
        if not target or target["status"] != "verifying": return

        # Timing Guard (Simulated: check if 1 min passed for testing, real prod use 5 min)
        applied_at = datetime.fromisoformat(target["applied_at"])
        if (datetime.utcnow() - applied_at).total_seconds() < 5: # Shortened for demo
             return

        # Load Baseline
        baseline_path = os.path.join(TEMP_BASELINE_DIR, f"{sid}.json")
        if not os.path.exists(baseline_path):
            target["status"] = "validated" # Can't verify
            target["impact_result"] = "UNKNOWN"
            AutoOptimizer.save_suggestions(suggestions)
            return

        with open(baseline_path, "r", encoding="utf-8") as f:
            before = json.load(f)
        
        after = SentinelMetrics.get_current()
        
        impact, score = AutoOptimizer.calculate_impact(before, after)
        
        # Log Impact (Authentication of the failure)
        log_entry = {
            "optimization_id": sid,
            "action": target["action_key"],
            "before": before,
            "after": after,
            "impact_score": impact,
            "score_val": score,
            "timestamp": datetime.utcnow().isoformat()
        }
        logs = AutoOptimizer.load_impact_log()
        logs.append(log_entry)
        AutoOptimizer.save_impact_log(logs)

        # Rollback Check
        if impact == "NEGATIVE":
             decision = AutoOptimizer.evaluate_rollback(target, score)
             if decision == "AUTO":
                 AutoOptimizer.perform_rollback(target, score)

        # Update Status
        target["status"] = "validated"
        target["impact_result"] = impact
        AutoOptimizer.save_suggestions(suggestions)

        # Cleanup
        try: os.remove(baseline_path)
        except: pass

    @staticmethod
    def get_weighted_success_rate(action_key):
        logs = AutoOptimizer.load_impact_log()
        relevant = [l for l in logs if l["action"] == action_key]
        if not relevant: return 0.5 # Default neutral confidence
        
        score = 0
        weight = 1.0
        total_weight = 0
        
        # Newest first
        for entry in reversed(relevant):
            if entry["impact_score"] == "POSITIVE":
                score += weight
            elif entry["impact_score"] == "NEGATIVE":
                score -= weight # Penalize
            
            total_weight += weight
            weight *= 0.9 # Decay
            
        if total_weight == 0: return 0.5
        
        # Normalize to 0..1 range (approx)
        normalized = (score / total_weight) 
        # Shift: 0 -> 0.5, 1 -> 1.0, -1 -> 0.0
        return max(0.0, min(1.0, (normalized + 1) / 2))

    @staticmethod
    def reject_suggestion(sid):
        suggestions = AutoOptimizer.load_suggestions()
        target = next((s for s in suggestions if s["id"] == sid), None)
        if target and target["status"] == "pending":
            target["status"] = "rejected"
            target["rejected_at"] = datetime.utcnow().isoformat()
            AutoOptimizer.save_suggestions(suggestions)
            return {"status": "rejected"}
        return {"error": "Invalid target"}
