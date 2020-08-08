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

const timeEntryDetails = (timeEntry, project) => {
  if (!timeEntry) {
    return EMPTY_TIME_ENTRY;
  }

  const start = Date.parse(timeEntry.start);
  const stop = timeEntry.stop ? {stop: Date.parse(timeEntry.stop)} : {};

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
    ...stop,
    ...projectInfo,
  };
};

const turnIntoIndexedList = (entries, primaryKey) => Object.assign(
    {},
    ...(entries || []).map((timeEntry) => ({[timeEntry[primaryKey]]: timeEntry})),
);

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
    this.transmitter = transmitter;
    this._synchronisationInterval = null;
    this.user = null;
    this._currentEntry = new Subject(null, {
      changeOnly: isEntryTheSame,
    });
    this._timeEntriesLog = new Subject({}, {changeOnly: true});
    this.projects = {};
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
      this.sendTimeEntryDetails(this.currentEntry);
    }, {immediate: true});
  }

  /**
   * Sends entries log update on change
   * @private
   */
  _subscribeEntriesLog() {
    this._timeEntriesLog.subscribe(() => {
      this.transmitter.sendMessage({
        type: MESSAGE_TYPE.ENTRIES_LOG_UPDATE,
        data: this.entriesLogIds.slice(1),
      });
    }, {immediate: true});
  }

  /**
   * Returns a list of entries log items ids except current one
   * @return {number[]}
   */
  get entriesLogIds() {
    return Object.keys(this.timeEntriesLog)
        .map((id) => parseInt(id, 10))
        .sort((a, b) => b-a);
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
    await this._fetchRecentTimeEntriesLog();
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
    this.transmitter.onMessage(MESSAGE_TYPE.STOP_TIME_ENTRY, async ({stop, id}) => {
      await this.stopTimeEntry(id, stop);
    });

    this.transmitter.onMessage(MESSAGE_TYPE.REQUEST_ENTRY_DETAILS, ({entryId}) => {
      this.sendTimeEntryDetails(this.timeEntriesLog[entryId]);
    });

    this.transmitter.onMessage(MESSAGE_TYPE.START_TIME_ENTRY, async ({start, id}) => {
      await this.startTimeEntry(id, start);
    });

    this.transmitter.onMessage(MESSAGE_TYPE.DELETE_TIME_ENTRY, async ({id}) => {
      await this.deleteTimeEntry(id);
    });
  }

  /**
   * Deletes current entry
   * @param {number} id
   * @return {Promise<void>}
   */
  async deleteTimeEntry(id) {
    if (id === this.currentEntryId) {
      await this._api.deleteTimeEntry(this.currentEntry);
    }
    await this._launchEntriesRefreshing();
  }

  /**
   *  Starts time entry based on log item found by its id
   * @param {number} id
   * @param {number} start
   * @return {Promise<void>}
   */
  async startTimeEntry(id, start) {
    this.currentEntry = await this._api.createTimeEntry({
      wid: this.user && this.user.default_workspace_id,
      ...this.timeEntriesLog[id],
      stop: null,
      start: new Date(start).toISOString(),
    });
  }

  /**
   * Sends time entry in defined format
   * @param {Object} timeEntry
   */
  sendTimeEntryDetails(timeEntry) {
    const isCurrentEntry = {cur: !timeEntry || timeEntry.id === this.currentEntryId};
    const data = Object.assign(isCurrentEntry, timeEntryDetails(timeEntry, this.projects[timeEntry && timeEntry.pid]));
    this.transmitter.sendMessage({
      type: MESSAGE_TYPE.TIME_ENTRY_DETAILS,
      data,
    });
  }

  /**
   * Stops entry with provided id
   * @param {number} id
   * @param {number} stop
   * @return {Promise<void>}
   */
  async stopTimeEntry(id, stop) {
    if (id === this.currentEntryId) {
      this.currentEntry = await this._api.updateTimeEntry({
        ...this.currentEntry,
        stop: new Date(stop).toISOString(),
      });
    }
  }

  /**
   * Returns and id of current time entry
   * @return {null|number}
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
    await this.assignProjects();
  }

  /**
   * Assigns users' projects info
   * @return {Promise<void>}
   */
  async assignProjects() {
    this.projects = turnIntoIndexedList(await this._api.fetchProjects(), 'id');
  }

  /**
   * Returns the most recent time entry either currently active or last active one.
   * @return {Promise<Object|null|undefined>}
   * @private
   */
  async _fetchMostRecentEntry() {
    return await this._api.fetchCurrentEntry() || this.lastEntry;
  }

  /**
   * Returns a last time entry from the log
   * @return {*}
   */
  get lastEntry() {
    const lastEntryId = this.entriesLogIds[0];
    return this.timeEntriesLog[lastEntryId];
  }

  /**
   *  Returns a list of recent time entries
   * @return {Promise<*[]>}
   */
  async _fetchRecentTimeEntriesLog() {
    this.timeEntriesLog = turnIntoIndexedList(await this._api.fetchTimeEntries(), 'id');
  }
}

export {
  Tracking,
  timeEntryDetails,
  ENTRIES_REFRESH_INTERVAL,
  NO_PROJECT_COLOR,
  NO_PROJECT_INFO,
  OPTIMAL_TEXTS_LENGTH,
};
