import { AppointmentStatus, ALLOWED_TRANSITIONS } from '../config/constants';
import { isAppointmentTimePassed } from './dateUtils';

export interface StateTransitionValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface StateTransitionContext {
  currentStatus: string;
  targetStatus: string;
  slotDate: string;
  slotStartTime: string;
  cancellationReason?: string;
}

/**
 * Validates appointment status transitions according to strict business state machine rules.
 */
export const validateStatusTransition = (
  context: StateTransitionContext
): StateTransitionValidationResult => {
  const { currentStatus, targetStatus, slotDate, slotStartTime, cancellationReason } = context;

  // 1. Same status is a no-op / invalid transition
  if (currentStatus === targetStatus) {
    return {
      isValid: false,
      errorMessage: `Appointment is already in ${currentStatus} status.`,
    };
  }

  // 2. Check if current status is terminal
  if (
    currentStatus === AppointmentStatus.Completed ||
    currentStatus === AppointmentStatus.NoShow ||
    currentStatus === AppointmentStatus.Cancelled
  ) {
    return {
      isValid: false,
      errorMessage: `Cannot transition from terminal status '${currentStatus}'.`,
    };
  }

  // 3. Check allowed transition graph
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      isValid: false,
      errorMessage: `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed next statuses: [${allowedNext.join(', ')}].`,
    };
  }

  // 4. Special rule for NoShow: only permitted AFTER scheduled time has passed
  if (targetStatus === AppointmentStatus.NoShow) {
    const hasPassed = isAppointmentTimePassed(slotDate, slotStartTime);
    if (!hasPassed) {
      return {
        isValid: false,
        errorMessage: `Cannot mark appointment as NoShow before the scheduled appointment start time (${slotDate} ${slotStartTime}).`,
      };
    }
  }

  // 5. Special rule for Cancelled: allowed only before CheckedIn and requires reason
  if (targetStatus === AppointmentStatus.Cancelled) {
    if (currentStatus === AppointmentStatus.CheckedIn) {
      return {
        isValid: false,
        errorMessage: `Cancellation is prohibited once the patient has CheckedIn.`,
      };
    }

    if (!cancellationReason || cancellationReason.trim().length === 0) {
      return {
        isValid: false,
        errorMessage: `A valid cancellation reason is required to cancel an appointment.`,
      };
    }
  }

  return { isValid: true };
};
