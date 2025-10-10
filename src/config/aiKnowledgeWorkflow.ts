/**
 * AI Knowledge Base for Workflow Rules
 * Workflow rules automate routing, department assignment, letter generation, and request closure
 */

export const AI_KNOWLEDGE_WORKFLOW = `
# Workflow Rules - AI Assistant Guide

## What are Workflow Rules?
Workflow rules automate business processes by routing requests, generating letters, assigning departments, and closing requests based on matching criteria.

## Example Workflow Rules

### Example 1: Auto-Route Outpatient Requests
"Route all outpatient requests to the outpatient review department"

**Result:**
{
  "ruleDesc": "Route outpatient requests to outpatient review department",
  "standardFieldCriteria": [
    {"field": "REQUEST_TYPE", "operator": "IN", "values": ["OUTPATIENT"]}
  ],
  "customFieldCriteria": [],
  "isActive": true,
  "weight": 100,
  "actions": {
    "departmentRouting": { "departmentCode": "OUTPATIENT_REVIEW" }
  }
}

### Example 2: High-Risk Member Notifications
"For members with high risk scores requesting surgery, generate notification letter and add review hint"

**Result:**
{
  "ruleDesc": "High-risk surgical requests require notification and review",
  "standardFieldCriteria": [
    {"field": "SERVICE_TREATMENT_TYPE", "operator": "IN", "values": ["SURGERY"]}
  ],
  "customFieldCriteria": [
    {
      "association": "MEMBER",
      "templateId": "RISK_SCORE",
      "operator": "IN",
      "values": ["HIGH", "CRITICAL"]
    }
  ],
  "isActive": true,
  "weight": 500,
  "actions": {
    "generateLetters": [{ "letterName": "High Risk Notification" }],
    "hints": { "message": "Review complete medical history for high-risk member" }
  }
}

### Example 3: Auto-Close Routine Preventive Care
"Automatically approve and close routine preventive care requests for commercial members"

**Result:**
{
  "ruleDesc": "Auto-approve routine preventive care for commercial members",
  "standardFieldCriteria": [
    {"field": "REQUEST_CLASSIFICATION", "operator": "IN", "values": ["PREVENTIVE"]},
    {"field": "ENROLLMENT_LINE_OF_BUSINESS", "operator": "IN", "values": ["COMMERCIAL"]},
    {"field": "REQUEST_URGENCY", "operator": "IN", "values": ["ROUTINE"]}
  ],
  "customFieldCriteria": [],
  "isActive": true,
  "weight": 300,
  "actions": {
    "close": { "dispositionCode": "AUTO_APPROVED" },
    "generateLetters": [{ "letterName": "Preventive Care Approval" }]
  }
}

### Example 4: Complex Multi-Department Routing
"Behavioral health requests with prior denials route to clinical review and generate appeal letter"

**Result:**
{
  "ruleDesc": "Behavioral health with prior denials to clinical review",
  "standardFieldCriteria": [
    {"field": "REQUEST_CLASSIFICATION", "operator": "IN", "values": ["BEHAVIORAL_HEALTH"]},
    {"field": "REVIEW_OUTCOME_STATUS", "operator": "IN", "values": ["DENY"]}
  ],
  "customFieldCriteria": [
    {
      "association": "REQUEST",
      "templateId": "PRIOR_DENIAL_COUNT",
      "operator": "IN",
      "values": ["1", "2", "3"]
    }
  ],
  "isActive": true,
  "weight": 600,
  "actions": {
    "departmentRouting": { "departmentCode": "CLINICAL_REVIEW" },
    "generateLetters": [{ "letterName": "Appeal Rights Notification" }],
    "hints": { "message": "Review prior denial rationale and updated clinical information" }
  }
}

### Example 5: Multi-Action Workflow
"Emergency inpatient admissions route to utilization review, generate tracking letter, and add monitoring hint"

**Result:**
{
  "ruleDesc": "Emergency inpatient admissions to UR with tracking",
  "standardFieldCriteria": [
    {"field": "REQUEST_TYPE", "operator": "IN", "values": ["INPATIENT"]},
    {"field": "REQUEST_URGENCY", "operator": "IN", "values": ["EMERGENCY"]},
    {"field": "REQUEST_TREATMENT_SETTING", "operator": "IN", "values": ["HOSPITAL_INPATIENT"]}
  ],
  "customFieldCriteria": [],
  "isActive": true,
  "weight": 800,
  "actions": {
    "departmentRouting": { "departmentCode": "UTILIZATION_REVIEW" },
    "generateLetters": [{ "letterName": "ER Admission Tracking" }],
    "hints": { "message": "Monitor for appropriate level of care and discharge planning" }
  }
}

## Custom Field Examples (NOT SITUS_STATE)

Better custom field examples:
- **RISK_SCORE**: Member health risk level (LOW, MEDIUM, HIGH, CRITICAL)
- **CASE_MANAGEMENT_STATUS**: Enrolled in case management (ACTIVE, INACTIVE, PENDING)
- **PRIOR_AUTH_HISTORY**: Historical authorization patterns (FREQUENT_USER, FIRST_TIME, REPEAT_DENIAL)
- **DISEASE_PROGRAM**: Enrolled disease management programs (DIABETES, CHF, COPD, ASTHMA)
- **NETWORK_TIER**: Provider network tier preference (TIER1, TIER2, OUT_OF_NETWORK)
- **MEMBER_VIP_STATUS**: VIP or special handling flag (VIP, STANDARD, PRIORITY)

### Custom Field Example
"Members enrolled in diabetes programs requiring imaging should route to specialty review"

{
  "ruleDesc": "Diabetes program members needing imaging to specialty review",
  "standardFieldCriteria": [
    {"field": "SERVICE_CODE", "operator": "IN", "values": ["70450", "70551", "72148"]}
  ],
  "customFieldCriteria": [
    {
      "association": "MEMBER",
      "templateId": "DISEASE_PROGRAM",
      "operator": "IN",
      "values": ["DIABETES"]
    }
  ],
  "isActive": true,
  "weight": 400,
  "actions": {
    "departmentRouting": { "departmentCode": "SPECIALTY_REVIEW" }
  }
}

## Available Actions for Workflow Rules

1. **departmentRouting** - Route to specific department
2. **close** - Auto-close with disposition code
3. **generateLetters** - Generate one or more notification letters
4. **hints** - Add review guidance for staff

## Response Format

Return JSON with:
- ruleDesc
- standardFieldCriteria (operator, field, values, providerRole if needed)
- customFieldCriteria (optional)
- isActive: true
- weight: 100-1000
- actions: { departmentRouting, close, generateLetters, hints }
`

export default AI_KNOWLEDGE_WORKFLOW
