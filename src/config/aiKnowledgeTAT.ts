/**
 * AI Knowledge Base for TAT (Turnaround Time) Rules
 * TAT rules calculate service due date/time for authorization decisions
 */

export const AI_KNOWLEDGE_TAT = `
# TAT (Turnaround Time) Rules - AI Assistant Guide

## What are TAT Rules?
TAT rules calculate when authorization decisions are due based on request characteristics, regulatory requirements, and business rules. They define turnaround time expectations and handle holiday/weekend adjustments.

## TAT Rule Components

**Required Fields:**
- sourceDateTimeField: Which date to start from (NOTIFICATION_DATE_TIME, REQUEST_DATE_TIME, RECEIPT_DATE_TIME, RECEIVED_DATE_TIME)
- units: How many units to add
- unitsOfMeasure: HOURS, CALENDAR_DAYS, or BUSINESS_DAYS

**Optional Fields:**
- dueTime: Specific time for due date (e.g., "17:00" for 5PM)
- holidayDates: Array of holidays in YYYYMMDD format
- holidayOffset: Days to extend if due date falls on holiday
- clinicalsRequestedResponseThresholdHours: Hours threshold for provider clinical response

## Example TAT Rules

### Example 1: Standard Commercial 72 Hours
"Commercial members need authorization decisions within 72 hours from notification"

**Result:**
{
  "ruleDesc": "Commercial authorizations - 72 hours from notification",
  "standardFieldCriteria": [
    {"field": "ENROLLMENT_LINE_OF_BUSINESS", "values": ["COMMERCIAL"]}
  ],
  "customFieldCriteria": null,
  "isActive": true,
  "weight": 100,
  "sourceDateTimeField": "NOTIFICATION_DATE_TIME",
  "units": 72,
  "unitsOfMeasure": "HOURS",
  "dueTime": null,
  "holidayDates": [],
  "holidayOffset": null,
  "clinicalsRequestedResponseThresholdHours": null
}

### Example 2: Urgent Care 24 Hours
"Urgent requests require 24-hour turnaround from notification with 4-hour clinical response threshold"

**Result:**
{
  "ruleDesc": "Urgent requests - 24 hours with 4-hour clinical threshold",
  "standardFieldCriteria": [
    {"field": "REQUEST_URGENCY", "values": ["URGENT"]}
  ],
  "customFieldCriteria": null,
  "isActive": true,
  "weight": 800,
  "sourceDateTimeField": "NOTIFICATION_DATE_TIME",
  "units": 24,
  "unitsOfMeasure": "HOURS",
  "dueTime": null,
  "holidayDates": [],
  "holidayOffset": null,
  "clinicalsRequestedResponseThresholdHours": 4
}

### Example 3: Medicare 14 Business Days
"Medicare Advantage members get 14 business days ending at 5PM, excluding federal holidays"

**Result:**
{
  "ruleDesc": "Medicare Advantage - 14 business days by 5PM",
  "standardFieldCriteria": [
    {"field": "ENROLLMENT_PLAN", "values": ["MEDICARE_ADVANTAGE"]}
  ],
  "customFieldCriteria": null,
  "isActive": true,
  "weight": 500,
  "sourceDateTimeField": "REQUEST_DATE_TIME",
  "units": 14,
  "unitsOfMeasure": "BUSINESS_DAYS",
  "dueTime": "17:00",
  "holidayDates": ["20251225", "20260101", "20260531", "20260704"],
  "holidayOffset": 1,
  "clinicalsRequestedResponseThresholdHours": 48
}

### Example 4: Expedited Review
"Expedited reviews need 48 hours from receipt, with 1-day holiday extension"

**Result:**
{
  "ruleDesc": "Expedited reviews - 48 hours with holiday extension",
  "standardFieldCriteria": [
    {"field": "REQUEST_URGENCY", "values": ["EXPEDITED"]},
    {"field": "REQUEST_TYPE", "values": ["INPATIENT", "OUTPATIENT"]}
  ],
  "customFieldCriteria": null,
  "isActive": true,
  "weight": 700,
  "sourceDateTimeField": "RECEIPT_DATE_TIME",
  "units": 48,
  "unitsOfMeasure": "HOURS",
  "dueTime": null,
  "holidayDates": ["20251225", "20260101"],
  "holidayOffset": 1,
  "clinicalsRequestedResponseThresholdHours": 24
}

### Example 5: State-Specific (California)
"California members with complex conditions get 3 business days by 5PM Pacific"

**Result:**
{
  "ruleDesc": "California complex cases - 3 business days by 5PM",
  "standardFieldCriteria": [
    {"field": "MEMBER_STATE", "values": ["CA"]}
  ],
  "customFieldCriteria": [
    {
      "values": ["COMPLEX", "HIGH_ACUITY"],
      "association": "MEMBER",
      "templateId": "CASE_COMPLEXITY"
    }
  ],
  "isActive": true,
  "weight": 600,
  "sourceDateTimeField": "NOTIFICATION_DATE_TIME",
  "units": 3,
  "unitsOfMeasure": "BUSINESS_DAYS",
  "dueTime": "17:00",
  "holidayDates": ["20251225", "20260101"],
  "holidayOffset": null,
  "clinicalsRequestedResponseThresholdHours": 24
}

### Example 6: Behavioral Health Priority
"Behavioral health crisis needs 8-hour turnaround with 2-hour clinical threshold"

**Result:**
{
  "ruleDesc": "Behavioral health crisis - 8 hours",
  "standardFieldCriteria": [
    {"field": "REQUEST_CLASSIFICATION", "values": ["BEHAVIORAL_HEALTH"]},
    {"field": "REQUEST_URGENCY", "values": ["EMERGENCY", "CRISIS"]}
  ],
  "customFieldCriteria": null,
  "isActive": true,
  "weight": 900,
  "sourceDateTimeField": "NOTIFICATION_DATE_TIME",
  "units": 8,
  "unitsOfMeasure": "HOURS",
  "dueTime": null,
  "holidayDates": [],
  "holidayOffset": null,
  "clinicalsRequestedResponseThresholdHours": 2
}

### Example 7: Post-Acute Standard
"Skilled nursing and home health get 5 calendar days ending at 5PM"

**Result:**
{
  "ruleDesc": "SNF and home health - 5 calendar days by 5PM",
  "standardFieldCriteria": [
    {"field": "REQUEST_TREATMENT_SETTING", "values": ["SNF", "HOME_HEALTH"]}
  ],
  "customFieldCriteria": null,
  "isActive": true,
  "weight": 300,
  "sourceDateTimeField": "REQUEST_DATE_TIME",
  "units": 5,
  "unitsOfMeasure": "CALENDAR_DAYS",
  "dueTime": "17:00",
  "holidayDates": [],
  "holidayOffset": null,
  "clinicalsRequestedResponseThresholdHours": null
}

### Example 8: Oncology Fast Track
"Cancer treatment prior authorizations need 24-hour decision with 6-hour clinical response"

**Result:**
{
  "ruleDesc": "Oncology prior auth - 24 hours with 6-hour threshold",
  "standardFieldCriteria": [
    {"field": "REQUEST_DIAGNOSIS_CODE", "values": ["C50", "C18", "C34", "C61", "C20"]},
    {"field": "SERVICE_TREATMENT_TYPE", "values": ["CHEMOTHERAPY", "RADIATION", "SURGERY"]}
  ],
  "customFieldCriteria": null,
  "isActive": true,
  "weight": 850,
  "sourceDateTimeField": "NOTIFICATION_DATE_TIME",
  "units": 24,
  "unitsOfMeasure": "HOURS",
  "dueTime": null,
  "holidayDates": [],
  "holidayOffset": null,
  "clinicalsRequestedResponseThresholdHours": 6
}

## Custom Field Examples for TAT

Better custom field examples:
- **CASE_COMPLEXITY**: Case complexity affects turnaround (SIMPLE, MODERATE, COMPLEX, HIGH_ACUITY)
- **REGULATORY_PRIORITY**: Regulatory-driven urgency (STANDARD, PRIORITY, STAT)
- **MEMBER_TIER**: Member tier affecting service levels (BASIC, ENHANCED, PREMIUM)
- **PROVIDER_NETWORK_STATUS**: In/out of network affects processing (IN_NETWORK, OUT_OF_NETWORK, TIER2)

## Important Notes for TAT Rules

1. **No operator field** - TAT criteria don't include operator (automatically "IN")
2. **sourceDateTimeField** - When to start counting (notification, request, receipt, received)
3. **unitsOfMeasure**:
   - HOURS: Continuous hours including nights/weekends
   - CALENDAR_DAYS: All days including weekends
   - BUSINESS_DAYS: Weekdays only, excludes weekends and holidays
4. **dueTime**: Set to "17:00" for 5PM deadline, null for calculated time
5. **holidayDates**: YYYYMMDD format (e.g., "20251225" for Christmas 2025)
6. **clinicalsRequestedResponseThresholdHours**: How long to wait for provider clinical info before TAT reset

## Typical TAT Timeframes

- **Emergency/Crisis**: 4-8 hours
- **Urgent**: 24-48 hours
- **Expedited**: 48-72 hours
- **Standard**: 72 hours - 5 business days
- **Routine**: 7-14 business days
- **Administrative**: 30 days

## Response Format

Return JSON with:
- sourceDateTimeField (required)
- units (required, number)
- unitsOfMeasure (required: HOURS, CALENDAR_DAYS, or BUSINESS_DAYS)
- dueTime (optional, "HH:MM" format)
- holidayDates (optional, array of "YYYYMMDD" strings)
- holidayOffset (optional, number of days)
- clinicalsRequestedResponseThresholdHours (optional, number)
- ruleDesc
- standardFieldCriteria (field, values - NO operator)
- customFieldCriteria (values, association, templateId - NO operator)
- isActive: true
- weight: 100-1000
`

export default AI_KNOWLEDGE_TAT
