from enum import Enum
from typing import Set, Dict

class Permission(str, Enum):
    # User Permissions
    USER_READ = "user:read"
    USER_CREATE = "user:create"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    USER_RESTORE = "user:restore"
    
    # Booking Permissions
    BOOKING_READ = "booking:read"
    BOOKING_CREATE = "booking:create"
    BOOKING_UPDATE = "booking:update"
    BOOKING_DELETE = "booking:delete"
    
    # Tenant Permissions
    TENANT_READ = "tenant:read"
    TENANT_MANAGE = "tenant:manage" # Create/Delete/Update Tenants
    
    # System/Audit
    AUDIT_READ = "audit:read"
    
    # Admin Panel Access
    ADMIN_ACCESS = "admin:access"


# Immutable Role-Permission Mapping
# OWNER = Tenant Admin / Business Owner
# PLATFORM_ADMIN (is_platform_admin=True) handles system wide via bypass or specific set.
# Here we define standard roles string mapping. 

ROLE_PERMISSIONS: Dict[str, Set[Permission]] = {
    # Superuser/Platform Admin usually gets all, but we map explicitly for robustness
    "OWNER": {
        Permission.USER_READ,
        Permission.USER_CREATE,
        Permission.USER_UPDATE,
        Permission.USER_DELETE,
        Permission.USER_RESTORE,
        Permission.BOOKING_READ,
        Permission.BOOKING_CREATE,
        Permission.BOOKING_UPDATE,
        Permission.BOOKING_DELETE,
        Permission.TENANT_READ,
        Permission.AUDIT_READ,
        Permission.ADMIN_ACCESS,
    },
    "MANAGER": {
        Permission.USER_READ,
        Permission.BOOKING_READ,
        Permission.BOOKING_CREATE,
        Permission.BOOKING_UPDATE,
        Permission.BOOKING_DELETE,
        Permission.ADMIN_ACCESS,
    },
    "USER": {
        Permission.USER_READ, # Read self usually handled by "me" endpoint logic, but general read might be restricted
        Permission.BOOKING_READ, # Read own bookings
        Permission.BOOKING_CREATE,
    },
    # Special role for Platform Admin (Superuser)
    # Often they bypass, but good to have a set
    "SUPERUSER": {
        Permission.USER_READ,
        Permission.USER_CREATE,
        Permission.USER_UPDATE,
        Permission.USER_DELETE,
        Permission.USER_RESTORE,
        Permission.BOOKING_READ,
        Permission.BOOKING_CREATE,
        Permission.BOOKING_UPDATE,
        Permission.BOOKING_DELETE,
        Permission.TENANT_READ,
        Permission.TENANT_MANAGE,
        Permission.AUDIT_READ,
        Permission.ADMIN_ACCESS,
    }
}
