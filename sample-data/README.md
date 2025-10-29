# Rules Pilot Sample Data

This directory contains realistic, industry-standard sample data for healthcare prior authorization and utilization management workflows.

## 📁 Directory Structure

```
sample-data/
├── workflow/          # Prior authorization workflow rules
├── tat/              # Turn-around time calculation rules
├── hints/            # Contextual message/hint rules
├── skills/           # Medical specialty skills
└── complete/         # Combined demo datasets
```

## 📋 Sample Files Overview

### Workflow Rules (`workflow/sample-workflow-rules.json`)

**Format:** AUTO_WORKFLOW_RULES (standard API format)

**Contains:** 10 realistic prior authorization workflow rules including:

1. **Orthopedic Surgery Pre-Auth** - High-cost procedures requiring clinical review
2. **Advanced Imaging (CT/MRI)** - Medical director approval for expensive imaging
3. **Cardiology Referrals** - Specialty-specific routing
4. **Emergency Services** - Auto-approval for emergency care
5. **Durable Medical Equipment** - DME verification workflows
6. **Home Health Services** - Case management referrals
7. **Organ Transplants** - High-complexity multi-disciplinary review
8. **Mental Health Therapy** - Credential verification workflows
9. **Inpatient Admissions** - Concurrent review processes
10. **Experimental Treatments** - Medical policy committee review

**Actions Used:**
- Department routing/reassignment
- Task creation (clinical review, verification)
- CM referrals (case management)
- Appeal task creation
- Letter generation
- Request closure

---

### TAT Rules (`tat/sample-tat-rules.json`)

**Format:** DUE_DATE_RULES (TAT-specific format)

**Contains:** 8 turnaround time calculation rules including:

1. **Standard Outpatient** - 14 calendar days from notification
2. **Urgent Review** - 72 hours from receipt
3. **Expedited Review** - 24 hours, holiday-aware
4. **Retrospective Review** - 30 calendar days with holiday offset
5. **Reconsideration Appeal** - 30 calendar days with auto-extend
6. **Concurrent Review** - 1 business day by 5pm
7. **Post-Service Review** - 60 calendar days
8. **Appeal Response** - 30 days with auto-extend for missing docs

**Features:**
- Multiple time units (hours, calendar days, business days)
- Holiday date handling
- Due time enforcement (e.g., "17:00")
- Auto-extension logic
- Clinicals requested thresholds

---

### Hints Rules (`hints/sample-hints-rules.json`)

**Format:** Standard rule format with hintsAction

**Contains:** 7 contextual message rules including:

1. **Missing Clinical Documentation** (RED) - High-risk procedures without docs
2. **Prior Authorization History** (YELLOW) - Recent denial warning
3. **High-Risk Member Alert** (RED) - Multiple chronic conditions
4. **Out-of-Network Provider** (BLUE) - Network status information
5. **Duplicate Request Warning** (YELLOW) - Similar request in last 30 days
6. **State-Specific Requirements** (BLUE) - Pennsylvania mandated benefits
7. **Billing Code Mismatch** (YELLOW) - Diagnosis/procedure inconsistency

**Message Types:**
- **RED**: Critical alerts requiring immediate attention
- **YELLOW**: Warnings and cautions
- **BLUE**: Informational messages
- **GREEN**: Positive indicators

**Display Locations:**
- MEMBER - Member demographics section
- PROVIDER - Provider information section
- SERVICES - Service/procedure section
- DIAGNOSIS - Diagnosis section

---

### Skills (`skills/sample-skills.json`)

**Format:** JSON array of skill definitions

**Contains:** 20 medical specialty skills including:

1. **Cardiology** - I20-I25 (Heart disease), CPT 93000-93350
2. **Orthopedics** - M00-M25 (Joint disorders), CPT 27447, 29881
3. **Oncology** - C18-C91 (Cancer), CPT 96400-96549
4. **Endocrinology** - E10-E78 (Diabetes, thyroid), CPT 95250-95251
5. **Nephrology** - N17-N26 (Kidney disease), CPT 90935-90999
6. **Pulmonology** - J43-J47 (COPD, asthma), CPT 94010-94799
7. **Neurology** - G20-G80 (Nervous system), CPT 95860-95887
8. **Gastroenterology** - K50-K92 (Digestive), CPT 43200-45380
9. **Rheumatology** - M05-M36 (Autoimmune), CPT 20605-20611
10. **Dermatology** - L02-C44 (Skin disorders), CPT 11000-11047
11. **Psychiatry** - F10-F43 (Mental health), CPT 90832-90847
12. **Obstetrics** - O00-O82 (Pregnancy), CPT 59400-59622
13. **Pediatrics** - P00-P92 (Neonatal), CPT 99381-99393
14. **Physical Therapy** - M54-S93 (Rehabilitation), CPT 97110-97542
15. **Radiology** - R91-R93 (Advanced imaging), CPT 70450-74178
16. **Pain Management** - M54, G89 (Chronic pain), CPT 62310-64493
17. **Sleep Medicine** - G47 (Sleep disorders), CPT 95805-95811
18. **Bariatric Surgery** - E66 (Obesity), CPT 43644-43775
19. **Behavioral Health** - F10-F19 (Substance abuse), CPT 90832-H0020
20. **Home Health** - Z74-Z99 (Home care), CPT 99341-99350

**Fields:**
- `skillName`: Human-readable specialty name
- `skillCode`: Unique identifier
- `description`: What the skill covers
- `diagnosisCodes`: ICD-10 codes (prefix matching)
- `serviceCodes`: CPT/HCPCS procedure codes
- `specialtyRequired`: Required provider specialty
- `active`: Active status

---

## 🔄 Import Instructions

### Per-Tab Import Process

#### **Workflow Tab**
1. Navigate to **Workflow** tab
2. Click **Import/Export** → **Import Rules**
3. Select `workflow/sample-workflow-rules.json`
4. Rules imported in AUTO_WORKFLOW_RULES format

#### **TAT Tab**
1. Navigate to **TAT** tab
2. Click **Import/Export** → **Import Rules**
3. Select `tat/sample-tat-rules.json`
4. Rules imported in DUE_DATE_RULES format

#### **Hints Tab**
1. Navigate to **Hints** tab
2. Click **Import/Export** → **Import Rules**
3. Select `hints/sample-hints-rules.json`
4. Hints imported as standard rules

#### **Skills Tab**
1. Navigate to **Skills** tab
2. Click **Import/Export** → **Import Skills**
3. Select `skills/sample-skills.json`
4. Skills imported to skills collection

---

## ⚠️ Important Notes

### Tab-Specific Validation
- **Each tab only accepts its own data format**
- Importing TAT rules to Workflow tab will show an error
- Importing workflow rules to TAT tab will show an error
- Always ensure you're on the correct tab before importing

### Data Format Requirements

#### Workflow Rules Must Have:
- `type`: "AUTO_WORKFLOW_RULES"
- `operator` field in standardFieldCriteria
- Actions (optional): reassign, createTasks, close, generateLetters, etc.

#### TAT Rules Must Have:
- `sourceDateTimeField`, `units`, `unitsOfMeasure`
- NO `operator` field (implicitly "IN")
- TAT-specific fields: holidayDates, dueTime, etc.

#### Skills Must Have:
- `skillName`, `skillCode`
- `diagnosisCodes` array
- `serviceCodes` array

### Diagnosis Codes (ICD-10)
- Format: Standard ICD-10 codes
- Examples: `E11` (Type 2 Diabetes), `I50` (Heart Failure)
- Prefix matching: `E11` matches `E11.9`, `E11.65`, etc.

### Service Codes (CPT/HCPCS)
- Format: 5-digit procedure codes
- Examples: `99213` (Office visit), `27447` (Knee replacement)
- Standard CPT and HCPCS Level II codes

---

## 📊 Sample Data Use Cases

### Testing & Development
- Import samples to test UI functionality
- Validate JSON export/import round-trip
- Test rule evaluation logic

### Demos & Training
- Show realistic healthcare workflows
- Demonstrate complex rule configurations
- Train users on rule builder features

### Production Templates
- Copy and modify for your organization
- Adapt diagnosis/service codes to your needs
- Customize department codes and workflows

---

## 🏥 Healthcare Compliance

These samples follow industry standards:
- ✅ HIPAA-compliant (no PHI included)
- ✅ Standard ICD-10 diagnosis codes
- ✅ Standard CPT/HCPCS procedure codes
- ✅ Realistic prior authorization workflows
- ✅ CMS regulatory TAT requirements

---

## 🤝 Contributing

To add more sample data:
1. Follow existing file formats
2. Use realistic healthcare scenarios
3. Include accurate ICD-10/CPT codes
4. Document new samples in this README
5. Test import/export functionality

---

## 📝 License

Sample data is provided as-is for testing and demonstration purposes.
