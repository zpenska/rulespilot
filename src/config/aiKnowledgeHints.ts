/**
 * AI Knowledge Base for Hints Rules
 * Hints rules display contextual messages and alerts to users during request review
 */

export const AI_KNOWLEDGE_HINTS = `
# Hints Rules - AI Assistant Guide

## What are Hints Rules?
Hints rules display contextual messages, alerts, and guidance to users when specific conditions are met. They help ensure reviewers have important information at the right time.

## Hints Rule Structure

A hints rule consists of:
- **ruleDesc**: Clear description of when/why the hint displays
- **standardFieldCriteria**: Conditions that trigger the hint
- **customFieldCriteria**: Optional custom field conditions
- **weight**: Priority (higher = processed first)
- **status**: 'active' or 'inactive'
- **hints**: The message configuration with:
  - **message**: The text to display (required)
  - **displayLocation**: Where to show (MEMBER, PROVIDER, SERVICES, DIAGNOSIS)
  - **context**: Additional context tags (optional)
  - **color**: Visual emphasis (RED, YELLOW, GREEN, BLUE)

## Example Hints Rules

### Example 1: High-Risk Member Alert
"Show red alert for members with high risk scores"

**Result:**
{
  "ruleDesc": "High-risk member alert",
  "standardFieldCriteria": [],
  "customFieldCriteria": [
    {
      "association": "MEMBER",
      "templateId": "RISK_SCORE",
      "operator": "IN",
      "values": ["HIGH", "CRITICAL"]
    }
  ],
  "isActive": true,
  "weight": 800,
  "hints": {
    "message": "⚠️ High-risk member - review complete medical history and recent hospitalizations",
    "displayLocation": "MEMBER",
    "color": "RED"
  }
}

### Example 2: Prior Authorization Required
"Alert reviewers when diagnosis codes typically require prior authorization"

**Result:**
{
  "ruleDesc": "Prior auth required for expensive diagnosis codes",
  "standardFieldCriteria": [
    {"field": "REQUEST_DIAGNOSIS_CODE", "operator": "IN", "values": ["C34", "C50", "C18", "C61"]}
  ],
  "customFieldCriteria": [],
  "isActive": true,
  "weight": 600,
  "hints": {
    "message": "Prior authorization typically required for this diagnosis. Verify PA on file.",
    "displayLocation": "DIAGNOSIS",
    "color": "YELLOW"
  }
}

### Example 3: Provider Network Status
"Warn if provider is out of network"

**Result:**
{
  "ruleDesc": "Out-of-network provider warning",
  "standardFieldCriteria": [
    {"field": "PROVIDER_SET", "providerRole": "SERVICING", "operator": "IN", "values": ["OUT_OF_NETWORK"]}
  ],
  "customFieldCriteria": [],
  "isActive": true,
  "weight": 700,
  "hints": {
    "message": "⚠️ Out-of-network provider - verify member benefits and obtain authorization",
    "displayLocation": "PROVIDER",
    "color": "RED"
  }
}

### Example 4: Urgent Request Reminder
"Remind reviewers about expedited timelines for urgent requests"

**Result:**
{
  "ruleDesc": "Urgent request timeline reminder",
  "standardFieldCriteria": [
    {"field": "REQUEST_URGENCY", "operator": "IN", "values": ["URGENT", "EMERGENCY"]}
  ],
  "customFieldCriteria": [],
  "isActive": true,
  "weight": 750,
  "hints": {
    "message": "⏰ Urgent request - decision required within 24 hours per regulatory requirements",
    "displayLocation": "SERVICES",
    "color": "YELLOW"
  }
}

### Example 5: Pediatric Considerations
"Display guidance for pediatric cases"

**Result:**
{
  "ruleDesc": "Pediatric review guidance",
  "standardFieldCriteria": [
    {"field": "MEMBER_AGE", "operator": "LESS_THAN", "values": ["18"]}
  ],
  "customFieldCriteria": [],
  "isActive": true,
  "weight": 500,
  "hints": {
    "message": "Pediatric case - consider age-appropriate dosing, weight-based calculations, and developmental stage",
    "displayLocation": "MEMBER",
    "color": "BLUE"
  }
}

### Example 6: Medicare Advantage Compliance
"Compliance reminder for Medicare Advantage members"

**Result:**
{
  "ruleDesc": "Medicare Advantage compliance reminder",
  "standardFieldCriteria": [
    {"field": "ENROLLMENT_LINE_OF_BUSINESS", "operator": "IN", "values": ["MEDICARE_ADVANTAGE"]},
    {"field": "REQUEST_TYPE", "operator": "IN", "values": ["INPATIENT"]}
  ],
  "customFieldCriteria": [],
  "isActive": true,
  "weight": 650,
  "hints": {
    "message": "Medicare Advantage inpatient - ensure compliance with CMS guidelines and timely notification requirements",
    "displayLocation": "SERVICES",
    "color": "YELLOW"
  }
}

### Example 7: Experimental Treatment Warning
"Flag experimental or investigational treatments"

**Result:**
{
  "ruleDesc": "Experimental treatment warning",
  "standardFieldCriteria": [
    {"field": "SERVICE_CODE", "operator": "IN", "values": ["0001U", "0002U", "0003M"]}
  ],
  "customFieldCriteria": [
    {
      "association": "REQUEST",
      "templateId": "TREATMENT_STATUS",
      "operator": "IN",
      "values": ["EXPERIMENTAL", "INVESTIGATIONAL"]
    }
  ],
  "isActive": true,
  "weight": 900,
  "hints": {
    "message": "⚠️ Experimental/investigational treatment - verify coverage policy and clinical trial status",
    "displayLocation": "SERVICES",
    "color": "RED"
  }
}

### Example 8: Duplicate Request Check
"Alert for potential duplicate requests"

**Result:**
{
  "ruleDesc": "Duplicate request alert",
  "standardFieldCriteria": [],
  "customFieldCriteria": [
    {
      "association": "REQUEST",
      "templateId": "DUPLICATE_CHECK_FLAG",
      "operator": "IN",
      "values": ["POTENTIAL_DUPLICATE"]
    }
  ],
  "isActive": true,
  "weight": 850,
  "hints": {
    "message": "⚠️ Potential duplicate request detected - review recent submissions for this member",
    "displayLocation": "SERVICES",
    "color": "YELLOW"
  }
}

### Example 9: State-Specific Requirements
"Display state-specific regulatory requirements"

**Result:**
{
  "ruleDesc": "State-specific regulatory requirements for PA",
  "standardFieldCriteria": [
    {"field": "MEMBER_STATE", "operator": "IN", "values": ["PA", "NY", "CA"]}
  ],
  "customFieldCriteria": [],
  "isActive": true,
  "weight": 600,
  "hints": {
    "message": "State-specific requirements apply - verify compliance with state regulations and notification timelines",
    "displayLocation": "MEMBER",
    "color": "BLUE"
  }
}

### Example 10: High-Cost Service Alert
"Flag high-cost services for additional review"

**Result:**
{
  "ruleDesc": "High-cost service review",
  "standardFieldCriteria": [
    {"field": "SERVICE_REQUESTED_UNITS", "operator": "GREATER_THAN", "values": ["100"]}
  ],
  "customFieldCriteria": [
    {
      "association": "REQUEST",
      "templateId": "ESTIMATED_COST",
      "operator": "IN",
      "values": ["HIGH", "VERY_HIGH"]
    }
  ],
  "isActive": true,
  "weight": 700,
  "hints": {
    "message": "💰 High-cost service - verify medical necessity and consider cost-effective alternatives",
    "displayLocation": "SERVICES",
    "color": "YELLOW"
  }
}

## Display Locations

- **MEMBER**: Shows on member demographics section
- **PROVIDER**: Shows on provider information section
- **SERVICES**: Shows on services/treatment section
- **DIAGNOSIS**: Shows on diagnosis codes section

## Message Colors

- **RED**: Critical alerts, compliance issues, high-risk situations
- **YELLOW**: Important reminders, warnings, considerations
- **GREEN**: Positive confirmations, approvals, go-ahead signals
- **BLUE**: Informational notes, helpful tips, guidance

## Custom Field Examples for Hints

Common custom fields for hints:
- **RISK_SCORE**: Member risk level (LOW, MEDIUM, HIGH, CRITICAL)
- **TREATMENT_STATUS**: Treatment category (EXPERIMENTAL, INVESTIGATIONAL, STANDARD)
- **DUPLICATE_CHECK_FLAG**: Duplicate detection (POTENTIAL_DUPLICATE, CLEAR)
- **ESTIMATED_COST**: Cost category (LOW, MEDIUM, HIGH, VERY_HIGH)
- **COMPLIANCE_FLAG**: Regulatory compliance markers
- **PRIOR_DENIAL_COUNT**: Number of previous denials

## Important Notes for Hints Rules

1. Hints are informational - they don't block or auto-process requests
2. Use appropriate colors to indicate severity/importance
3. Keep messages concise but actionable
4. Higher weights (700-900) for critical compliance/safety alerts
5. Medium weights (500-600) for standard reminders
6. Display location should match where the user needs the information most

## Response Format

Return JSON with:
- ruleDesc: Clear description
- standardFieldCriteria: Field conditions (operator, field, values, providerRole if needed)
- customFieldCriteria: Optional custom conditions
- isActive: true
- weight: 500-900
- hints: {
    message: string (required),
    displayLocation: "MEMBER" | "PROVIDER" | "SERVICES" | "DIAGNOSIS",
    color: "RED" | "YELLOW" | "GREEN" | "BLUE"
  }
`

export default AI_KNOWLEDGE_HINTS
