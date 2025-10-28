import { PullQueueConfig } from '../types/rules'

// Default Pull Queue Configuration
export const DEFAULT_PULL_QUEUE_CONFIG: PullQueueConfig = {
  escalationsFirst: true,
  maxQueueCapacity: 5,
  tatSafetyWindowHours: 12,
  departmentOrder: [
    ['Cardiology'], // Priority 1
    ['BH', 'Oncology'], // Priority 2 - parallel
    ['NICU', 'General'], // Priority 3 - parallel
  ],
}

// Sample departments - can be loaded from a dictionary/CSV in the future
export const AVAILABLE_DEPARTMENTS = [
  { code: 'Cardiology', name: 'Cardiology' },
  { code: 'BH', name: 'Behavioral Health' },
  { code: 'Oncology', name: 'Oncology' },
  { code: 'NICU', name: 'Neonatal Intensive Care' },
  { code: 'General', name: 'General Medicine' },
  { code: 'Pediatrics', name: 'Pediatrics' },
  { code: 'Surgery', name: 'Surgery' },
  { code: 'Emergency', name: 'Emergency Medicine' },
  { code: 'Radiology', name: 'Radiology' },
  { code: 'Neurology', name: 'Neurology' },
  { code: 'Orthopedics', name: 'Orthopedics' },
  { code: 'Dermatology', name: 'Dermatology' },
  { code: 'Gastroenterology', name: 'Gastroenterology' },
  { code: 'Pulmonology', name: 'Pulmonology' },
  { code: 'Endocrinology', name: 'Endocrinology' },
  { code: 'Rheumatology', name: 'Rheumatology' },
  { code: 'Nephrology', name: 'Nephrology' },
  { code: 'Urology', name: 'Urology' },
  { code: 'Ophthalmology', name: 'Ophthalmology' },
  { code: 'ENT', name: 'Ear, Nose & Throat' },
  { code: 'Psychiatry', name: 'Psychiatry' },
  { code: 'Anesthesiology', name: 'Anesthesiology' },
  { code: 'Pathology', name: 'Pathology' },
  { code: 'OB-GYN', name: 'Obstetrics & Gynecology' },
  { code: 'Physical-Therapy', name: 'Physical Therapy' },
  { code: 'Occupational-Therapy', name: 'Occupational Therapy' },
  { code: 'Speech-Therapy', name: 'Speech Therapy' },
  { code: 'Home-Health', name: 'Home Health' },
  { code: 'DME', name: 'Durable Medical Equipment' },
  { code: 'Lab', name: 'Laboratory Services' },
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
