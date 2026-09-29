"""Device adapter registry — maps a School.device_brand to its adapter."""
from .adapters import (ESSLAdapter, GenericAdapter, HikvisionAdapter,
                       MantraAdapter, SupremaAdapter, ZKTecoAdapter)
from .base import BaseAdapter, Punch

_REGISTRY = {
    "generic": GenericAdapter,
    "zkteco": ZKTecoAdapter,
    "essl": ESSLAdapter,
    "suprema": SupremaAdapter,
    "hikvision": HikvisionAdapter,
    "mantra": MantraAdapter,
}


def get_adapter(brand):
    cls = _REGISTRY.get(brand)
    return cls() if cls else None


__all__ = ["get_adapter", "BaseAdapter", "Punch"]
