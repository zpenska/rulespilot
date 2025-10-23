/**
 * TAT (Turnaround Time) Rule Configuration
 *
 * Defines fields and options specific to TAT rules for calculating service due date/time.
 * Also includes enterprise-level TAT configuration for pause functionality.
 */

import { SourceDateTimeField, UnitsOfMeasure, TATConfig } from '../types/rules'

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
  {
    code: 'STATUS_CHANGE_DATE_TIME',
    description: 'Status Change Date/Time',
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

// Date Operator Options
export const DATE_OPERATORS: Array<{
  code: string
  description: string
}> = [
  { code: '=', description: 'Equal to' },
  { code: '<', description: 'Less than' },
  { code: '>', description: 'Greater than' },
  { code: '<=', description: 'Less than or equal to' },
  { code: '>=', description: 'Greater than or equal to' },
]

// TAT Field Labels
export const TAT_FIELD_LABELS = {
  sourceDateTimeField: 'Source Date/Time Field',
  units: 'Units',
  unitsOfMeasure: 'Units of Measure',
  dueTime: 'Due Time',
  holidayDates: 'Holiday Dates',
  holidayCategory: 'Holiday Category',
  holidayOffset: 'Holiday Offset (Days)',
  clinicalsRequestedResponseThresholdHours: 'Clinicals Response Threshold (Hours)',
  dateOperator: 'Date Operator',
  autoExtend: 'Auto Extend',
  extendStatusReason: 'Extend Status Reason',
}

// TAT Field Descriptions
export const TAT_FIELD_DESCRIPTIONS = {
  sourceDateTimeField: 'The date/time field to use as the base for due date calculation',
  units: 'Number of units to add to the source date/time',
  unitsOfMeasure: 'Type of units to use for calculation',
  dueTime: 'Specific time for the due date (HH:MM format, e.g., 17:00). Leave empty to use calculated time.',
  holidayDates: 'List of holiday dates in YYYYMMDD format (e.g., 20251225)',
  holidayCategory: 'Holiday category code for referencing pre-defined holiday sets (e.g., SKIPHDAY_CTGY_1)',
  holidayOffset: 'Number of days to offset if due date falls on a holiday',
  clinicalsRequestedResponseThresholdHours: 'Hours threshold for provider response. If exceeded, TAT clock resets.',
  dateOperator: 'Date comparison operator for conditional logic on source date (e.g., >= for "on or after")',
  autoExtend: 'Enable automatic due date extension when specific conditions are met',
  extendStatusReason: 'Status reason code that triggers the automatic extension (e.g., 45DNOCLIN)',
}

// TAT Pause Configuration
export const DEFAULT_TAT_CONFIG: TATConfig = {
  pauseStatusReasons: []
}

// TAT Pause Description
export const TAT_PAUSE_DESCRIPTION =
  'Select status reasons that will pause the TAT clock. When a request enters one of these statuses, the TAT timer will stop until the status changes to a non-pause reason.'
