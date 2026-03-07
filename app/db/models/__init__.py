from app.db.models.user import User
from app.db.models.tenant import Tenant
from app.db.models.service import Service
from app.db.models.booking import Booking
from app.db.models.customer import Customer
from app.db.models.staff import Staff
from app.db.models.room import Room
from app.db.models.audit import AuditLog
from app.db.models.commission import StaffCommission
from app.db.models.content import ContentRegistry, ContentAuditLog
from app.db.models.auth import AuthLockout
from app.db.models.consent import UserConsent
from app.db.models.resource import Resource
from app.db.models.precomputed_slot import PrecomputedSlot
from app.db.models.crm import GuestTrace, IntentSummary
from app.db.models.payment import TenantPaymentConfig, PaymentTransaction
from app.db.models.revenue_score import RevenueScore  # Phase 17: Oracle Ledger

# Phase 37: Sovereign SaaS
from app.db.models.tenant_config import TenantConfig

# Phase Q: Precomputed Metrics Cache Table
from app.db.models.precomputed_metric import PreComputedMetric

# Phase V11: Global Expansion
from app.db.models.ui_translation import UITranslation
from app.db.models.fx_rate import FXRateHistory

# Phase V12: Sovereign Event Bus
from app.db.models.event import SovereignEvent

# Phase 38: Sovereign Route Registry
from app.db.models.slot_route import SlotRoute
