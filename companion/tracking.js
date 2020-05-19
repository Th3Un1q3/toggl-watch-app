/**
 * The module is responsible for time tracking
 */
import {MESSAGE_TYPE} from '../common/message-types';
import {gettext} from 'i18n';
import {debug} from '../common/debug';

const NO_PROJECT_COLOR = '#a0a0a0';

const CURRENT_ENTRY_REFRESH_INTERVAL_MS = 15000;

const OPTIMAL_TEXTS_LENGTH = 64;

const entryUniquenessId = ({id, start, stop, pid, description}) => [id, start, stop, pid, description].join(':');

const optimiseStringForDisplaying = (input) => {
  if (input && input.length > OPTIMAL_TEXTS_LENGTH) {
    return input.slice(0, OPTIMAL_TEXTS_LENGTH - 3) + '...';
  }
  return input;
};

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
    this._updateCurrentEntryInterval = null;
    this.user = null;
    this.currentEntry = null;
    this.projects = [];

    this.initialize();
  }

  /**
   * Initializes a new tracking session
   * @return {Promise<void>}
   */
  async initialize() {
    await this._updateUserData();
    await this._setupCurrentEntryTrack();
    debug('tracking initialized');
  }

  /**
   * Starts process of current time entry tracking.
   * @return {Promise<void>}
   * @private
   */
  async _setupCurrentEntryTrack() {
    await this.updateCurrentEntry();

    if (this._updateCurrentEntryInterval) {
      clearInterval(this._updateCurrentEntryInterval);
    }

    this._updateCurrentEntryInterval = setInterval(() => {
      this.updateCurrentEntry();
    }, CURRENT_ENTRY_REFRESH_INTERVAL_MS);
  }

  /**
   * Fetch and preserve user specific data for future needs.
   * @return {Promise<void>}
   * @private
   */
  async _updateUserData() {
    this.user = await this._api.fetchUserInfo();
    this.projects = await this._api.fetchProjects();
  }

  /**
   * Updates current entry status and info
   * @return {Promise<void>}
   */
  async updateCurrentEntry() {
    const fetchedEntry = await this._fetchMostRecentEntry();

    if (this._matchesAlreadyFetchedEntry(fetchedEntry)) {
      return;
    }

    this.currentEntry = fetchedEntry;

    this._transmitter.sendMessage({
      type: MESSAGE_TYPE.CURRENT_ENTRY_UPDATE,
      data: this._currentEntryMessage,
    });
  }

  /**
   * Returns the most recent time entry either currently active or last active one.
   * @return {Promise<Object|null|undefined>}
   * @private
   */
  async _fetchMostRecentEntry() {
    return await this._api.fetchCurrentEntry() || (await this._api.fetchTimeEntries() || [])[0];
  }

  /**
   * Checks if provided entry matches already fetched one
   * @param {Object} fetchedEntry
   * @return {null|*}
   * @private
   */
  _matchesAlreadyFetchedEntry(fetchedEntry) {
    return this.currentEntry && entryUniquenessId(fetchedEntry) === entryUniquenessId(this.currentEntry);
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
      color: NO_PROJECT_COLOR,
      projectName: gettext('no_project'),
    };

    const projectInfo = project && {
      color: project.color,
      projectName: optimiseStringForDisplaying(project.name),
    } || noProject;

    const start = !this.currentEntry.stop && Date.parse(this.currentEntry.start);

    return {
      id: this.currentEntry.id,
      desc: optimiseStringForDisplaying(this.currentEntry.description),
      billable: this.currentEntry.billable,
      ...(start ? {start} : {}),
      ...projectInfo,
    };
  }
}

export {
  Tracking,
  CURRENT_ENTRY_REFRESH_INTERVAL_MS,
  NO_PROJECT_COLOR,
  OPTIMAL_TEXTS_LENGTH,
};
