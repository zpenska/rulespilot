/**
 * AI Knowledge Base for Skills Rules
 * Skills rules assign skills and licenses to route requests to qualified reviewers
 */

export const AI_KNOWLEDGE_SKILLS = `
# Skills Rules - AI Assistant Guide

## What are Skills Rules?
Skills rules automatically assign appropriate skills and licenses to requests to route them to qualified reviewers with the right expertise.

## Available Actions for Skills Rules

1. **assignSkill** - Assign a single skill/queue (first match wins)
2. **assignLicense** - Assign multiple required licenses (first match wins)

## Example Skills Rules

### Example 1: Cardiac Specialists
"Assign cardiology skill to requests with cardiac diagnoses or cardiology providers"

**Result:**
{
  "ruleDesc": "Cardiology requests to cardiology skill",
  "standardFieldCriteria": [
    {"field": "REQUEST_DIAGNOSIS_CODE", "operator": "IN", "values": ["I21.0", "I21.9", "I25.10"]},
    {"field": "PROVIDER_PRIMARY_SPECIALTY", "providerRole": "SERVICING", "operator": "IN", "values": ["CARDIO"]}
  ],
  "customFieldCriteria": [],
  "isActive": true,
  "weight": 500,
  "actions": {
    "assignSkill": { "skillCode": "CARDIO_REVIEW" }
  }
}

### Example 2: Pediatric License Requirement
"Pediatric requests require RN and PEDS licenses"

**Result:**
{
  "ruleDesc": "Pediatric requests require RN and PEDS licenses",
  "standardFieldCriteria": [
    {"field": "MEMBER_AGE", "operator": "LESS_THAN", "values": ["18"]},
    {"field": "PROVIDER_PRIMARY_SPECIALTY", "providerRole": "SERVICING", "operator": "IN", "values": ["PEDS"]}
  ],
  "customFieldCriteria": [],
  "isActive": true,
  "weight": 600,
  "actions": {
    "assignLicense": { "licenseCodes": ["RN", "PEDS"] }
  }
}

### Example 3: Behavioral Health Routing
"Behavioral health and substance abuse requests to behavioral health skill"

**Result:**
{
  "ruleDesc": "Behavioral health requests to BH skill",
  "standardFieldCriteria": [
    {"field": "REQUEST_CLASSIFICATION", "operator": "IN", "values": ["BEHAVIORAL_HEALTH"]},
    {"field": "REQUEST_DIAGNOSIS_CODE", "operator": "IN", "values": ["F10", "F11", "F32", "F33", "F41"]}
  ],
  "customFieldCriteria": [],
  "isActive": true,
  "weight": 500,
  "actions": {
    "assignSkill": { "skillCode": "BEHAVIORAL_HEALTH" }
  }
}

### Example 4: Complex Surgical Cases
"Surgical procedures over $50k value need surgical review skill and MD license"

**Result:**
{
  "ruleDesc": "High-value surgical cases to surgical review with MD",
  "standardFieldCriteria": [
    {"field": "SERVICE_TREATMENT_TYPE", "operator": "IN", "values": ["SURGERY"]},
    {"field": "SERVICE_CODE", "operator": "IN", "values": ["43644", "43645", "47562", "47563"]}
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
  "actions": {
    "assignSkill": { "skillCode": "SURGICAL_REVIEW" },
    "assignLicense": { "licenseCodes": ["MD", "DO"] }
  }
}

### Example 5: Physical Therapy Specialist
"PT requests over 20 units need rehabilitation skill"

**Result:**
{
  "ruleDesc": "High-unit PT to rehabilitation skill",
  "standardFieldCriteria": [
    {"field": "SERVICE_CODE", "operator": "IN", "values": ["97110", "97112", "97116", "97140"]},
    {"field": "SERVICE_REQUESTED_UNITS", "operator": "GREATER_THAN", "values": ["20"]}
  ],
  "customFieldCriteria": [],
  "isActive": true,
  "weight": 400,
  "actions": {
    "assignSkill": { "skillCode": "REHAB_REVIEW" }
  }
}

### Example 6: Oncology Cases
"Cancer treatment requests need oncology skill and MD/DO/RN licenses"

**Result:**
{
  "ruleDesc": "Oncology cases to oncology skill with clinical licenses",
  "standardFieldCriteria": [
    {"field": "REQUEST_DIAGNOSIS_CODE", "operator": "IN", "values": ["C50", "C18", "C34", "C61"]},
    {"field": "SERVICE_TREATMENT_TYPE", "operator": "IN", "values": ["CHEMOTHERAPY", "RADIATION"]}
  ],
  "customFieldCriteria": [],
  "isActive": true,
  "weight": 800,
  "actions": {
    "assignSkill": { "skillCode": "ONCOLOGY_REVIEW" },
    "assignLicense": { "licenseCodes": ["MD", "DO", "RN"] }
  }
}

### Example 7: Medicare Advantage Specialist
"Medicare Advantage members with complex conditions need Medicare skill"

**Result:**
{
  "ruleDesc": "Medicare Advantage complex cases to Medicare skill",
  "standardFieldCriteria": [
    {"field": "ENROLLMENT_PLAN", "operator": "IN", "values": ["MEDICARE_ADVANTAGE"]},
    {"field": "MEMBER_AGE", "operator": "GREATER_THAN_OR_EQUAL_TO", "values": ["65"]}
  ],
  "customFieldCriteria": [
    {
      "association": "MEMBER",
      "templateId": "CASE_COMPLEXITY",
      "operator": "IN",
      "values": ["COMPLEX", "HIGH_ACUITY"]
    }
  ],
  "isActive": true,
  "weight": 550,
  "actions": {
    "assignSkill": { "skillCode": "MEDICARE_COMPLEX" }
  }
}

### Example 8: Emergency Department Reviews
"ED admissions need UR skill with RN or MD license"

**Result:**
{
  "ruleDesc": "ED admissions to utilization review",
  "standardFieldCriteria": [
    {"field": "REQUEST_TREATMENT_SETTING", "operator": "IN", "values": ["EMERGENCY"]},
    {"field": "REQUEST_TYPE", "operator": "IN", "values": ["INPATIENT"]}
  ],
  "customFieldCriteria": [],
  "isActive": true,
  "weight": 650,
  "actions": {
    "assignSkill": { "skillCode": "ER_UR_REVIEW" },
    "assignLicense": { "licenseCodes": ["RN", "MD"] }
  }
}

## Custom Field Examples for Skills

Better custom field examples:
- **CASE_COMPLEXITY**: Case complexity level (SIMPLE, MODERATE, COMPLEX, HIGH_ACUITY)
- **SPECIALTY_PROGRAM**: Member enrolled in specialty program (TRANSPLANT, RARE_DISEASE, CLINICAL_TRIAL)
- **REVIEWER_PREFERENCE**: Preferred reviewer type (NURSE, PHYSICIAN, PHARMACIST)
- **PRIOR_REVIEW_RESULT**: Previous review outcomes (APPROVED, DENIED, PENDED)
- **ESTIMATED_COST**: Cost category (LOW, MEDIUM, HIGH, VERY_HIGH)

## Important Notes for Skills Rules

1. **assignSkill**: Only one skill per request - first matching rule wins
2. **assignLicense**: Multiple licenses allowed - assigns all required qualifications
3. Skills rules typically have higher weights (400-800) as routing is critical
4. Common skills: CARDIO_REVIEW, BEHAVIORAL_HEALTH, SURGICAL_REVIEW, ONCOLOGY_REVIEW, REHAB_REVIEW, ER_UR_REVIEW
5. Common licenses: RN, LPN, MD, DO, PharmD, LCSW, LPC, PT, OT, PEDS

## Response Format

Return JSON with:
- ruleDesc
- standardFieldCriteria (operator, field, values, providerRole if needed)
- customFieldCriteria (optional)
- isActive: true
- weight: 400-800
- actions: { assignSkill and/or assignLicense }
`

export default AI_KNOWLEDGE_SKILLS
