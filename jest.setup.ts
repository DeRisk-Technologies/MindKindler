// jest.setup.ts

// Mock the heavy AI libraries so tests don't initialize real GenKit / Google plugin.
// This prevents memory bloat and network calls during unit tests.

// Jest will hoist these mocks
jest.mock('@/ai/genkit', () => ({
  ai: {
    generate: jest.fn(async () => ({ output: { text: '{}' } })),
    definePrompt: jest.fn((opts) => {
      // Return a fake prompt function
      return async (input: any) => ({ output: { text: '{}' } });
    }),
    defineFlow: jest.fn((opts, fn) => fn),
  },
}));

jest.mock('genkit', () => ({
  genkit: jest.fn(() => ({
    generate: jest.fn(async () => ({ output: { text: '{}' } })),
    defineFlow: jest.fn((opts, fn) => fn),
    definePrompt: jest.fn(),
  })),
  z: require('zod'), // Use real zod for schema validaton in tests
}));

jest.mock('@genkit-ai/google-genai', () => ({
  googleAI: jest.fn(() => ({})),
}));
