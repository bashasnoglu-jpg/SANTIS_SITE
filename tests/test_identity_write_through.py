from __future__ import annotations

import unittest

from app.domain.identity_write_through import (
    CONTRACT_VERSION,
    booking_cache_patch,
    compute_booking_evidence,
    compute_shift_evidence,
    deterministic_boundary_key,
    find_impacted_booking_ids,
    reverse_impacted_booking_ids,
    shift_cache_patch,
    stable_record_ids,
)


class IdentityWriteThroughCoreTests(unittest.TestCase):
    SHIFT1 = "recM6KGAwAje9Nopj"
    THERAPIST1 = "recjcknHE0T70Ldm0"
    THERAPIST2 = "recFQE7i08tUxhCEt"
    BOOKING175 = "recZXZxciP4rgZ6ik"
    BOOKING266 = "recPwTnjUAhQ8cIUc"
    BOOKING267 = "recAssjwdeUujUuwq"

    def test_stable_record_ids_is_exact_sorted_and_unique(self) -> None:
        value = [
            {"id": self.THERAPIST2, "name": "Same display"},
            {"id": self.THERAPIST1, "name": "Same display"},
            self.THERAPIST2,
            {"name": "missing id"},
        ]
        self.assertEqual(
            stable_record_ids(value),
            sorted([self.THERAPIST1, self.THERAPIST2]),
        )

    def test_exact_three_booking_fanout_fixture_from_reverse_shift_links(self) -> None:
        shift = {
            "id": self.SHIFT1,
            "fields": {
                "Bookings": [
                    {"id": self.BOOKING267, "name": "267"},
                    self.BOOKING175,
                    {"id": self.BOOKING266, "name": "266"},
                    self.BOOKING267,
                    {"name": "missing id"},
                ]
            },
        }
        self.assertEqual(
            reverse_impacted_booking_ids(shift),
            sorted([self.BOOKING175, self.BOOKING266, self.BOOKING267]),
        )

    def test_legacy_explicit_booking_collection_helper_stays_exact_by_record_id(self) -> None:
        bookings = [
            {
                "id": self.BOOKING175,
                "fields": {"Staff Shift Link": [self.SHIFT1]},
            },
            {
                "id": self.BOOKING266,
                "fields": {"Staff Shift Link": [{"id": self.SHIFT1, "name": "Shift1"}]},
            },
            {
                "id": self.BOOKING267,
                "fields": {"Staff Shift Link": [self.SHIFT1]},
            },
            {
                "id": "recAAAAAAAAAAAAAA",
                "fields": {"Staff Shift Link": [{"id": "recBBBBBBBBBBBBBB", "name": "Shift1"}]},
            },
        ]
        self.assertEqual(
            find_impacted_booking_ids(bookings, self.SHIFT1),
            sorted([self.BOOKING175, self.BOOKING266, self.BOOKING267]),
        )

    def test_deterministic_boundary_key_is_repeatable(self) -> None:
        first = deterministic_boundary_key(
            shift_record_id=self.SHIFT1,
            expected_staff_ids=[self.THERAPIST1],
            new_staff_ids=[self.THERAPIST2],
            correlation_id="A3G-TEST-001",
        )
        second = deterministic_boundary_key(
            shift_record_id=self.SHIFT1,
            expected_staff_ids=[self.THERAPIST1],
            new_staff_ids=[self.THERAPIST2],
            correlation_id="A3G-TEST-001",
        )
        self.assertEqual(first, second)
        self.assertTrue(first.startswith(f"{CONTRACT_VERSION}|SHIFT={self.SHIFT1}|H="))

    def test_boundary_key_changes_when_target_owner_changes(self) -> None:
        first = deterministic_boundary_key(
            shift_record_id=self.SHIFT1,
            expected_staff_ids=[self.THERAPIST1],
            new_staff_ids=[self.THERAPIST2],
            correlation_id="A3G-TEST-002",
        )
        second = deterministic_boundary_key(
            shift_record_id=self.SHIFT1,
            expected_staff_ids=[self.THERAPIST2],
            new_staff_ids=[self.THERAPIST1],
            correlation_id="A3G-TEST-002",
        )
        self.assertNotEqual(first, second)

    def test_shift_evidence_scalarizes_only_exact_single_owner(self) -> None:
        shift = {
            "id": self.SHIFT1,
            "fields": {
                "Staff_Link": [self.THERAPIST2],
                "Shift_Identity_Source_Signature_v0_1": "SHIFT=S1||STAFF=T2",
            },
        }
        evidence = compute_shift_evidence(shift)
        patch = shift_cache_patch(evidence)
        self.assertEqual(patch["Shift_Staff_Record_ID"], self.THERAPIST2)
        self.assertEqual(patch["Shift_Staff_Count"], 1)

    def test_multi_owner_shift_fails_scalarization_closed(self) -> None:
        shift = {
            "id": self.SHIFT1,
            "fields": {
                "Staff_Link": [self.THERAPIST1, self.THERAPIST2],
                "Shift_Identity_Source_Signature_v0_1": "MULTI",
            },
        }
        patch = shift_cache_patch(compute_shift_evidence(shift))
        self.assertIsNone(patch["Shift_Staff_Record_ID"])
        self.assertEqual(patch["Shift_Staff_Count"], 2)

    def test_booking_cache_uses_current_linked_shift_owner(self) -> None:
        booking = {
            "id": self.BOOKING175,
            "fields": {
                "Therapist_Link": [self.THERAPIST1],
                "Staff Shift Link": [self.SHIFT1],
                "Identity_Source_Signature_v0_1": "BT=T1||SHIFT=S1",
            },
        }
        shift = {
            "id": self.SHIFT1,
            "fields": {
                "Staff_Link": [self.THERAPIST2],
            },
        }
        evidence = compute_booking_evidence(booking, {self.SHIFT1: shift})
        patch = booking_cache_patch(evidence)
        self.assertEqual(patch["Linked_Shift_Staff_Record_ID"], self.THERAPIST2)
        self.assertNotEqual(evidence.therapist_ids[0], evidence.linked_shift_staff_ids[0])


if __name__ == "__main__":
    unittest.main()
