# Rules Pilot - AI-Powered Healthcare Authorization Rules Engine

A modern, intelligent rules builder for healthcare authorization workflows. Built with React, TypeScript, Firebase, and Claude AI (Sonnet 4.0).

## 🚀 Features

### 🎯 Core Functionality
- **Visual Rule Builder** - Intuitive UI for creating complex authorization rules
- **40+ Standard Fields** - Complete field support across Enrollment, Member, Provider, Request, Review Outcome, Service, and Stage categories
- **AI-Powered Rule Generation** - Natural language to rule conversion using Claude Sonnet 4.0
- **Real-time Validation** - Comprehensive validation based on business requirements
- **JSON Export** - Export rules in the exact format required for your authorization engine
- **Firebase Integration** - Real-time data synchronization and storage

### 🤖 AI Assistant
- Generate rules from natural language descriptions
- Auto-complete and suggestions
- Rule description improvement
- Validation error fixing
- Interactive chat support

### 📊 Rule Management
- **Table View** - Modern, searchable table matching your UI requirements
- **Bulk Actions** - Activate/deactivate/delete multiple rules at once
- **Status Management** - Toggle rules between active and inactive
- **Weight System** - Priority-based rule execution
- **Activation Dates** - Schedule rules to activate on specific dates
- **Search & Filter** - Find rules by code, name, or category
- **Clone Rules** - Duplicate existing rules for faster creation

### ✅ Validation System
- Operator-value count validation
- Data type validation (INTEGER, DATE, STRING, BOOLEAN)
- Provider role requirement enforcement
- Date format validation (YYYY-MM-DD)
- Custom field constraints

## 📦 Tech Stack

- **React 18** - Modern React with hooks
- **Vite 6** - Lightning-fast build tool
- **TypeScript** - Type safety throughout
- **Tailwind CSS 4.0** - Latest Tailwind with new features
- **Firebase** - Firestore database, Authentication, and Analytics
- **Zustand** - Lightweight state management
- **React Hook Form** - Performant form handling
- **Zod** - Schema validation
- **Anthropic Claude AI** - AI-powered rule generation
- **Headless UI** - Accessible component primitives
- **Lucide React** - Beautiful icons
- **React DnD** - Drag and drop functionality

## Standard Fields Support

### Enrollment Fields (IN, NOT_IN)
- `ENROLLMENT_GROUP_ID`, `ENROLLMENT_LINE_OF_BUSINESS`, `ENROLLMENT_PLAN`

### Member Fields
- `MEMBER_AGE` (EQUALS, GREATER_THAN_OR_EQUAL_TO, GREATER_THAN, LESS_THAN_OR_EQUAL_TO, LESS_THAN, BETWEEN)
- `MEMBER_CLIENT`, `MEMBER_STATE` (IN, NOT_IN)

### Provider Fields (all require providerRole)
- `PROVIDER_ALTERNATE_ID` (IN, NOT_IN) - requires alternateIdType
- `PROVIDER_NPI`, `PROVIDER_PRIMARY_ADDRESS_POSTAL_CODE`, `PROVIDER_PRIMARY_ADDRESS_STATE`
- `PROVIDER_PRIMARY_SPECIALTY`, `PROVIDER_SET` (IN, NOT_IN)

### Request Fields
- `REQUEST_CLASSIFICATION`, `REQUEST_DIAGNOSIS_CODE`, `REQUEST_DISPOSITION` (IN, NOT_IN)
- `REQUEST_FROM_DATE`, `REQUEST_THROUGH_DATE` (date operators)
- `REQUEST_HEALTHCARE_TYPE`, `REQUEST_INTAKE_SOURCE`, `REQUEST_ORIGINATING_SYSTEM_SOURCE` (IN, NOT_IN)
- `REQUEST_PRIMARY_DIAGNOSIS_CODE`, `REQUEST_STATE`, `REQUEST_STATUS` (IN, NOT_IN)
- `REQUEST_TREATMENT_SETTING`, `REQUEST_TYPE`, `REQUEST_URGENCY` (IN, NOT_IN)

### Review Outcome Fields (IN, NOT_IN)
- `REVIEW_OUTCOME_LEVEL_OF_CARE`, `REVIEW_OUTCOME_STATUS`, `REVIEW_OUTCOME_STATUS_REASON`

### Service Fields
- `SERVICE_CODE`, `SERVICE_LEVEL_OF_CARE`, `SERVICE_PLACE_OF_SERVICE` (IN, NOT_IN)
- `SERVICE_PRIMARY_FLAG`, `SERVICE_REQUESTED_UNITS_UOM`, `SERVICE_REVIEW_TYPE` (IN, NOT_IN)
- `SERVICE_REQUESTED_UNITS` (numeric operators)
- `SERVICE_STATE`, `SERVICE_TREATMENT_TYPE` (IN, NOT_IN)

### Stage Fields (IN, NOT_IN)
- `STAGE_PRIMARY_SERVICE_CODE`, `STAGE_TYPE`

### Custom Fields
- Member, Enrollment, and Request custom fields (IN, NOT_IN operators only)

## 🛠️ Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file:

```env
# Claude AI (Anthropic)
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Set Up Firebase
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Copy your Firebase config to the `.env` file
4. The app will auto-create these collections:
   - `dictionaries` - for dictionary data
   - `rules` - for rules storage

### 4. Get Claude API Key
1. Sign up at https://console.anthropic.com
2. Create an API key
3. Add it to your `.env` file

### 5. Run the Application
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── ui/             # Base UI components (Button, Card, etc.)
├── config/             # Configuration files
│   └── firebase.ts     # Firebase initialization
├── features/           # Feature-specific components
│   └── rules-builder/  # Rules builder feature
│       └── components/ # Rules builder UI components
├── services/           # External services
│   ├── ai/            # Claude AI integration
│   └── firebase/      # Firebase services (Firestore, Auth)
├── store/             # Zustand state management
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── hooks/             # Custom React hooks (including Firebase sync)
```

## 📖 Usage

### Creating a Rule with AI

1. Click the **AI Assistant** button in the header
2. Type a natural language description, for example:
   ```
   Create a rule for members in Pennsylvania with Custom Field MEMCFLD1
   not valued with LOW and a Servicing Provider with Primary Specialty Orthopedics
   ```
3. The AI will generate the rule structure
4. Review and edit in the Rule Builder
5. Save the rule

### Creating a Rule Manually

1. Click **New Rule** button
2. Fill in the rule information:
   - Description (required)
   - Weight (for priority)
   - Activation Date
   - Category
   - Status (Active/Inactive)
3. Add Standard Field Criteria:
   - Select field from categorized dropdown
   - Choose operator
   - Enter values
   - For provider fields, select provider role
4. Add Custom Field Criteria (optional):
   - Select association (Member/Enrollment/Request)
   - Enter template ID
   - Choose operator (IN/NOT_IN)
   - Enter values
5. Click **Save Rule**

### Bulk Actions

1. Select multiple rules using checkboxes
2. Use bulk action buttons:
   - **Activate** - Set selected rules to active
   - **Deactivate** - Set selected rules to inactive
   - **Delete** - Remove selected rules
   - **Export All** - Download all rules as JSON
   - **Export Active** - Download only active rules

### JSON Export Format

Rules export in this exact format:

```json
{
  "ruleDesc": "Request with Member in Pennsylvania with Servicing Provider Orthopedics",
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
  ],
  "weight": 100
}
```

## 🎯 Development

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

## 🤖 AI Features

The app integrates Claude AI for:
- **Rule Generation** - Describe what you want and Claude creates the rule
- **Rule Improvement** - Get AI suggestions to improve existing rules
- **Smart Descriptions** - Auto-generate clear rule descriptions

## Operators

### String Operators
- `IN` - Value matches any of the specified values
- `NOT_IN` - Value does not match any of the specified values

### Numeric Operators (for INTEGER fields)
- `EQUALS` - Exactly equals the value
- `GREATER_THAN` - Greater than the value
- `GREATER_THAN_OR_EQUAL_TO` - Greater than or equal to the value
- `LESS_THAN` - Less than the value
- `LESS_THAN_OR_EQUAL_TO` - Less than or equal to the value
- `BETWEEN` - Between two values (inclusive)

### Date Operators (for DATE fields)
- Same as numeric operators, with dates in YYYY-MM-DD format

## Validation Rules

1. **Operator-Value Count**:
   - EQUALS, GREATER_THAN*, LESS_THAN*: exactly 1 value
   - BETWEEN: exactly 2 values
   - IN, NOT_IN: at least 1 value

2. **Data Types**:
   - INTEGER: Must be valid integers
   - DATE: Must be YYYY-MM-DD format
   - BOOLEAN: true/false

3. **Provider Fields**:
   - All provider fields MUST have providerRole
   - PROVIDER_ALTERNATE_ID MUST have alternateIdType

4. **Custom Fields**:
   - Only IN and NOT_IN operators allowed
   - Association must be MEMBER, ENROLLMENT, or REQUEST

## Weight System

Rules can have weights for priority-based execution:
- Higher weight = higher priority
- Rules are evaluated in order of weight (descending)
- Actions from higher weight rules execute first
- Use weights to control rule precedence

## Dictionary Management

Dictionaries are loaded from CSV files in `/public/dictionaries/` and synced to Firebase.

### CSV Format
```csv
Code,Description,Active
VALUE1,Description 1,true
VALUE2,Description 2,true
```

## iFrame Support

The application is designed to be embedded in larger applications:

```html
<iframe
  src="http://your-rules-app-url"
  style="width: 100%; height: 100vh; border: none;"
></iframe>
```

## Architecture

### Key Components
- `RulesTable` - Main table view with search, filters, and bulk actions
- `RuleBuilder` - Modal for creating/editing rules
- `AIAssistant` - Natural language rule generation
- `StandardCriteriaEditor` - Edit standard field criteria
- `CustomCriteriaEditor` - Edit custom field criteria

### Services
- `rulesService` - CRUD operations for rules
- `dictionaryService` - Dictionary loading and caching
- `validationService` - Rule validation logic
- `claude` - AI integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

---

Built with ❤️ using React, TypeScript, and Claude AI
