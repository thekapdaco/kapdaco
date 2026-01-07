// jest.setup.js - Jest setup for ES modules
import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set test environment
process.env.NODE_ENV = 'test';

// Load environment variables for tests (fallback to .env if .env.test doesn't exist)
const testEnvPath = path.join(__dirname, 'api', '.env.test');
const defaultEnvPath = path.join(__dirname, 'api', '.env');

try {
  dotenv.config({ path: testEnvPath });
} catch (error) {
  // Fallback to default .env
  dotenv.config({ path: defaultEnvPath });
}

// Set default test database if not specified
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/kapda-co-test';
}

// Increase timeout for async operations
jest.setTimeout(10000);

// Note: We can't mock modules in jest.setup.js for ES modules easily
// Logger will be mocked per-test if needed, or we can use manual mocks
// For now, tests will use the actual logger (which is fine)

// Suppress console output during tests (optional - comment out if you want to see logs)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
// };

