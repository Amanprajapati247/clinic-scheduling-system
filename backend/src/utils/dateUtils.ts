/**
 * Combine YYYY-MM-DD and HH:mm into a Date object
 */
export const parseSlotDateTime = (dateStr: string, timeStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

/**
 * Check if the given date + start time has already passed relative to now
 */
export const isAppointmentTimePassed = (dateStr: string, startTimeStr: string, referenceTime = new Date()): boolean => {
  const appointmentStart = parseSlotDateTime(dateStr, startTimeStr);
  return referenceTime.getTime() > appointmentStart.getTime();
};

/**
 * Calculate end time given start time string (HH:mm) and duration in minutes
 */
export const calculateEndTime = (startTimeStr: string, durationMinutes: number): string => {
  const [hours, minutes] = startTimeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
};

/**
 * Convert time string HH:mm to minutes from midnight for interval math
 */
export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Format Date to YYYY-MM-DD
 */
export const formatDateToISO = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
