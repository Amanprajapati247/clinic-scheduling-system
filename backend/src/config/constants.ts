export enum Role {
  FRONT_DESK = 'FRONT_DESK',
  PROVIDER = 'PROVIDER',
}

export enum AppointmentStatus {
  Requested = 'Requested',
  Confirmed = 'Confirmed',
  CheckedIn = 'CheckedIn',
  Completed = 'Completed',
  NoShow = 'NoShow',
  Cancelled = 'Cancelled',
}

export enum TimelineActionType {
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  STATUS_CHANGE = 'STATUS_CHANGE',
  SUPPORTING_PROVIDER_ADDED = 'SUPPORTING_PROVIDER_ADDED',
  SUPPORTING_PROVIDER_REMOVED = 'SUPPORTING_PROVIDER_REMOVED',
  CANCELLATION = 'CANCELLATION',
  VISIT_NOTE_CREATED = 'VISIT_NOTE_CREATED',
  APPOINTMENT_REASSIGNED = 'APPOINTMENT_REASSIGNED',
}

export enum AlertType {
  UNCONFIRMED_24H = 'UNCONFIRMED_24H',
  UNCONFIRMED_1H = 'UNCONFIRMED_1H',
}

/**
 * Valid Status Transitions Matrix:
 * Requested -> Confirmed, Cancelled
 * Confirmed -> CheckedIn, NoShow (if time passed), Cancelled
 * CheckedIn -> Completed
 * Completed -> (Final)
 * NoShow -> (Final)
 * Cancelled -> (Final)
 */
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  [AppointmentStatus.Requested]: [AppointmentStatus.Confirmed, AppointmentStatus.Cancelled],
  [AppointmentStatus.Confirmed]: [AppointmentStatus.CheckedIn, AppointmentStatus.NoShow, AppointmentStatus.Cancelled],
  [AppointmentStatus.CheckedIn]: [AppointmentStatus.Completed],
  [AppointmentStatus.Completed]: [],
  [AppointmentStatus.NoShow]: [],
  [AppointmentStatus.Cancelled]: [],
};
