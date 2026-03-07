import urllib.request
import urllib.parse
import urllib.error
import json
import time

BASE_URL = "http://localhost:8000"

def print_step(title):
    print(f"\n{'='*50}")
    print(f"🚀 TEST: {title}")
    print(f"{'='*50}")

def run_test():
    score = {"passed": 0, "failed": 0}

    def assert_true(condition, success_msg, error_msg):
        if condition:
            print(f"✅ PASS: {success_msg}")
            score["passed"] += 1
        else:
            print(f"❌ FAIL: {error_msg}")
            score["failed"] += 1

    try:
        # TEST 0: Authentication
        print_step("0. Context Bootstrapping (Authentication)")
        auth_data = urllib.parse.urlencode({"username": "admin@santis.com", "password": "santis_admin"}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/v1/auth/login", data=auth_data)
        res = urllib.request.urlopen(req)
        token_data = json.loads(res.read())
        token = token_data.get("access_token")
        assert_true(token is not None, "Successfully retrieved JWT Bearer Token", "Failed to retrieve token")
        
        auth_headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # TEST 1: System Health
        print_step("1. System Health & Observability (Blok D3)")
        req = urllib.request.Request(f"{BASE_URL}/api/health")
        res = urllib.request.urlopen(req)
        health_data = json.loads(res.read())
        assert_true(health_data.get("status") == "healthy", "System returned healthy status.", "System health check failed.")

        # TEST 2: Content Integrity Guard (Blok D2)
        print_step("2. Content Integrity Guard (Blok D2)")
        req = urllib.request.Request(f"{BASE_URL}/api/admin/content/integrity-scan", headers=auth_headers)
        res = urllib.request.urlopen(req)
        integrity_data = json.loads(res.read())
        health_ratio = integrity_data.get('health_ratio', '')
        assert_true(health_ratio == "100%", "Integrity Scanner reports 100% match between DB and Blobs.", f"Integrity scan returned {health_ratio}")

        # TEST 3: Edge Resolver & ETag Mechanics (Blok B3 & E)
        print_step("3. Edge Resolver & ETag Simulation (Blok E)")
        # 3.1 Initial Fetch
        req = urllib.request.Request(f"{BASE_URL}/api/v1/content/resolve/index?region=tr")
        res = urllib.request.urlopen(req)
        etag = res.headers.get('ETag')
        assert_true(etag is not None, f"Edge Resolver returned ETag: {etag}", "Missing ETag in Response headers.")
        
        # 3.2 304 Not Modified Fetch
        req = urllib.request.Request(f"{BASE_URL}/api/v1/content/resolve/index?region=tr")
        req.add_header('If-None-Match', etag)
        try:
            res_304 = urllib.request.urlopen(req)
            assert_true(False, "Expected 304 exception, but got 200.", "304 returned 200 OK.")
        except urllib.error.HTTPError as e:
            assert_true(e.code == 304, "Server correctly returned 304 Not Modified.", f"Server returned unexpected code for conditional GET: {e.code}")

        # TEST 4: The Sentinel Security & Audits (Blok D1)
        print_step("4. Security Audit Engine (Blok D1)")
        req = urllib.request.Request(f"{BASE_URL}/admin/security-audit", method="POST", headers=auth_headers)
        res = urllib.request.urlopen(req)
        sec_audit = json.loads(res.read())
        assert_true("score" in sec_audit and "total" in sec_audit, f"Security Audit ran seamlessly. Score: {sec_audit.get('score')}/{sec_audit.get('total')}", "Security Audit payload malformed or failed.")

        # TEST 5: Headless Reactivity Pipeline (Blok F)
        print_step("5. CMS to Headless Pipeline Trigger Test (Blok C -> F)")
        temp_slug = "e2e-test-slug"
        draft_payload = {
            "slug": temp_slug,
            "region": "tr",
            "locale": "tr",
            "content": {"title": "DOM Hydrator E2E Test", "price": "100"}
        }
        
        # 5.1 Create Draft
        dr_req = urllib.request.Request(f"{BASE_URL}/api/v1/content/draft", data=json.dumps(draft_payload).encode(), headers=auth_headers)
        dr_res = json.loads(urllib.request.urlopen(dr_req).read())
        draft_id = dr_res.get("draft_id")
        assert_true(draft_id is not None, f"Draft successfully stored in Registry. (ID: {draft_id})", "Draft creation failed.")

        # 5.2 Approve Draft (Publishes to Edge)
        app_payload = {"draft_id": draft_id}
        app_req = urllib.request.Request(f"{BASE_URL}/api/v1/content/draft/approve", data=json.dumps(app_payload).encode(), headers=auth_headers)
        app_res = json.loads(urllib.request.urlopen(app_req).read())
        assert_true("published_hash" in app_res, "Draft approved and successfully published atomically.", "Draft approval/publish failed.")

        # 5.3 Verify via Edge (Reactivity target)
        edge_req = urllib.request.Request(f"{BASE_URL}/api/v1/content/resolve/{temp_slug}?region=tr")
        edge_res = json.loads(urllib.request.urlopen(edge_req).read())
        assert_true(edge_res.get("title") == "DOM Hydrator E2E Test", "Edge Resolver accurately reflects newly published Headless Data.", "Edge Resolver returned stale or null data.")

        # Summary
        print_step("END-TO-END RESULTS CONCLUSION")
        print(f"🎯 Total Passed: {score['passed']}")
        print(f"⚠️ Total Failed: {score['failed']}")

    except Exception as e:
        print(f"\n❌ CRITICAL SCRIPT ERROR: {e}")

if __name__ == "__main__":
    run_test()
