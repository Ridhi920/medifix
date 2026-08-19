"""Digital Logbook helper.

`log_activity` appends a single timeline row (see `DigitalLogEntry`). It is
intentionally best-effort: writing a timeline entry must never break the
business action it accompanies, so any failure is swallowed and logged to
stderr rather than raised.

Typical usage — add the entry to the SAME session as the main change so both
persist atomically on the caller's commit::

    log_activity(session, action="Appointment Booked", module="Appointments",
                 actor=user.full_name, actor_user_id=user.id,
                 entity_type="Appointment", entity_id=appt.id,
                 provider_id=doctor.id, patient_id=user.id)
    session.commit()
"""

from __future__ import annotations

import json
import logging
from typing import Any

from sqlmodel import Session

from ..models import DigitalLogEntry

logger = logging.getLogger("medefix.logbook")


def log_activity(
    session: Session,
    *,
    action: str,
    module: str,
    actor: str = "System",
    actor_user_id: int | None = None,
    entity_type: str | None = None,
    entity_id: int | None = None,
    provider_id: int | None = None,
    patient_id: int | None = None,
    meta: dict[str, Any] | None = None,
    commit: bool = False,
) -> DigitalLogEntry | None:
    """Append one Digital Logbook entry.

    By default the entry is only added to `session`; the caller commits it
    alongside their own change. Pass ``commit=True`` to flush immediately
    (useful from a standalone context). Returns the entry, or ``None`` if
    logging failed.
    """
    try:
        entry = DigitalLogEntry(
            actor=actor,
            actor_user_id=actor_user_id,
            action=action,
            module=module,
            entity_type=entity_type,
            entity_id=entity_id,
            provider_id=provider_id,
            patient_id=patient_id,
            meta=json.dumps(meta or {}),
        )
        session.add(entry)
        if commit:
            session.commit()
            session.refresh(entry)
        return entry
    except Exception:  # never let logging break the primary operation
        logger.exception("Failed to write Digital Logbook entry: %s / %s", module, action)
        return None
