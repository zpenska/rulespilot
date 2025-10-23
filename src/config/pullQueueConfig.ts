import { PullQueueConfig } from '../types/rules'

// Default Pull Queue Configuration
export const DEFAULT_PULL_QUEUE_CONFIG: PullQueueConfig = {
  escalationsFirst: true,
  maxQueueCapacity: 5,
  tatSafetyWindowHours: 12,
  departmentOrder: ['Cardiology', 'BH', 'Oncology', 'NICU', 'General'],
}

// Sample departments - can be loaded from a dictionary/CSV in the future
export const AVAILABLE_DEPARTMENTS = [
  { code: 'Cardiology', name: 'Cardiology' },
  { code: 'BH', name: 'Behavioral Health' },
  { code: 'Oncology', name: 'Oncology' },
  { code: 'NICU', name: 'NICU' },
  { code: 'General', name: 'General' },
  { code: 'Pediatrics', name: 'Pediatrics' },
  { code: 'Surgery', name: 'Surgery' },
  { code: 'Emergency', name: 'Emergency' },
  { code: 'Radiology', name: 'Radiology' },
]

// Pull Queue Logic Description
export const PULL_QUEUE_LOGIC = `
Priority Order for Prior Auth Work:

1. TAT Safety - Items due within configured TAT window are pulled first
2. Escalation - If enabled, escalated items take priority (after TAT safety)
3. Department Priority - Work is pulled based on admin-defined department order
4. Within Department - Items are sorted by soonest TAT

Note: Users can only pull items matching their Skills and Licenses.
`
