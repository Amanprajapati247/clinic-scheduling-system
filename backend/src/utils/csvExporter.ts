export interface DailyScheduleRow {
  patient: string;
  provider: string;
  status: string;
  startTime: string;
  duration: number | string;
}

/**
 * Escapes CSV values and converts array of schedule records to standard RFC 4180 CSV string
 */
export const generateDailyScheduleCSV = (rows: DailyScheduleRow[]): string => {
  const headers = ['Patient', 'Provider', 'Status', 'Start Time', 'Duration (mins)'];
  
  const escapeCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.map(escapeCell).join(','),
    ...rows.map(r => [
      escapeCell(r.patient),
      escapeCell(r.provider),
      escapeCell(r.status),
      escapeCell(r.startTime),
      escapeCell(r.duration),
    ].join(',')),
  ];

  return csvRows.join('\r\n');
};
