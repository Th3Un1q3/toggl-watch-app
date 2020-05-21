import {MESSAGE_TYPE} from '../common/message-types';
import {gettext} from 'i18n';
import {debug} from '../common/debug';

const NO_PROJECT_COLOR = '#a0a0a0';

const CURRENT_ENTRY_REFRESH_INTERVAL_MS = 15000;

const OPTIMAL_TEXTS_LENGTH = 64;

const NO_PROJECT_INFO = {
  color: NO_PROJECT_COLOR,
  projectName: gettext('no_project'),
};

const EMPTY_TIME_ENTRY = {
  desc: gettext('no_description'),
  billable: false,
  ...NO_PROJECT_INFO,
};

const entryUniquenessId = ({id, start, stop, pid, description} = {}) => [id, start, stop, pid, description].join(':');

const optimiseStringForDisplaying = (input) => {
  if (input && input.length > OPTIMAL_TEXTS_LENGTH) {
    return input.slice(0, OPTIMAL_TEXTS_LENGTH - 3) + '...';
  }
  return input;
};

/**
 * The module is responsible for time tracking process
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
    this._attachCommandsProcessing();
    this.initialize();
  }

  /**
   * Initializes a new tracking session
   * @return {Promise<void>}
   */
  async initialize() {
    await this._updateUserData();
    await this._setupCurrentEntryTracking();
    debug('tracking initialized');
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
   * Defines how to process commands received from the device
   * @private
   */
  _attachCommandsProcessing() {
    this._transmitter.onMessage(MESSAGE_TYPE.STOP_CURRENT_ENTRY, async ({stop, id}) => {
      this.currentEntry = {
        ...this.currentEntry,
        stop: new Date(stop).toISOString(),
      };

      if (id === this.currentEntryId) {
        await this._api.updateTimeEntry(this.currentEntry);
      }

      await this._setupCurrentEntryTracking();
    });

    this._transmitter.onMessage(MESSAGE_TYPE.RESUME_LAST_ENTRY, async ({start, id}) => {
      this.currentEntry = {
        wid: this.user && this.user.default_workspace_id,
        ...this.currentEntry,
        stop: null,
        start: new Date(start).toISOString(),
      };

      if (id === this.currentEntryId) {
        await this._api.createTimeEntry(this.currentEntry);
      }

      await this._setupCurrentEntryTracking();
    });

    this._transmitter.onMessage(MESSAGE_TYPE.DELETE_CURRENT_ENTRY, async ({id}) => {
      if (id === this.currentEntryId) {
        await this._api.deleteTimeEntry(this.currentEntry);
      }
      this.currentEntry = null;
      await this._setupCurrentEntryTracking();
    });
  }

  get currentEntryId() {
    return this.currentEntry && this.currentEntry.id;
  }

  /**
   * Starts process of current time entry tracking.
   * @return {Promise<void>}
   * @private
   */
  async _setupCurrentEntryTracking() {
    if (this._updateCurrentEntryInterval) {
      clearInterval(this._updateCurrentEntryInterval);
    }

    await this.updateCurrentEntry();

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
   * @return {{id: *, billable: boolean, desc: string}}
   * @private
   */
  get _currentEntryMessage() {
    if (!this.currentEntry) {
      return EMPTY_TIME_ENTRY;
    }

    const start = this._currentEntryStartTimestamp;

    const desc = optimiseStringForDisplaying(this.currentEntry.description) || gettext('no_description');

    return {
      id: this.currentEntryId,
      billable: this.currentEntry.billable,
      desc,
      ...(start ? {start} : {}),
      ...this._currentEntryMessageProjectInfo,
    };
  }

  /**
   * Returns time in milliseconds from entry start in case if entry still running
   * @return {boolean|number}
   * @private
   */
  get _currentEntryStartTimestamp() {
    return !this.currentEntry.stop && Date.parse(this.currentEntry.start);
  }

  /**
   * Returns information about the project needs to be transported to the device
   * @return {*|{color: *, projectName: string}|{color: string, projectName: *}}
   * @private
   */
  get _currentEntryMessageProjectInfo() {
    return this._currentEntryProject && {
      color: this._currentEntryProject.color,
      projectName: optimiseStringForDisplaying(this._currentEntryProject.name),
    } || NO_PROJECT_INFO;
  }

  /**
   * returns project having id equals to pid of current entry
   * @return {*}
   * @private
   */
  get _currentEntryProject() {
    return this.projects.find(({id}) => id === this.currentEntry.pid);
  }
}

export {
  Tracking,
  CURRENT_ENTRY_REFRESH_INTERVAL_MS,
  NO_PROJECT_COLOR,
  NO_PROJECT_INFO,
  OPTIMAL_TEXTS_LENGTH,
};
