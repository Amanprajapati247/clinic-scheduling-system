# Architecture Decision Records (ADRs)

## ADR 1: Finite State Machine Implementation
- **Context**: Medical appointments follow a non-linear lifecycle with strict clinical and administrative constraints (e.g. NoShow is only valid after scheduled time; cancellation is forbidden after check-in).
- **Decision**: Implemented an explicit server-side transition validator (`src/utils/stateMachine.ts`) evaluated before any status mutation.
- **Consequences**: Guarantees zero invalid state bypasses even if direct HTTP API calls are attempted. Provides human-readable error messages for rejected transitions.

---

## ADR 2: Append-Only Immutable Audit Timeline
- **Context**: Compliance and clinical dispute resolution require an untamperable audit record of every state transition, care team change, cancellation, and note authoring event.
- **Decision**: Created the `AppointmentTimeline` entity and `TimelineService` with only `create` and `findMany` methods. No update or delete endpoints exist in the codebase.
- **Consequences**: Complete regulatory audit readiness. Historical diffs (`oldValue`, `newValue`, `userId`, `timestamp`) are permanently preserved.

---

## ADR 3: Dual-Tier Unconfirmed Alert Engine (24h Warning & 1h Reappearance)
- **Context**: Front Desk staff need to be alerted of pending requested appointments scheduled within 24 hours. If dismissed but still unconfirmed within 1 hour of the appointment, the alert must forcefully reappear.
- **Decision**: Structured dismissal tracking into `AlertDismissal` categorized by `UNCONFIRMED_24H` and `UNCONFIRMED_1H`. A 24h dismissal does not suppress the 1h critical threshold.
- **Consequences**: Patients are not missed due to premature dismissal of early warnings; clinic reception receives critical reminders when appointment start is imminent.

---

## ADR 4: Care Team Multi-Provider Collaboration (M:N)
- **Context**: Complex clinical encounters frequently require consultation or assistance from multiple specialist providers while retaining a single primary scheduling physician.
- **Decision**: Modeled appointments with a primary `schedulingProviderId` foreign key and a separate `SupportingProvider` join table with compound unique constraint `[appointmentId, providerId]`.
- **Consequences**: Clean separation of primary billing/scheduling ownership while enabling multi-disciplinary care teams to view, contribute notes, and coordinate on cases.

---

## ADR 5: Author-Locked Clinical Visit Notes
- **Context**: Clinical liability dictates that notes authored by a medical practitioner must not be tampered with or edited by other providers or administrative staff.
- **Decision**: In `VisitNoteService.updateNote`, the backend strictly validates `req.user.providerId === note.providerId`. Non-authors receive an HTTP 403 Forbidden.
- **Consequences**: Ensures medico-legal compliance and integrity of medical practitioner records.
