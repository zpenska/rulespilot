import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables
process.env.VITE_ANTHROPIC_API_KEY = 'test-api-key'
process.env.VITE_FIREBASE_API_KEY = 'test-firebase-key'
process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com'
process.env.VITE_FIREBASE_PROJECT_ID = 'test-project'
process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test.appspot.com'
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789'
process.env.VITE_FIREBASE_APP_ID = 'test-app-id'
process.env.VITE_FIREBASE_MEASUREMENT_ID = 'G-TEST123'

// Mock Firebase
vi.mock('../src/config/firebase', () => ({
  db: {},
  auth: {},
  analytics: null,
}))

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      constructor() {}
      messages = {
        create: vi.fn(),
      }
    },
  }
})

// Add custom matchers
expect.extend({
  toBeValidRule(received) {
    const hasDesc = received.ruleDesc && received.ruleDesc.length > 0
    const hasCriteria =
      (received.standardFieldCriteria && received.standardFieldCriteria.length > 0) ||
      (received.customFieldCriteria && received.customFieldCriteria.length > 0)

    return {
      pass: hasDesc && hasCriteria,
      message: () =>
        `Expected rule to have description and at least one criteria, but got: ${JSON.stringify(received)}`,
    }
  },

  toMatchJSONSchema(received) {
    const hasRequiredFields =
      'ruleDesc' in received &&
      'standardFieldCriteria' in received &&
      'isActive' in received &&
      'weight' in received

    const noUIFields =
      !('id' in received) &&
      !('code' in received) &&
      !('createdAt' in received) &&
      !('updatedAt' in received) &&
      !('status' in received) &&
      !('category' in received)

    return {
      pass: hasRequiredFields && noUIFields,
      message: () => `Expected valid export JSON schema but got: ${JSON.stringify(received)}`,
    }
  },
})

// Type augmentation for custom matchers
declare module 'vitest' {
  interface Assertion {
    toBeValidRule(): void
    toMatchJSONSchema(): void
  }
}
