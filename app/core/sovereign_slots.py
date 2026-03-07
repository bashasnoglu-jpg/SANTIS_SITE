"""
app/core/sovereign_slots.py
Sovereign Media Infrastructure — Slot Registry Enum
Type safety for slot keys — prevents typos and enables autocomplete.
"""
from enum import Enum


class SantisSlot(str, Enum):
    # ── Ana Sayfa ──
    HERO_HOME       = "hero_home"
    CARD_HAMAM_1    = "card_hamam_1"
    CARD_MASAJ_1    = "card_masaj_1"
    CARD_SKINCARE_1 = "card_skincare_1"
    CARD_FAMILY_1   = "card_family_1"

    # ── Kategori Sayfaları ──
    HERO_HAMAM      = "hero_hamam"
    HERO_MASAJ      = "hero_masaj"
    HERO_CILT       = "hero_cilt"

    # ── Gallery Nodes ──
    GALLERY_NODE_1  = "gallery_node_1"
    GALLERY_NODE_2  = "gallery_node_2"
    GALLERY_NODE_3  = "gallery_node_3"
    GALLERY_NODE_4  = "gallery_node_4"
    GALLERY_NODE_5  = "gallery_node_5"
    GALLERY_NODE_6  = "gallery_node_6"
    GALLERY_NODE_7  = "gallery_node_7"
    GALLERY_NODE_8  = "gallery_node_8"
    GALLERY_NODE_9  = "gallery_node_9"

    # ── Global/Identity ──
    SITE_LOGO       = "site_logo"
    SITE_FAVICON    = "site_favicon"


# Convenience: all valid slot keys as a set (for validation)
VALID_SLOTS = {s.value for s in SantisSlot}
