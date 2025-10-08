# Rules Pilot - AI-Powered Rules Builder

A modern, AI-enhanced rules engine built with React, TypeScript, Tailwind CSS 4.0, and Claude AI.

## 🚀 Features

- **Visual Rule Builder** - Drag-and-drop interface for creating complex business rules
- **AI-Powered Suggestions** - Claude AI helps generate and improve rules
- **Type-Safe** - Built with TypeScript for robust development
- **Modern UI** - Tailwind CSS 4.0 with beautiful, responsive components
- **State Management** - Zustand for simple, powerful state management
- **Form Validation** - React Hook Form + Zod for type-safe forms

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

## 🛠️ Installation

Dependencies are already installed! Just run:

```bash
npm run dev
```

**Note:** Tailwind CSS 4.0 is currently in alpha. The dev server works perfectly, but production builds may have issues. If you encounter build problems, you can downgrade to Tailwind 3.x:
```bash
npm install -D tailwindcss@3 @tailwindcss/vite@3
```

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

## 🎯 Getting Started

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Build for production:**
   ```bash
   npm run build
   ```

3. **Preview production build:**
   ```bash
   npm run preview
   ```

4. **Lint code:**
   ```bash
   npm run lint
   ```

## 🤖 AI Features

The app integrates Claude AI for:
- **Rule Generation** - Describe what you want and Claude creates the rule
- **Rule Improvement** - Get AI suggestions to improve existing rules
- **Smart Descriptions** - Auto-generate clear rule descriptions

## 🔑 Environment Variables

Your API keys are already configured in `.env`:

**Claude AI:**
- `VITE_ANTHROPIC_API_KEY` - Claude AI API key
- `VITE_ENABLE_CHAT` - Enable AI chat features

**Firebase:**
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Firebase measurement ID

⚠️ **Security Note:** The current setup uses `dangerouslyAllowBrowser: true` for Claude AI in development. For production, implement a backend API to keep your API key secure.

## 📝 Core Concepts

### Rules
A rule consists of:
- **Conditions** - When should this rule trigger?
- **Actions** - What should happen when triggered?

### Rule Groups
Combine multiple rules with AND/OR logic for complex workflows.

### Operators
- equals, notEquals
- contains
- greaterThan, lessThan
- greaterThanOrEqual, lessThanOrEqual

### Actions
- setValue - Set a field value
- sendEmail - Send an email
- webhook - Call an external API
- calculate - Perform calculations
- aiProcess - Process with AI

## 🎨 UI Components

Pre-built components ready to use:
- `Button` - Primary, secondary, outline, ghost, danger variants
- `Card` - Card, CardHeader, CardContent

## 🔥 Firebase Setup

Before you start, set up Firebase:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project `rulesp`
3. Enable **Firestore Database** (start in test mode)
4. Enable **Email/Password Authentication**

See [FIREBASE.md](./FIREBASE.md) for complete setup instructions.

## 📚 Next Steps

Now you can start building:
1. **Set up Firebase** (see above and FIREBASE.md)
2. Create your rules builder UI components
3. Implement the rule execution engine
4. Add more AI-powered features
5. Build the drag-and-drop interface
6. Rules automatically save to Firestore!

## 🔧 Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

Happy building! 🚀
