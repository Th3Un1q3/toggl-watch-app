import {bootstrap} from './bootstrap';
import {initIncomingMessagesHandler} from './transmission';
import {enableLoader} from './ui';
import {_resetSystem, memory} from 'system';


jest.mock('./ui');
jest.mock('./transmission');

describe('App bootstrap', () => {
  beforeEach(() => {
    _resetSystem();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  it('should enable loader on start', () => {
    expect(enableLoader).not.toHaveBeenCalled();
    bootstrap();
    expect(enableLoader).toHaveBeenCalledTimes(1);
  });

  it('should subscribe on messages', () => {
    expect(initIncomingMessagesHandler).not.toHaveBeenCalled();
    bootstrap();

    expect(initIncomingMessagesHandler).toHaveBeenCalledTimes(1);
  });

  it('should console log on launch', () => {
    expect(bootstrap).toEqual(expect.any(Function));

    expect(console.log).not.toHaveBeenCalled();

    bootstrap();

    expect(console.log).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('App init');
  });

  describe('memory tracking', () => {
    it('should show stats on pressure change', () => {
      const initialExpectedStats = `Memory: ${JSON.stringify(memory.js)}`;
      bootstrap();

      const monitorSubscriber = memory.monitor._onmemorypressurechangeHandler;

      expect(monitorSubscriber).toEqual(expect.any(Function));

      monitorSubscriber();

      expect(console.log).toHaveBeenLastCalledWith(
          initialExpectedStats,
      );

      memory._jsInfo = {
        used: 3,
        total: 20,
        peak: 15,
      };

      monitorSubscriber();

      expect(console.log).toHaveBeenLastCalledWith(
          `Memory: ${JSON.stringify(memory.js)}`,
      );
    });
  });
});
