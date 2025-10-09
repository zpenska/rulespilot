/**
 * UM Vision Rules Pilot - AI Assistant Knowledge Base
 * Comprehensive guide for Claude AI to understand and generate healthcare authorization rules
 */

export const AI_KNOWLEDGE_BASE = `
# UM Vision Rules Pilot - AI Assistant Knowledge Base

## 1. CORE CONCEPTS UNDERSTANDING

### What is a Rule?
A rule is a set of criteria that, when matched against a healthcare request/service, triggers specific actions. Rules are evaluated based on their weight (priority), with higher-weight rules taking precedence.

### Rule Components
Every rule consists of:
- **Description**: Human-readable explanation of what the rule does
- **Weight**: Numeric priority (higher = evaluated first)
- **Standard Field Criteria**: Conditions using predefined system fields
- **Custom Field Criteria**: Conditions using client-specific custom fields
- **Actions**: Optional automated actions to perform when criteria match (assign, reassign, generate letters, close)
- **isActive**: Boolean flag indicating if the rule is currently active
- **Activation/Deactivation Dates**: When the rule is active

## 2. FIELD REFERENCE GUIDE

### MEMBER FIELDS

**MEMBER_AGE**
- Natural Language: "member age", "patient age", "age", "years old"
- Operators: EQUALS, GREATER_THAN, GREATER_THAN_OR_EQUAL_TO, LESS_THAN, LESS_THAN_OR_EQUAL_TO, BETWEEN
- Value Type: Integer
- Examples:
  - "age 65" → MEMBER_AGE EQUALS ["65"]
  - "over 65" → MEMBER_AGE GREATER_THAN ["65"]
  - "65 or older" → MEMBER_AGE GREATER_THAN_OR_EQUAL_TO ["65"]
  - "under 18" → MEMBER_AGE LESS_THAN ["18"]
  - "between 18 and 65" → MEMBER_AGE BETWEEN ["18", "65"]

**MEMBER_STATE**
- Natural Language: "member state", "patient location", "state", "lives in"
- Operators: IN, NOT_IN
- Value Type: State codes (PA, NJ, NY, FL, TX, CA, etc.)
- Examples:
  - "in Pennsylvania" → MEMBER_STATE IN ["PA"]
  - "in PA or NJ" → MEMBER_STATE IN ["PA", "NJ"]
  - "not in Florida" → MEMBER_STATE NOT_IN ["FL"]

**MEMBER_CLIENT**
- Natural Language: "client group", "member client", "client ID"
- Operators: IN, NOT_IN
- Value Type: Client identifiers

### ENROLLMENT FIELDS

**ENROLLMENT_GROUP_ID**
- Natural Language: "enrollment group", "group ID", "group number"
- Operators: IN, NOT_IN
- Value Type: Group identifiers

**ENROLLMENT_LINE_OF_BUSINESS**
- Natural Language: "line of business", "LOB", "business line"
- Operators: IN, NOT_IN
- Value Type: LOB codes (COMMERCIAL, MEDICARE, MEDICAID, etc.)

**ENROLLMENT_PLAN**
- Natural Language: "plan", "enrollment plan", "insurance plan", "health plan"
- Operators: IN, NOT_IN
- Value Type: Plan codes (MEDICARE, HMO, PPO, etc.)

### PROVIDER FIELDS (⚠️ Always require role specification)

**PROVIDER_NPI**
- Natural Language: "provider NPI", "NPI number", "NPI"
- Operators: IN, NOT_IN
- Value Type: 10-digit NPI numbers
- **REQUIRED**: providerRole (SERVICING, REFERRING, ORDERING, RENDERING)
- Example: "servicing provider NPI 1234567890" →
  {field: "PROVIDER_NPI", operator: "IN", values: ["1234567890"], providerRole: "SERVICING"}

**PROVIDER_PRIMARY_SPECIALTY**
- Natural Language: "provider specialty", "specialist", "specialty"
- Operators: IN, NOT_IN
- Value Type: Specialty codes
- **REQUIRED**: providerRole
- Common codes:
  - ORTHO = Orthopedics
  - CARDIO = Cardiology
  - NEURO = Neurology
  - PSYCH = Psychiatry
  - PEDS = Pediatrics
  - DERM = Dermatology
  - ONCO = Oncology

**PROVIDER_PRIMARY_ADDRESS_STATE**
- Natural Language: "provider state", "provider location"
- Operators: IN, NOT_IN
- Value Type: State codes
- **REQUIRED**: providerRole

**PROVIDER_PRIMARY_ADDRESS_POSTAL_CODE**
- Natural Language: "provider zip", "provider postal code", "provider ZIP code"
- Operators: IN, NOT_IN
- Value Type: ZIP codes
- **REQUIRED**: providerRole

**PROVIDER_ALTERNATE_ID**
- Natural Language: "provider alternate ID", "Medicaid ID", "TIN"
- Operators: IN, NOT_IN
- Value Type: Alternate identifiers
- **REQUIRED**: providerRole AND alternateIdType
- Example: "Medicaid provider ID 12345" →
  {field: "PROVIDER_ALTERNATE_ID", operator: "IN", values: ["12345"], providerRole: "SERVICING", alternateIdType: "MEDICAID"}

**PROVIDER_SET**
- Natural Language: "provider set", "provider group", "network"
- Operators: IN, NOT_IN
- Value Type: Provider set identifiers
- **REQUIRED**: providerRole

### REQUEST FIELDS

**REQUEST_CLASSIFICATION**
- Natural Language: "request classification", "classification type"
- Operators: IN, NOT_IN
- Value Type: PRIORAUTH, POSTSERVICE, CONCURRENT, PHARMACY, GRIEVANCE

**REQUEST_DIAGNOSIS_CODE**
- Natural Language: "diagnosis", "diagnosis code", "DX code", "condition"
- Operators: IN, NOT_IN
- Value Type: ICD-10 codes
- Note: Matches if ANY diagnosis in request matches ANY in values
- Example: "diabetes diagnosis" → REQUEST_DIAGNOSIS_CODE IN ["E11.9", "E10.9"]

**REQUEST_PRIMARY_DIAGNOSIS_CODE**
- Natural Language: "primary diagnosis", "main diagnosis"
- Operators: IN, NOT_IN
- Value Type: ICD-10 codes
- Note: Only matches PRIMARY diagnosis

**REQUEST_FROM_DATE / REQUEST_THROUGH_DATE**
- Natural Language: "from date", "start date", "through date", "end date", "date range"
- Operators: GREATER_THAN_OR_EQUAL_TO, GREATER_THAN, LESS_THAN_OR_EQUAL_TO, LESS_THAN, BETWEEN
- Value Type: YYYY-MM-DD format
- Examples:
  - "after January 1, 2024" → REQUEST_FROM_DATE GREATER_THAN ["2024-01-01"]
  - "in Q1 2024" → REQUEST_FROM_DATE BETWEEN ["2024-01-01", "2024-03-31"]

**REQUEST_TYPE**
- Natural Language: "request type", "type of request"
- Operators: IN, NOT_IN
- Value Type: OUTPATIENT, REFERRAL, INPATIENT

**REQUEST_URGENCY**
- Natural Language: "urgency", "priority", "emergency"
- Operators: IN, NOT_IN
- Value Type: Urgency levels (EMERGENCY, URGENT, ROUTINE, etc.)

**REQUEST_STATUS**
- Natural Language: "request status", "status"
- Operators: IN, NOT_IN
- Value Type: Status codes

**REQUEST_TREATMENT_SETTING**
- Natural Language: "treatment setting", "setting", "where treatment"
- Operators: IN, NOT_IN
- Value Type: Setting codes

**REQUEST_HEALTHCARE_TYPE**
- Natural Language: "healthcare type", "type of healthcare"
- Operators: IN, NOT_IN
- Value Type: Healthcare type codes

**REQUEST_INTAKE_SOURCE**
- Natural Language: "intake source", "how submitted", "source"
- Operators: IN, NOT_IN
- Value Type: Source codes

**REQUEST_DISPOSITION**
- Natural Language: "disposition", "outcome"
- Operators: IN, NOT_IN
- Value Type: Disposition codes

**REQUEST_ORIGINATING_SYSTEM_SOURCE**
- Natural Language: "originating system", "source system"
- Operators: IN, NOT_IN
- Value Type: System codes

### REVIEW OUTCOME FIELDS

**REVIEW_OUTCOME_STATUS**
- Natural Language: "review status", "outcome status"
- Operators: IN, NOT_IN
- Value Type: APPROVE, PEND, DENY, VOID, NONE

**REVIEW_OUTCOME_STATUS_REASON**
- Natural Language: "review reason", "outcome reason", "why approved/denied"
- Operators: IN, NOT_IN
- Value Type: Reason codes

**REVIEW_OUTCOME_LEVEL_OF_CARE**
- Natural Language: "review level of care", "outcome LOC"
- Operators: IN, NOT_IN
- Value Type: Level of care codes

### SERVICE FIELDS

**SERVICE_CODE**
- Natural Language: "service code", "procedure code", "CPT", "CPT code"
- Operators: IN, NOT_IN
- Value Type: CPT/HCPCS codes
- Example: "physical therapy" → SERVICE_CODE IN ["97110", "97112", "97116"]

**SERVICE_REQUESTED_UNITS**
- Natural Language: "units", "service units", "quantity", "number of units"
- Operators: EQUALS, GREATER_THAN_OR_EQUAL_TO, GREATER_THAN, LESS_THAN_OR_EQUAL_TO, LESS_THAN, BETWEEN
- Value Type: Integer
- Examples:
  - "more than 20 units" → SERVICE_REQUESTED_UNITS GREATER_THAN ["20"]
  - "between 10 and 20 units" → SERVICE_REQUESTED_UNITS BETWEEN ["10", "20"]

**SERVICE_REQUESTED_UNITS_UOM**
- Natural Language: "unit of measure", "UOM", "unit type"
- Operators: IN, NOT_IN
- Value Type: Unit codes (DAYS, VISITS, HOURS, etc.)

**SERVICE_LEVEL_OF_CARE**
- Natural Language: "level of care", "LOC", "care level"
- Operators: IN, NOT_IN
- Value Type: Care level codes

**SERVICE_PLACE_OF_SERVICE**
- Natural Language: "place of service", "POS", "where service", "location"
- Operators: IN, NOT_IN
- Value Type: Place of service codes

**SERVICE_PRIMARY_FLAG**
- Natural Language: "primary service", "primary flag"
- Operators: IN, NOT_IN
- Value Type: Flag values

**SERVICE_REVIEW_TYPE**
- Natural Language: "service review type", "review type"
- Operators: IN, NOT_IN
- Value Type: Review type codes

**SERVICE_STATE**
- Natural Language: "service state", "where service performed"
- Operators: IN, NOT_IN
- Value Type: State codes

**SERVICE_TREATMENT_TYPE**
- Natural Language: "treatment type", "type of treatment"
- Operators: IN, NOT_IN
- Value Type: Treatment type codes

### STAGE FIELDS

**STAGE_PRIMARY_SERVICE_CODE**
- Natural Language: "stage service code", "stage primary code"
- Operators: IN, NOT_IN
- Value Type: Service codes

**STAGE_TYPE**
- Natural Language: "stage type"
- Operators: IN, NOT_IN
- Value Type: Stage type codes

### CUSTOM FIELDS

Custom fields support:
- Associations: MEMBER, ENROLLMENT, REQUEST
- Operators: IN, NOT_IN only
- Template IDs: Client-specific field identifiers

Example: "Member with custom field RISK_SCORE set to HIGH" →
{
  "association": "MEMBER",
  "templateId": "RISK_SCORE",
  "operator": "IN",
  "values": ["HIGH"]
}

## 3. OPERATOR USAGE PATTERNS

### IN Operator
**Use when**: Checking if value matches ANY from a list
**Keywords**: "is", "includes", "has", "with", "for", "in"
**Examples**:
- "members in Pennsylvania or New Jersey" → MEMBER_STATE IN ["PA", "NJ"]
- "diagnosis codes including diabetes" → REQUEST_DIAGNOSIS_CODE IN ["E11.9", "E10.9"]

### NOT_IN Operator
**Use when**: Excluding specific values
**Keywords**: "not", "except", "excluding", "without", "not including"
**Examples**:
- "not in Florida" → MEMBER_STATE NOT_IN ["FL"]
- "excluding mental health" → REQUEST_DIAGNOSIS_CODE NOT_IN ["F01-F99"]

### EQUALS
**Use when**: Exact match required
**Keywords**: "exactly", "is exactly", "equals"
**Value count**: Exactly 1
**Example**: "age is exactly 65" → MEMBER_AGE EQUALS ["65"]

### GREATER_THAN
**Use when**: Value must exceed threshold
**Keywords**: "over", "more than", "above", "exceeding", "greater than"
**Value count**: Exactly 1
**Example**: "over 65 years old" → MEMBER_AGE GREATER_THAN ["65"]

### GREATER_THAN_OR_EQUAL_TO
**Use when**: Value must meet or exceed threshold
**Keywords**: "at least", "or older", "or more", "minimum", "65+"
**Value count**: Exactly 1
**Example**: "65 or older" → MEMBER_AGE GREATER_THAN_OR_EQUAL_TO ["65"]

### LESS_THAN
**Use when**: Value must be below threshold
**Keywords**: "under", "below", "less than", "younger than"
**Value count**: Exactly 1
**Example**: "under 18" → MEMBER_AGE LESS_THAN ["18"]

### LESS_THAN_OR_EQUAL_TO
**Use when**: Value must be at or below threshold
**Keywords**: "at most", "up to", "maximum", "no more than"
**Value count**: Exactly 1
**Example**: "up to 21 years old" → MEMBER_AGE LESS_THAN_OR_EQUAL_TO ["21"]

### BETWEEN
**Use when**: Value must be in range (inclusive)
**Keywords**: "between", "from...to", "ranging from"
**Value count**: Exactly 2 [lower, upper]
**Examples**:
- "between 18 and 65" → MEMBER_AGE BETWEEN ["18", "65"]
- "from January to March" → REQUEST_FROM_DATE BETWEEN ["2024-01-01", "2024-03-31"]

## 4. NATURAL LANGUAGE INTERPRETATION PATTERNS

### Pattern 1: Simple Single Criteria
**Input**: "Create a rule for members in Pennsylvania"
**Output**:
{
  "ruleDesc": "Members in Pennsylvania",
  "standardFieldCriteria": [{
    "field": "MEMBER_STATE",
    "operator": "IN",
    "values": ["PA"]
  }],
  "customFieldCriteria": []
}

### Pattern 2: Multiple Criteria (AND logic)
**Input**: "Members over 65 in Pennsylvania with orthopedic providers"
**Output**:
{
  "ruleDesc": "Members over 65 in Pennsylvania with orthopedic providers",
  "standardFieldCriteria": [
    {"field": "MEMBER_AGE", "operator": "GREATER_THAN", "values": ["65"]},
    {"field": "MEMBER_STATE", "operator": "IN", "values": ["PA"]},
    {"field": "PROVIDER_PRIMARY_SPECIALTY", "providerRole": "SERVICING", "operator": "IN", "values": ["ORTHO"]}
  ],
  "customFieldCriteria": []
}

### Pattern 3: Date Range Criteria
**Input**: "Requests from January through March 2024"
**Output**:
{
  "ruleDesc": "Requests from January through March 2024",
  "standardFieldCriteria": [{
    "field": "REQUEST_FROM_DATE",
    "operator": "BETWEEN",
    "values": ["2024-01-01", "2024-03-31"]
  }],
  "customFieldCriteria": []
}

### Pattern 4: Exclusion Criteria
**Input**: "All members except those in FL and TX"
**Output**:
{
  "ruleDesc": "All members except those in FL and TX",
  "standardFieldCriteria": [{
    "field": "MEMBER_STATE",
    "operator": "NOT_IN",
    "values": ["FL", "TX"]
  }],
  "customFieldCriteria": []
}

### Pattern 5: Custom Fields
**Input**: "Members with custom field RISK_SCORE not set to HIGH"
**Output**:
{
  "ruleDesc": "Members with RISK_SCORE not HIGH",
  "standardFieldCriteria": [],
  "customFieldCriteria": [{
    "association": "MEMBER",
    "templateId": "RISK_SCORE",
    "operator": "NOT_IN",
    "values": ["HIGH"]
  }]
}

### Pattern 5b: Complex Example with Custom Fields and Provider Role
**Input**: "Request with Member in Pennsylvania that has Custom Field MEMCFLD1 not valued with LOW and a Servicing Provider with Primary Specialty Orthopedics"
**Output**:
{
  "ruleDesc": "Request with Member in Pennsylvania that has Custom Field MEMCFLD1 not valued with LOW and a Servicing Provider with Primary Specialty Orthopedics",
  "standardFieldCriteria": [
    {
      "field": "MEMBER_STATE",
      "operator": "IN",
      "values": ["PA"]
    },
    {
      "field": "PROVIDER_PRIMARY_SPECIALTY",
      "providerRole": "SERVICING",
      "operator": "IN",
      "values": ["ORTHO"]
    }
  ],
  "customFieldCriteria": [
    {
      "association": "MEMBER",
      "templateId": "MEMCFLD1",
      "operator": "NOT_IN",
      "values": ["LOW"]
    }
  ]
}

### Pattern 6: Complex Multi-Criteria
**Input**: "Medicare members over 65 in PA/NJ requiring orthopedic surgery"
**Output**:
{
  "ruleDesc": "Medicare members over 65 in PA/NJ requiring orthopedic surgery",
  "standardFieldCriteria": [
    {"field": "ENROLLMENT_PLAN", "operator": "IN", "values": ["MEDICARE"]},
    {"field": "MEMBER_AGE", "operator": "GREATER_THAN_OR_EQUAL_TO", "values": ["65"]},
    {"field": "MEMBER_STATE", "operator": "IN", "values": ["PA", "NJ"]},
    {"field": "PROVIDER_PRIMARY_SPECIALTY", "providerRole": "SERVICING", "operator": "IN", "values": ["ORTHO"]}
  ],
  "customFieldCriteria": [],
  "weight": 100
}

## 5. VALIDATION RULES

### Value Count Rules
- EQUALS, GREATER_THAN, GREATER_THAN_OR_EQUAL_TO, LESS_THAN, LESS_THAN_OR_EQUAL_TO: Exactly 1 value
- BETWEEN: Exactly 2 values [lower, upper]
- IN, NOT_IN: At least 1 value

### Data Type Rules
- INTEGER fields (MEMBER_AGE, SERVICE_REQUESTED_UNITS): Values must be valid integers
- DATE fields: Must be YYYY-MM-DD format
- STRING fields: Any string value

### Required Specifications
- Provider fields MUST have providerRole
- PROVIDER_ALTERNATE_ID MUST have alternateIdType
- Custom fields MUST have association (MEMBER/ENROLLMENT/REQUEST)
- Custom fields only support IN/NOT_IN operators

## 6. WEIGHT SYSTEM

### How Weights Work
- Rules evaluated in order of weight (highest first)
- Higher weight = higher priority
- When multiple rules match:
  - Actions accumulate in weight order
  - For single-action selection, highest weight wins

### Weight Guidelines
- 1000+: Critical/override rules
- 500-999: High-priority business rules
- 100-499: Standard rules
- 1-99: Default/fallback rules

## 7. RULE ACTIONS

### What Are Actions?
Actions define what should happen when a rule's criteria match. Rules can have zero or more actions. Actions are optional but commonly used to automate workflow processes.

### Available Action Types

**1. assignSkill**
- **Purpose**: Assigns a skill/queue to the request
- **Structure**: { "assignSkill": { "skillCode": "SKILL1" } }
- **Natural Language**: "assign to skill", "route to skill", "assign skill"
- **Examples**:
  - "assign to SKILL1" → { "assignSkill": { "skillCode": "SKILL1" } }
  - "route to cardiology skill" → { "assignSkill": { "skillCode": "CARDIO_SKILL" } }

**2. reassign**
- **Purpose**: Reassigns the request to a different department
- **Structure**: { "reassign": { "departmentCode": "DEPT2" } }
- **Natural Language**: "reassign to", "move to department", "transfer to"
- **Examples**:
  - "reassign to DEPT2" → { "reassign": { "departmentCode": "DEPT2" } }
  - "transfer to clinical review" → { "reassign": { "departmentCode": "CLINICAL_REVIEW" } }

**3. generateLetters**
- **Purpose**: Generates one or more notification letters
- **Structure**: { "generateLetters": [{ "letterName": "Letter Template Name" }] }
- **Natural Language**: "generate letter", "send letter", "create notification"
- **Examples**:
  - "generate Master Ordering Outpatient letter" →
    { "generateLetters": [{ "letterName": "Master Ordering Outpatient" }] }
  - "send approval and denial letters" →
    { "generateLetters": [{ "letterName": "Approval Letter" }, { "letterName": "Denial Letter" }] }

**4. close**
- **Purpose**: Closes the request with a specific disposition code
- **Structure**: { "close": { "dispositionCode": "DISP1" } }
- **Natural Language**: "close with", "close as", "disposition"
- **Examples**:
  - "close with DISP1" → { "close": { "dispositionCode": "DISP1" } }
  - "auto-close as approved" → { "close": { "dispositionCode": "AUTO_APPROVED" } }

### Multiple Actions Example
Rules can have multiple actions that all execute when the rule matches:
{
  "actions": {
    "reassign": { "departmentCode": "DEPT2" },
    "generateLetters": [{ "letterName": "Master Ordering Outpatient" }]
  }
}

### Interpreting Action Phrases
- "assign to X" → assignSkill
- "reassign to X" or "move to X" → reassign
- "generate X letter" or "send X" → generateLetters
- "close with X" or "disposition X" → close
- "route to X skill" → assignSkill
- "transfer to X department" → reassign

### Complete Rule with Actions Example
"Outpatient with Service 44950 should be assigned to SKILL1"
{
  "ruleDesc": "Outpatient with Service 44950",
  "standardFieldCriteria": [
    {"operator": "IN", "field": "REQUEST_TYPE", "values": ["OUTPATIENT"]},
    {"operator": "IN", "field": "SERVICE_CODE", "values": ["44950"]}
  ],
  "isActive": true,
  "weight": 100,
  "actions": {
    "assignSkill": { "skillCode": "SKILL1" }
  }
}

## 8. COMMON SCENARIOS

### Scenario: Medicare Advantage Members
"Medicare Advantage members in Pennsylvania over 65"
{
  "ruleDesc": "Medicare Advantage members in Pennsylvania over 65",
  "standardFieldCriteria": [
    {"field": "ENROLLMENT_PLAN", "operator": "IN", "values": ["MEDICARE_ADVANTAGE"]},
    {"field": "MEMBER_STATE", "operator": "IN", "values": ["PA"]},
    {"field": "MEMBER_AGE", "operator": "GREATER_THAN_OR_EQUAL_TO", "values": ["65"]}
  ]
}

### Scenario: High-Unit Physical Therapy
"Physical therapy requests over 20 units in Q1 2024"
{
  "ruleDesc": "Physical therapy requests over 20 units in Q1 2024",
  "standardFieldCriteria": [
    {"field": "SERVICE_CODE", "operator": "IN", "values": ["97110", "97112", "97116"]},
    {"field": "SERVICE_REQUESTED_UNITS", "operator": "GREATER_THAN", "values": ["20"]},
    {"field": "REQUEST_FROM_DATE", "operator": "BETWEEN", "values": ["2024-01-01", "2024-03-31"]}
  ]
}

### Scenario: Emergency Exclusion
"Non-emergency requests excluding high-risk members"
{
  "ruleDesc": "Non-emergency requests excluding high-risk members",
  "standardFieldCriteria": [
    {"field": "REQUEST_URGENCY", "operator": "NOT_IN", "values": ["EMERGENCY", "URGENT"]}
  ],
  "customFieldCriteria": [
    {"association": "MEMBER", "templateId": "RISK_CATEGORY", "operator": "NOT_IN", "values": ["HIGH", "CRITICAL"]}
  ]
}

## 9. ERROR HANDLING

### Missing Provider Role
**Error**: Provider fields without role specification
**Fix**: Ask "What provider role? (SERVICING, REFERRING, ORDERING, RENDERING)"
**Example**: "servicing provider specialty cardiology"

### Invalid Date Format
**Error**: Dates not in YYYY-MM-DD
**Fix**: Convert "01/01/2024" to "2024-01-01"

### Wrong Value Count
**Error**: BETWEEN with 1 value
**Fix**: Ask for second value "Between 65 and what value?"

### Invalid Operator
**Error**: MEMBER_STATE GREATER_THAN "PA"
**Fix**: "State fields only support IN/NOT_IN. Did you mean 'members in PA'?"

## 10. QUICK RESPONSES

### Date Questions
"Dates must be in YYYY-MM-DD format. Use BETWEEN for ranges, GREATER_THAN for after, LESS_THAN for before."

### Provider Questions
"All provider fields require a role (SERVICING, REFERRING, ORDERING, RENDERING). Which role applies?"

### Custom Fields
"Custom fields only support IN and NOT_IN. Specify association (MEMBER/ENROLLMENT/REQUEST) and templateId."

### Multiple Values
"Use IN operator with array of values to match ANY. Example: ['PA', 'NJ', 'NY'] matches any of these states."

### Weight Questions
"Weight determines priority. Higher weight = evaluated first. Typical ranges: 1000+ (critical), 500-999 (high), 100-499 (standard), 1-99 (default)."

## 11. DICTIONARY VALUE MAPPINGS

### Common State Codes
- PA = Pennsylvania
- NJ = New Jersey
- NY = New York
- FL = Florida
- TX = Texas
- CA = California
- IL = Illinois
- OH = Ohio
- MA = Massachusetts

### Request Classification Values
- PRIORAUTH = Prior Authorization
- POSTSERVICE = Post-Service
- CONCURRENT = Concurrent Review
- PHARMACY = Pharmacy
- GRIEVANCE = Grievance

### Request Type Values
- OUTPATIENT = Outpatient
- REFERRAL = Referral
- INPATIENT = Inpatient

### Request Urgency Values
- EMERGENCY = Emergency
- URGENT = Urgent
- ROUTINE = Routine
- EXPEDITED = Expedited

### Review Outcome Status Values
- APPROVE = Approve
- PEND = Pend
- DENY = Deny
- VOID = Void
- NONE = None

### Healthcare Type Values
- BEHAVIORAL = Behavioral Health
- MEDICAL = Medical
- DENTAL = Dental
- VISION = Vision

### Provider Specialty Codes (Common)
- ORTHO = Orthopedics
- CARDIO = Cardiology
- NEURO = Neurology
- PSYCH = Psychiatry
- PEDS = Pediatrics
- DERM = Dermatology
- ONCO = Oncology
- ENDO = Endocrinology
- GI = Gastroenterology
- OB/GYN = Obstetrics/Gynecology

### Service Codes (Examples)
Physical Therapy:
- 97110 = Therapeutic Exercise
- 97112 = Neuromuscular Re-education
- 97116 = Gait Training
- 97140 = Manual Therapy

Evaluation & Management:
- 99213 = Office Visit Level 3
- 99214 = Office Visit Level 4
- 99215 = Office Visit Level 5

### Place of Service Codes
- 11 = Office
- 12 = Home
- 21 = Inpatient Hospital
- 22 = Outpatient Hospital
- 23 = Emergency Room
- 31 = Skilled Nursing Facility

### Line of Business Codes
- COMMERCIAL = Commercial Insurance
- MEDICARE = Medicare
- MEDICAID = Medicaid
- MEDICARE_ADVANTAGE = Medicare Advantage
- CHIP = Children's Health Insurance Program

## 12. ADVANCED INTERPRETATION PATTERNS

### Recognizing Implied Information
**Input**: "Medicare patients"
**Interpretation**: Could mean:
- ENROLLMENT_PLAN IN ["MEDICARE"] OR
- MEMBER_AGE GREATER_THAN_OR_EQUAL_TO ["65"]
**Ask user**: "Do you mean members enrolled in Medicare plan, or members 65+ eligible for Medicare?"

**Input**: "Emergency cases"
**Interpretation**: REQUEST_URGENCY IN ["EMERGENCY"]

**Input**: "Non-urgent"
**Interpretation**: REQUEST_URGENCY NOT_IN ["EMERGENCY", "URGENT"]

### State Name to Code Mapping
**Input**: "Pennsylvania" → PA
**Input**: "New Jersey" → NJ
**Input**: "New York" → NY
**Input**: "Texas" → TX
**Input**: "Florida" → FL
**Input**: "California" → CA

### Specialty Name to Code Mapping
**Input**: "orthopedic" → ORTHO
**Input**: "cardiac" or "heart" → CARDIO
**Input**: "neurological" or "brain" → NEURO
**Input**: "psychiatric" or "mental health" → PSYCH
**Input**: "pediatric" or "children" → PEDS

### Date Natural Language
**Input**: "Q1 2024" → ["2024-01-01", "2024-03-31"]
**Input**: "Q2 2024" → ["2024-04-01", "2024-06-30"]
**Input**: "Q3 2024" → ["2024-07-01", "2024-09-30"]
**Input**: "Q4 2024" → ["2024-10-01", "2024-12-31"]
**Input**: "January 2024" → ["2024-01-01", "2024-01-31"]
**Input**: "first half of 2024" → ["2024-01-01", "2024-06-30"]
**Input**: "2024" → ["2024-01-01", "2024-12-31"]

## 13. TROUBLESHOOTING SCENARIOS

### Scenario: Ambiguous Provider Role
**Input**: "Provider specialty cardiology"
**Issue**: No role specified
**Response**: "I need to know the provider role. Is this for:
- SERVICING provider (performs the service)
- REFERRING provider (refers the patient)
- ORDERING provider (orders the service)
- RENDERING provider (bills for the service)?"

### Scenario: Multiple Interpretations
**Input**: "Members over 65 with Medicare"
**Options**:
1. Two separate criteria (age AND plan)
2. Just Medicare plan (implies 65+)
**Response**: "I can create this as:
1. Members over 65 AND enrolled in Medicare plan, or
2. Members enrolled in Medicare (which typically means 65+)
Which would you prefer?"

### Scenario: Incomplete Date Range
**Input**: "Requests in 2024"
**Auto-complete**: REQUEST_FROM_DATE BETWEEN ["2024-01-01", "2024-12-31"]

**Input**: "Requests after March 2024"
**Auto-complete**: REQUEST_FROM_DATE GREATER_THAN ["2024-03-31"]

### Scenario: Complex AND/OR Logic
**Input**: "Members in PA or NJ over 65"
**Interpretation**: (MEMBER_STATE IN ["PA", "NJ"]) AND (MEMBER_AGE GREATER_THAN ["65"])

**Input**: "Urgent or emergency cases"
**Interpretation**: REQUEST_URGENCY IN ["URGENT", "EMERGENCY"]

### Scenario: Negation Complexity
**Input**: "Not in PA, NJ, or NY"
**Correct**: MEMBER_STATE NOT_IN ["PA", "NJ", "NY"]

**Input**: "Members not over 65"
**Interpretation**: MEMBER_AGE LESS_THAN_OR_EQUAL_TO ["65"]

**Input**: "Excluding mental health"
**Needs clarification**: "Do you mean:
- Excluding mental health diagnoses (F codes)?
- Excluding psychiatric specialty providers?
- Excluding behavioral healthcare type?"

## 14. RESPONSE FORMAT

ALWAYS return valid JSON in this exact format:
{
  "ruleDesc": "Clear description of what the rule does",
  "standardFieldCriteria": [
    {
      "operator": "OPERATOR",
      "field": "FIELD_NAME",
      "values": ["value1", "value2"],
      "providerRole": "ROLE",  // only for provider fields
      "alternateIdType": "TYPE"  // only for PROVIDER_ALTERNATE_ID
    }
  ],
  "customFieldCriteria": [  // optional - omit if not used
    {
      "operator": "IN|NOT_IN",
      "association": "MEMBER|ENROLLMENT|REQUEST",
      "templateId": "FIELD_ID",
      "values": ["value1"]
    }
  ],
  "isActive": true,  // true for active rules, false for inactive
  "weight": 100,  // numeric priority, required
  "actions": {  // optional - include if actions are specified
    "assignSkill": { "skillCode": "SKILL1" },
    "reassign": { "departmentCode": "DEPT2" },
    "generateLetters": [{ "letterName": "Letter Name" }],
    "close": { "dispositionCode": "DISP1" }
  }
}

## 15. QUALITY CHECKLIST

Before returning JSON, verify:
- ✅ All provider fields have providerRole
- ✅ PROVIDER_ALTERNATE_ID has alternateIdType
- ✅ Date fields use YYYY-MM-DD format
- ✅ Operator matches field type (no GREATER_THAN for states)
- ✅ Value count matches operator (1 for EQUALS, 2 for BETWEEN)
- ✅ Custom fields have association
- ✅ Custom fields only use IN/NOT_IN
- ✅ ruleDesc is clear and concise
- ✅ All values are in correct format (state codes, not full names)
`

export default AI_KNOWLEDGE_BASE
