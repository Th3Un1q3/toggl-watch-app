import {_el} from './ui/document-helper';
import {LOADER_STATE} from './ui';

/**
 * User interface module
 */
class UserInterface {
  /**
   * Constructor function
   */
  constructor() {
    this.initialize();
  }

  /**
   * Launches initial ui state
   */
  initialize() {
    this.enableLoader();
  }

  /**
   * Enables loader
   */
  enableLoader() {
    _el('loader-container').show();
    _el('loader').state = LOADER_STATE.ENABLED;
  }

  /**
   * Disables loader
   */
  disableLoader() {
    _el('loader-container').hide();
  }

  /**
   * Shows how application can be configured
   */
  showConfigurationRequired() {
    this.disableLoader();
    _el('configuration-instruction').show();
  }

  /**
   * Hide how application can be configured message
   */
  hideConfigurationRequired() {
    _el('configuration-instruction').hide();
  }
}

export {
  UserInterface,
};
