# TravelHub Testing Suite

Comprehensive testing infrastructure for TravelHub backend API.

## Overview

This testing suite provides multiple levels of testing coverage:

- **Unit Tests**: Test individual services and functions in isolation
- **Integration Tests**: Test API endpoints and database interactions
- **E2E Tests**: Test complete user flows
- **Load Tests**: Test performance under load

## Test Coverage

Current status: **86 passing tests** across unit and integration suites.

### Unit Tests (86 tests)
- ✅ `cache.service.test.ts` - 31 tests
- ✅ `currency.service.test.ts` - 25 tests
- ✅ `analytics.service.test.ts` - 30 tests

### Integration Tests
- ✅ `auth.test.ts` - Authentication API endpoints

### E2E Tests
- ✅ `user-booking-flow.e2e.ts` - Complete user journey

### Load Tests
- ✅ `api-load-test.js` - Normal load testing
- ✅ `stress-test.js` - Stress testing
- ✅ `spike-test.js` - Spike testing

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Types
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage report
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

## Test Structure

```
tests/
├── setup.ts                    # Global test configuration
├── utils/
│   └── testHelpers.ts         # Reusable test utilities
├── fixtures/
│   ├── users.ts               # Test user data
│   ├── flights.ts             # Test flight data
│   └── hotels.ts              # Test hotel data
├── unit/
│   └── services/              # Unit tests for services
│       ├── cache.service.test.ts
│       ├── currency.service.test.ts
│       └── analytics.service.test.ts
├── integration/
│   └── auth.test.ts           # Integration tests for auth API
├── e2e/
│   └── user-booking-flow.e2e.ts  # E2E tests
└── load/
    ├── README.md              # Load testing documentation
    ├── api-load-test.js       # Load test
    ├── stress-test.js         # Stress test
    └── spike-test.js          # Spike test
```

## Writing Tests

### Unit Tests

Unit tests use Vitest and mock all external dependencies:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { myService } from '@/services/myService';

// Mock dependencies
vi.mock('@/services/dependency', () => ({
  dependency: {
    method: vi.fn(),
  },
}));

describe('MyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    const input = 'test';

    // Act
    const result = await myService.doSomething(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Integration Tests

Integration tests use Supertest to test actual HTTP endpoints:

```typescript
import { describe, it, expect } from 'vitest';
import supertest from 'supertest';

describe('API Integration Tests', () => {
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    const appModule = await import('@/index');
    request = supertest(appModule.default);
  });

  it('should register a user', async () => {
    const response = await request
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Test123!' })
      .expect(201);

    expect(response.body.success).toBe(true);
  });
});
```

### E2E Tests

E2E tests use Playwright to test complete user flows:

```typescript
import { test, expect } from '@playwright/test';

test('Complete booking flow', async ({ request }) => {
  // Register
  const registerRes = await request.post('/api/auth/register', {
    data: { email: 'user@example.com', password: 'Test123!' },
  });
  expect(registerRes.ok()).toBeTruthy();

  // Search flights
  const searchRes = await request.get('/api/flights/search?...');
  expect(searchRes.ok()).toBeTruthy();
});
```

### Load Tests

Load tests use k6 to simulate concurrent users:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:5000/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

## Test Utilities

### Mock Helpers

Located in `tests/utils/testHelpers.ts`:

```typescript
import { mockRequest, mockResponse, mockNext } from '@tests/utils/testHelpers';

// Mock Express request
const req = mockRequest({
  body: { email: 'test@example.com' },
  user: { id: '123' },
});

// Mock Express response
const res = mockResponse();

// Mock Next function
const next = mockNext();
```

### Test Fixtures

Located in `tests/fixtures/`:

```typescript
import { mockUser, validUserData } from '@tests/fixtures/users';
import { mockFlight, validFlightSearchParams } from '@tests/fixtures/flights';
import { mockHotel } from '@tests/fixtures/hotels';
```

## Coverage Requirements

- **Minimum Coverage**: 80% (lines, functions, branches, statements)
- **Target Coverage**: 90%
- **Critical Paths**: 100%

### Check Coverage
```bash
npm run test:coverage
```

Coverage reports are generated in:
- `coverage/index.html` - HTML report (open in browser)
- `coverage/lcov.info` - LCOV format for CI
- `coverage/coverage-summary.json` - JSON summary

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Every push to main, develop, and claude/** branches
- Every pull request
- Scheduled nightly (E2E tests)
- Weekly (load tests)

Workflows:
- `.github/workflows/test.yml` - Unit and integration tests
- `.github/workflows/e2e.yml` - E2E tests
- `.github/workflows/load-test.yml` - Load tests

### Pre-commit Hooks

Recommended pre-commit hook (`.git/hooks/pre-commit`):

```bash
#!/bin/sh
npm run test:unit
npm run lint
```

## Environment Variables

Tests use `.env.test` for configuration:

```env
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/travelhub_test
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-jwt-secret
```

## Debugging Tests

### VSCode Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Unit Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:unit"],
  "console": "integratedTerminal"
}
```

### Verbose Output

```bash
# Run tests with verbose output
VERBOSE=true npm test

# Run specific test file
npm test -- tests/unit/services/cache.service.test.ts

# Run tests matching pattern
npm test -- --grep "authentication"
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on others
2. **Cleanup**: Always clean up resources after tests
3. **Mocking**: Mock external dependencies to avoid flaky tests
4. **Assertions**: Use specific assertions, not generic ones
5. **Naming**: Use descriptive test names that explain what is being tested
6. **AAA Pattern**: Arrange, Act, Assert structure
7. **DRY**: Extract common setup to `beforeEach`/`beforeAll`

### Good Test Example

```typescript
it('should calculate total price with tax correctly', () => {
  // Arrange
  const price = 100;
  const taxRate = 0.2;
  const expected = 120;

  // Act
  const result = calculateTotalWithTax(price, taxRate);

  // Assert
  expect(result).toBe(expected);
});
```

### Bad Test Example

```typescript
it('works', () => {
  const result = doSomething();
  expect(result).toBeTruthy(); // Too generic
});
```

## Troubleshooting

### Tests Failing Locally

1. Check Node.js version (requires 18.x or 20.x)
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Check environment variables in `.env.test`
4. Ensure database and Redis are running

### Slow Tests

1. Use `.only()` to run specific tests during development
2. Check for unnecessary `await` calls
3. Mock external API calls
4. Use shorter timeouts in test environment

### Flaky Tests

1. Add proper wait conditions
2. Avoid hardcoded delays (`sleep`)
3. Mock time-dependent functions
4. Ensure proper cleanup between tests

## Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Ensure coverage** remains above 80%
3. **Update fixtures** if adding new data types
4. **Document test cases** in code comments
5. **Run full suite** before committing

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
- [Testing Best Practices](https://testingjavascript.com/)

## Support

For questions or issues with tests:

1. Check this README
2. Review test examples in this directory
3. Create an issue in GitHub
4. Contact the development team
