let originalFetch;

beforeEach(() => {
  originalFetch = global.fetch;
  global.fetch = jest.fn();
  jest.useFakeTimers();
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.useRealTimers();
});
