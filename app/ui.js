import document from 'document';
import {TEMPLATE, VIEW} from './ui/views';
import {getControllerForView} from './ui/views/loaders';

/**
 * User interface module
 */
class UserInterface {
  /**
   * Constructor function
   * @param {TimeEntryRepository} entriesRepo
   */
  constructor({entriesRepo}) {
    this.entriesRepo = entriesRepo;
    this._viewControllers = {};
    this._activeController = null;
  }

  /**
   * Launches initial ui state
   */
  async initialize() {
    await this.navigate(VIEW.CurrentEntry);
  }

  async navigate(view) {
    if (this._activeController) {
      this._activeController.destroyed();
    }

    document.replaceSync(TEMPLATE[view] || TEMPLATE._default);
    // TODO: check if view changed before navigate

    this._viewControllers[view] = this._viewControllers[view] || new (await getControllerForView(view))({
      entriesRepo: this.entriesRepo,
      ui: this,
    });

    this._activeController = this._viewControllers[view];
    this._activeController.mounted();
  }

  /**
   * Hide how application can be configured message
   * @return {Promise}
   */
  hideConfigurationRequired() {
    return this.navigate(VIEW.CurrentEntry);
  }

  /**
   * Shows how application can be configured
   * @return {Promise}
   */
  showConfigurationRequired() {
    return this.navigate(VIEW.ConfigurationRequired);
  }
}

export {
  UserInterface,
};
