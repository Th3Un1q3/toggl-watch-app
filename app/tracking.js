import {MESSAGE_TYPE} from '../common/message-types';
import {Subject} from '../common/observable';

/**
 * This module is responsible for tracking and works in pair with companion's tracking module.
 */
class Tracking {
  /**
   * Definition of initial values and properties
   * @param {Transmitter} messages transmitter instance
   */
  constructor({transmitter}) {
    this.currentEntrySubject = new Subject(null);
    this.entriesLogContentsSubject = new Subject([]);
    this._transmitter = transmitter;
    this._subscribeOnEntryReceived();
    this._subscribeOnLogUpdate();
  }

  /**
   * Updates current entry
   * @param {TimeEntryMessage|null} updatedEntry
   */
  set currentEntry(updatedEntry) {
    this.currentEntrySubject.next(updatedEntry);
  }

  /**
   * Returns current entry value
   * @return {TimeEntryMessage|null}
   */
  get currentEntry() {
    return this.currentEntrySubject.value;
  }

  /**
   * Updates contents of entries log
   * @param {number[]} logContents
   */
  set entriesLogContents(logContents) {
    this.entriesLogContentsSubject.next(logContents);
  }

  /**
   * Returns contents of entries log(a list of ids)
   * @return {number[]}
   */
  get entriesLogContents() {
    return this.entriesLogContentsSubject.value;
  }

  /**
   * Gives a command to delete current entry to companion app
   */
  deleteCurrentEntry() {
    this._transmitter.sendMessage({
      type: MESSAGE_TYPE.DELETE_TIME_ENTRY,
      data: {
        id: this.currentEntry.id,
      },
    });
    this.currentEntry = null;
  }

  /**
   * Requests time entries details
   * @param {number} entryId
   * @param {*} meta
   */
  requestDetails({entryId, ...meta}) {
    // TODO: not request if in details list
  }

  /**
   * Sends a command to resume current(last) entry
   */
  resumeCurrentEntry() {
    this._transmitter.sendMessage({
      type: MESSAGE_TYPE.START_TIME_ENTRY,
      data: {
        id: this.currentEntry.id,
        start: Date.now(),
      },
    });

    this.currentEntry = {...this.currentEntry, start: Date.now(), isPlaying: true};
  }

  /**
   * Sends a command to stop current entry
   */
  stopCurrentEntry() {
    this._transmitter.sendMessage({
      type: MESSAGE_TYPE.STOP_TIME_ENTRY,
      data: {
        id: this.currentEntry.id,
        stop: Date.now(),
      },
    });
    this.currentEntry = {...this.currentEntry, isPlaying: false};
  }

  /**
   * Emits log subject on update
   * @private
   */
  _subscribeOnLogUpdate() {
    this._transmitter.onMessage(MESSAGE_TYPE.ENTRIES_LOG_UPDATE, (logIds) => {
      this.entriesLogContents = logIds;
    });
  }

  /**
   * Reacts on entry update
   * @private
   */
  _subscribeOnEntryReceived() {
    this._transmitter.onMessage(MESSAGE_TYPE.TIME_ENTRY_DETAILS, (entry) => {
      if (entry.cur) {
        this.currentEntry = entry;
      }
    });
  }
}

export {
  Tracking,

};
