/**
 * The module is responsible for time tracking
 */
import {MESSAGE_TYPE} from '../common/message-types';
import {gettext} from 'i18n';
import {debug} from '../common/debug';

/**
 *
 */
class Tracking {
  /**
   * Initialize tracking instance
   * @param {API} api
   * @param {Transmitter} transmitter
   */
  constructor({api, transmitter}) {
    this._api = api;
    this._transmitter = transmitter;
    this.initialize();
  }

  /**
   * Initializes a new tracking session
   * @return {Promise<void>}
   */
  async initialize() {
    this.currentEntry = null;
    this.projects = [];

    await this._api.fetchUserInfo();
    this.projects = await this._api.fetchProjects();

    await this.updateCurrentEntry();

    debug('tracking initialized');
  }

  /**
   * Updates current entry status and info
   * @return {Promise<void>}
   */
  async updateCurrentEntry() {
    this.currentEntry = await this._api.fetchCurrentEntry();

    this._transmitter.sendMessage({
      type: MESSAGE_TYPE.CURRENT_ENTRY_UPDATE,
      data: this._currentEntryMessage,
    });
  }

  /**
   * Getter for current entry info to be transferred to the device
   * @return {{id: string}|null}
   * @private
   */
  get _currentEntryMessage() {
    if (!this.currentEntry) {
      return null;
    }

    const project = this.projects.find(({id}) => id === this.currentEntry.pid);

    const noProject = {
      color: '#aaaaaa',
      projectName: gettext('no_project'),
    };

    const projectInfo = project && {
      color: project.color,
      projectName: project.name,
    } || noProject;

    const start = Date.parse(this.currentEntry.start);

    return {
      id: this.currentEntry.id,
      desc: this.currentEntry.description,
      billable: this.currentEntry.billable,
      start,
      ...projectInfo,
    };
  }
}

export {
  Tracking,
};
