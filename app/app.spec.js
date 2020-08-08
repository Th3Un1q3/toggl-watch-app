import {_resetSystem, memory} from 'system';
import {DEVICE_QUEUE_SIZE, Transmitter} from '../common/transmitter';
import {Tracking} from './tracking';
import {MESSAGE_TYPE} from '../common/message-types';
import {App} from './app';
import {UserInterface} from './ui';

jest.mock('./ui');
jest.mock('../common/transmitter');
jest.mock('./tracking');

describe('Application module', () => {
  beforeEach(() => {
    App._instance = null;
    _resetSystem();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    App._instance = null;
    console.log.mockRestore();
  });

  it('should be a singleton', () => {
    expect(() => new App()).not.toThrow();
    expect(() => App.instance).not.toThrow();

    expect(() => new App()).toThrow();

    expect(() => App.instance).not.toThrow();
  });

  describe('modules instantiation', () => {
    it('should create correct transmitter instance', () => {
      expect(Transmitter).not.toHaveBeenCalled();

      expect(App.instance.transmitter).toHaveProperty('onMessage');
      expect(App.instance.transmitter).toHaveProperty('sendMessage');

      expect(Transmitter).toHaveBeenCalledTimes(1);
      expect(Transmitter).toHaveBeenLastCalledWith({queueSize: DEVICE_QUEUE_SIZE});
    });

    it('should create tracking instance with transmitter', () => {
      expect(Tracking).not.toHaveBeenCalled();

      expect(App.instance.tracking).toBeInstanceOf(Tracking);

      expect(Tracking).toHaveBeenCalledTimes(1);
      expect(Tracking).toHaveBeenLastCalledWith({transmitter: App.instance.transmitter});
    });

    it('should create ui instance with tracking', () => {
      expect(UserInterface).not.toHaveBeenCalled();

      expect(App.instance.ui).toBeInstanceOf(UserInterface);

      expect(UserInterface).toHaveBeenCalledTimes(1);
      expect(UserInterface).toHaveBeenCalledWith({tracking: App.instance.tracking});
    });
  });

  describe('memory tracking', () => {
    it('should show stats on pressure change', () => {
      const initialExpectedStats = `Memory: ${JSON.stringify(memory.js)}`;

      expect(App.instance).toBeDefined();

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

  describe('incoming messages processing', () => {
    beforeEach(() => {
      App.instance;
    });

    describe('when message with type API_TOKEN_STATUS_UPDATE received', () => {
      const triggerMessageReceived = (data) => {
        Transmitter.emitMessageReceived(MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE, data);
      };

      it('should not call any ui changes unless message received', () => {
        expect(App.instance.ui.showConfigurationRequired).not.toHaveBeenCalled();
        expect(App.instance.ui.hideConfigurationRequired).not.toHaveBeenCalled();
      });

      describe('and data contains {configured: false}', () => {
        it('should call ui.showConfigurationRequired', () => {
          triggerMessageReceived({configured: false});

          expect(App.instance.ui.showConfigurationRequired).toHaveBeenCalled();
        });
      });

      describe('and data contains {configured: true}', () => {
        beforeEach(() => {
          triggerMessageReceived({configured: true});
        });

        it('should call ui.hideConfigurationRequired', () => {
          expect(App.instance.ui.hideConfigurationRequired).toHaveBeenCalledTimes(1);
        });

        it('should not call ui.showConfigurationRequired', () => {
          expect(App.instance.ui.showConfigurationRequired).not.toHaveBeenCalled();
        });
      });
    });
  });
});
