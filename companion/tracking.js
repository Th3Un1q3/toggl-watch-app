import {MESSAGE_TYPE} from '../common/message-types';
import {gettext} from 'i18n';
import {debug} from '../common/debug';
import {Subject} from '../common/observable';

/**
 * Time entry message.
 * @typedef {Object} TimeEntryMessage
 * @property {boolean} cur - Indicates whether this is a current time entry.
 * @property {boolean} isPlaying - Indicates that transferred entry is now launched.
 * @property {boolean} bil - Indicates if time entry is billable.
 * @property {string} color - The hex-color of the project.
 * @property {number} start - Time stamp of entry start(ms, unix).
 * @property {string} projectName - The name of the project time entry attached to.
 * @property {string} desc - Description of time entry to be displayed(up to 64 char).
 */

const NO_PROJECT_COLOR = '#a0a0a0';

const ENTRIES_REFRESH_INTERVAL = 15000;

const OPTIMAL_TEXTS_LENGTH = 64;

const NO_PROJECT_INFO = {
  color: NO_PROJECT_COLOR,
  projectName: gettext('no_project'),
};

const EMPTY_TIME_ENTRY = {
  desc: gettext('no_description'),
  bil: false,
  ...NO_PROJECT_INFO,
};

const entryUniquenessId = (timeEntry) => {
  const {id, start, stop, pid, description} = timeEntry || {};
  return [id, start, stop, pid, description].join(':');
};

const isEntryTheSame = (entry1, entry2) => entry1 && entry2 && entryUniquenessId(entry1) === entryUniquenessId(entry2);

const optimiseStringForDisplaying = (input) => {
  if (input && input.length > OPTIMAL_TEXTS_LENGTH) {
    return input.slice(0, OPTIMAL_TEXTS_LENGTH - 3) + '...';
  }
  return input;
};

export const timeEntryDetails = (timeEntry, project) => {
  if (!timeEntry) {
    return EMPTY_TIME_ENTRY;
  }

  const start = Date.parse(timeEntry.start);

  const isPlaying = !timeEntry.stop;

  const desc = optimiseStringForDisplaying(timeEntry.description) || gettext('no_description');

  const projectInfo = project && {
    color: project.color,
    projectName: optimiseStringForDisplaying(project.name),
  } || NO_PROJECT_INFO;

  return {
    id: timeEntry.id,
    bil: timeEntry.billable,
    isPlaying,
    desc,
    start,
    ...projectInfo,
  };
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
    this._synchronisationInterval = null;
    this.user = null;
    this._currentEntry = new Subject(null, {
      changeOnly: isEntryTheSame,
    });
    this._timeEntriesLog = new Subject([], {changeOnly: true});
    this.projects = [];
    this._subscribeCurrentEntry();
    this._subscribeEntriesLog();
    this._attachCommandsProcessing();
    this.initialize();
  }

  /**
   * Sends a message with updated entry when current entry is changed
   * @private
   */
  _subscribeCurrentEntry() {
    this._currentEntry.subscribe(() => {
      this._transmitter.sendMessage({
        type: MESSAGE_TYPE.TIME_ENTRY_DETAILS,
        data: this._currentEntryMessage,
      });
    }, {immediate: true});
  }

  /**
   * Sends entries log update on change
   * @private
   */
  _subscribeEntriesLog() {
    this._timeEntriesLog.subscribe(() => {
      this._transmitter.sendMessage({
        type: MESSAGE_TYPE.ENTRIES_LOG_UPDATE,
        data: this._timeEntriesLog.value.map(({id}) => id),
      });
    }, {immediate: true});
  }

  /**
   * gets current entry value
   * @return {*}
   */
  get currentEntry() {
    return this._currentEntry.value;
  }

  /**
   * Returns a log of time entries
   * @return {*}
   */
  get timeEntriesLog() {
    return this._timeEntriesLog.value;
  }

  /**
   * Updates time entries log
   * @param {*} newLog
   */
  set timeEntriesLog(newLog) {
    this._timeEntriesLog.next(newLog);
  }

  /**
   * Updates current entry in place
   * @param {Object} newValue
   */
  set currentEntry(newValue) {
    this._currentEntry.next(newValue);
  }

  /**
   * Initializes a new tracking session
   * @return {Promise<void>}
   */
  async initialize() {
    await this._updateUserData();
    await this._fetchRecentTimeEntries();
    await this._launchEntriesRefreshing();
    debug('tracking initialized');
  }

  /**
   * Updates current entry status and info
   * @return {Promise<void>}
   */
  async refreshCurrentEntry() {
    this.currentEntry = await this._fetchMostRecentEntry();
  }

  /**
   * Defines how to process commands received from the device
   * @private
   */
  _attachCommandsProcessing() {
    // TODO: extract processing functions to methods
    this._transmitter.onMessage(MESSAGE_TYPE.STOP_TIME_ENTRY, async ({stop, id}) => {
      if (id === this.currentEntryId) {
        this.currentEntry = await this._api.updateTimeEntry({
          ...this.currentEntry,
          stop: new Date(stop).toISOString(),
        });
      }
    });

    this._transmitter.onMessage(MESSAGE_TYPE.START_TIME_ENTRY, async ({start, id}) => {
      if (id === this.currentEntryId) {
        this.currentEntry = await this._api.createTimeEntry({
          wid: this.user && this.user.default_workspace_id,
          ...this.currentEntry,
          stop: null,
          start: new Date(start).toISOString(),
        });
      }
    });

    this._transmitter.onMessage(MESSAGE_TYPE.DELETE_TIME_ENTRY, async ({id}) => {
      if (id === this.currentEntryId) {
        await this._api.deleteTimeEntry(this.currentEntry);
      }
      await this._launchEntriesRefreshing();
    });
  }

  /**
   * Returns and id of current time entry
   * @return {null|string}
   */
  get currentEntryId() {
    return this.currentEntry && this.currentEntry.id;
  }

  /**
   * Starts process of current time entry tracking.
   * @return {Promise<void>}
   * @private
   */
  async _launchEntriesRefreshing() {
    if (this._synchronisationInterval) {
      clearInterval(this._synchronisationInterval);
    }

    await this.refreshCurrentEntry();

    this._synchronisationInterval = setInterval(() => {
      this.refreshCurrentEntry();
    }, ENTRIES_REFRESH_INTERVAL);
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
    return await this._api.fetchCurrentEntry() || (this.timeEntriesLog)[0];
  }

  /**
   *  Returns a list of recent time entries
   * @return {Promise<*[]>}
   */
  async _fetchRecentTimeEntries() {
    this.timeEntriesLog = await this._api.fetchTimeEntries() || [];
  }

  /**
   * Getter for current entry info to be transferred to the device
   * @return {TimeEntryMessage} message of time entry
   * @private
   */
  get _currentEntryMessage() {
    return {
      ...timeEntryDetails(this.currentEntry, this._currentEntryProject),
      cur: true,
    };
  }

  /**
   * returns project having id equals to pid of current entry
   * @return {*}
   * @private
   */
  get _currentEntryProject() {
    return (this.projects || []).find(({id}) => this.currentEntry && id === this.currentEntry.pid);
  }
}

export {
  Tracking,
  ENTRIES_REFRESH_INTERVAL,
  NO_PROJECT_COLOR,
  NO_PROJECT_INFO,
  OPTIMAL_TEXTS_LENGTH,
};
