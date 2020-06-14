import '@testing-library/jest-dom';
let originalFetch;

beforeEach(() => {
  originalFetch = global.fetch;
  global.fetch = jest.fn();
  jest.useFakeTimers();
});

afterEach(() => {
  if (Date.now.mock) {
    Date.now.mockRestore();
  }
  global.fetch = originalFetch;
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.useRealTimers();
});
