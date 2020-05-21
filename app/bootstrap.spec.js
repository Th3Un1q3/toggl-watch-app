import _ from 'lodash';
import {bootstrap} from './bootstrap';
import {initIncomingMessagesHandler} from './transmission';
import {enableLoader} from './ui';
import {_resetSystem, memory} from 'system';
import {DEVICE_QUEUE_SIZE, Transmitter} from '../common/transmitter';
import {Tracking} from './tracking';


jest.mock('./ui');
jest.mock('./transmission');
jest.mock('../common/transmitter');
jest.mock('./tracking');

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

  it('should create correct transmitter instance', () => {
    expect(Transmitter).not.toHaveBeenCalled();

    bootstrap();

    expect(Transmitter).toHaveBeenCalledTimes(1);
    expect(Transmitter).toHaveBeenLastCalledWith({queueSize: DEVICE_QUEUE_SIZE});
  });

  it('should subscribe on messages', () => {
    expect(initIncomingMessagesHandler).not.toHaveBeenCalled();
    bootstrap();

    expect(initIncomingMessagesHandler).toHaveBeenCalledTimes(1);
    expect(initIncomingMessagesHandler).toHaveBeenLastCalledWith({
      transmitter: new Transmitter(),
      tracking: _.last(Tracking.mock.instances),
    });
  });

  it('should console log on launch', () => {
    expect(bootstrap).toEqual(expect.any(Function));

    expect(console.log).not.toHaveBeenCalled();

    bootstrap();

    expect(console.log).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('App init');
  });

  it('should create tracking instance with transmitter', () => {
    expect(Tracking).not.toHaveBeenCalled();

    bootstrap();

    expect(Tracking).toHaveBeenCalledTimes(1);
    expect(Tracking).toHaveBeenLastCalledWith({transmitter: new Transmitter()});
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
