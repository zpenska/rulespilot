# AI Test Prompts for Rules Generation

Use these prompts in the AI Assistant to test rule generation:

## Simple Rules

### 1. Basic Member State Rule
```
Members in Pennsylvania
```

### 2. Simple Age Rule
```
Members 65 years or older
```

### 3. Request Type Rule
```
Outpatient requests
```

## Moderate Complexity Rules

### 4. Member State with Request Type
```
Members in Pennsylvania with outpatient requests
```

### 5. Age Range with Service Code
```
Members between 18 and 65 with service code 97110
```

### 6. Provider Specialty Rule
```
Servicing provider with specialty orthopedics
```

## Complex Rules

### 7. Multi-Field Rule
```
Medicare members over 65 in Pennsylvania with servicing provider specialty orthopedics
```

### 8. Provider with Address and Type
```
Servicing provider in Illinois with postal code 60601 and NPI 1234567890
```

### 9. Request with Date Range
```
Outpatient requests from January 1 2024 to December 31 2024 with service code 44950
```

### 10. Custom Field Rule
```
Members in PA with member custom field RISK_SCORE not valued with HIGH and servicing provider specialty cardiology
```

## Advanced Rules with Actions

### 11. Rule with Skill Assignment
```
Emergency urgent requests for members in New Jersey should assign to skill code EMERG001
```
Expected: `actions: { assignSkill: { skillCode: "EMERG001" } }`

### 12. Rule with Multiple Criteria and Actions
```
Inpatient requests for Medicare members over 65 with servicing provider NPI 1234567890 should reassign to department AUTH001 and generate letter Master Ordering Inpatient
```
Expected: `actions: { reassign: { departmentCode: "AUTH001" }, generateLetters: [{ letterName: "Master Ordering Inpatient" }] }`

### 13. Diagnosis-Based Rule with Close Action
```
Approved determined referrals with primary diagnosis code K36 should close with disposition APPROVED
```
Expected: `actions: { close: { dispositionCode: "APPROVED" } }`

### 14. Auto-Approval Rule
```
Outpatient physical therapy requests under 10 visits should auto-close as approved
```
Expected: `actions: { close: { dispositionCode: "AUTO_APPROVED" } }`

## Expected JSON Output Example

For prompt: "Members in Pennsylvania with outpatient requests"

```json
{
  "ruleDesc": "Members in Pennsylvania with outpatient requests",
  "standardFieldCriteria": [
    {
      "field": "MEMBER_STATE",
      "operator": "IN",
      "values": ["PA"]
    },
    {
      "field": "REQUEST_TYPE",
      "operator": "IN",
      "values": ["OUTPATIENT"]
    }
  ],
  "customFieldCriteria": [],
  "weight": 100
}
```

## Testing Workflow

1. Open AI Assistant (click button in header)
2. Paste one of the prompts above
3. Click "Generate Rule"
4. Review the generated JSON
5. Click "Use This Rule" to open in Rule Builder
6. Add any additional details (category, activation date, etc.)
7. Save the rule
8. Verify it appears in the table with correct status

## Validation to Test

- Field names are correct (uppercase with underscores)
- Operators are valid for field types
- Provider fields include providerRole
- Date fields use YYYY-MM-DD format
- Weight defaults to 100
- Custom fields use only IN/NOT_IN operators

## Common Issues to Watch For

- ❌ Lowercase field names → Should be UPPERCASE
- ❌ Missing providerRole for provider fields
- ❌ Wrong date format (MM/DD/YYYY) → Should be YYYY-MM-DD
- ❌ Custom fields with EQUALS operator → Only IN/NOT_IN allowed
- ❌ BETWEEN operator without exactly 2 values
