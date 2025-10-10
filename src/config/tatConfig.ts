/**
 * TAT (Turnaround Time) Rule Configuration
 *
 * Defines fields and options specific to TAT rules for calculating service due date/time.
 */

import { SourceDateTimeField, UnitsOfMeasure } from '../types/rules'

// Source Date/Time Field Options
export const SOURCE_DATE_TIME_FIELDS: Array<{
  code: SourceDateTimeField
  description: string
}> = [
  {
    code: 'NOTIFICATION_DATE_TIME',
    description: 'Notification Date/Time',
  },
  {
    code: 'REQUEST_DATE_TIME',
    description: 'Request Date/Time',
  },
  {
    code: 'RECEIPT_DATE_TIME',
    description: 'Receipt Date/Time',
  },
  {
    code: 'RECEIVED_DATE_TIME',
    description: 'Received Date/Time',
  },
]

// Units of Measure Options
export const UNITS_OF_MEASURE: Array<{
  code: UnitsOfMeasure
  description: string
}> = [
  {
    code: 'HOURS',
    description: 'Hours',
  },
  {
    code: 'CALENDAR_DAYS',
    description: 'Calendar Days',
  },
  {
    code: 'BUSINESS_DAYS',
    description: 'Business Days (excludes weekends & holidays)',
  },
]

// TAT Field Labels
export const TAT_FIELD_LABELS = {
  sourceDateTimeField: 'Source Date/Time Field',
  units: 'Units',
  unitsOfMeasure: 'Units of Measure',
  dueTime: 'Due Time',
  holidayDates: 'Holiday Dates',
  holidayOffset: 'Holiday Offset (Days)',
  clinicalsRequestedResponseThresholdHours: 'Clinicals Response Threshold (Hours)',
}

// TAT Field Descriptions
export const TAT_FIELD_DESCRIPTIONS = {
  sourceDateTimeField: 'The date/time field to use as the base for due date calculation',
  units: 'Number of units to add to the source date/time',
  unitsOfMeasure: 'Type of units to use for calculation',
  dueTime: 'Specific time for the due date (HH:MM format, e.g., 17:00). Leave empty to use calculated time.',
  holidayDates: 'List of holiday dates in YYYYMMDD format (e.g., 20251225)',
  holidayOffset: 'Number of days to offset if due date falls on a holiday',
  clinicalsRequestedResponseThresholdHours: 'Hours threshold for provider response. If exceeded, TAT clock resets.',
}
