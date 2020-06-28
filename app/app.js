import {DEVICE_QUEUE_SIZE, Transmitter} from '../common/transmitter';
import {Tracking} from './tracking';
import {memory} from 'system';
import {MESSAGE_TYPE} from '../common/message-types';
import {UserInterface} from './new-ui';

/**
 * Application module manages how different modules setup
 */
class App {
  /**
    Constructor function. Ensures app is a singleton
   */
  constructor() {
    if (App._instance) {
      throw new Error('App is already launched. Use App.instance');
    }

    this._transmitter = null;
    this._tracking = null;
    App._instance = this;

    this._initialize();
  }

  /**
   * Setups the transmission module
   * @return {Transmitter}
   */
  get transmitter() {
    return this._transmitter = this._transmitter || new Transmitter({queueSize: DEVICE_QUEUE_SIZE});
  }

  /**
   * Setups the tracking module
   * @return {Tracking}
   */
  get tracking() {
    return this._tracking = this._tracking || new Tracking({transmitter: this.transmitter});
  }

  /**
   * Initiates ui module to work with tracking
   * @return {*|UserInterface}
   */
  get ui() {
    return this._ui = this._ui || new UserInterface({tracking: this.tracking});
  }

  /**
   * Launches initial handlers and subscriptions
   * @private
   */
  _initialize() {
    this._showMemoryInfo();
    this._subscribeOnMessages();
    memory.monitor.onmemorypressurechange = () => this._showMemoryInfo();
    this._showMemoryInfo();
  }

  /**
   * Subscribes on incoming messages
   * @private
   */
  _subscribeOnMessages() {
    this.transmitter.onMessage(MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE, ({configured}) => {
      if (!configured) {
        return this.ui.showConfigurationRequired();
      }

      this.ui.hideConfigurationRequired();
    });

    this.transmitter.onMessage(MESSAGE_TYPE.CURRENT_ENTRY_UPDATE, (entry) => {
      this.tracking.currentEntryUpdated(entry);
    });
  }

  /**
   * Show current memory consumption
   * @private
   */
  _showMemoryInfo() {
    const memoryInfo = {
      used: memory.js.used,
      total: memory.js.total,
      peak: memory.js.peak,
    };

    console.log(`Memory: ${JSON.stringify(memoryInfo)}`);
  }

  /**
   * A accessor which gets us to the app module
   * @return {App}
   */
  static get instance() {
    return this._instance = this._instance || new App();
  }
}

export {
  App,
};
