import {DEVICE_QUEUE_SIZE, Transmitter} from '../common/transmitter';
import {MESSAGE_TYPE} from '../common/constants/message-types';
import {UserInterface} from './ui';
import {TimeEntryRepository} from './time-entry.repository';
import {memory} from 'system';
import {showMemoryInfo} from './development/monitoring';

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
    this._entriesRepo = null;
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
   * Initiates ui module to work with tracking
   * @return {*|UserInterface}
   */
  get ui() {
    return this._ui = this._ui || new UserInterface({entriesRepo: this.entriesRepo});
  }

  /**
   * Initiates time entries repository
   * @return {TimeEntryRepository}
   */
  get entriesRepo() {
    return this._entriesRepo = this._entriesRepo || new TimeEntryRepository({transmitter: this.transmitter});
  }

  /**
   * Launches initial handlers and subscriptions
   * @private
   */
  _initialize() {
    showMemoryInfo();
    this._subscribeOnMessages();
    memory.monitor.onmemorypressurechange = () => showMemoryInfo();
    showMemoryInfo();
  }

  /**
   * Subscribes on incoming messages
   * @private
   */
  _subscribeOnMessages() {
    // TODO: move to state repo
    this.transmitter.onMessage(MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE, ({configured}) => {
      if (!configured) {
        return this.ui.showConfigurationRequired();
      }

      this.ui.hideConfigurationRequired();
    });
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
