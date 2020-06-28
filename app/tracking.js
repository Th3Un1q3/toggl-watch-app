import { MESSAGE_TYPE } from '../common/message-types';
import { Subject } from '../common/observable';

/**
 * This module is responsible for tracking and works in pair with companion's tracking module.
 */
class Tracking {
  /**
   * Definition of initial values and properties
   */
  constructor({transmitter}) {
    this.currentEntryChange = new Subject();
    this._transmitter = transmitter;
    this.currentEntry = null;
  }

  /**
   * Makes everything required when current entry is updated
   * @param {Object} entry
   */
  currentEntryUpdated(entry) {
    this.currentEntry = entry;
    this.currentEntryChange.next(entry);
  }

  /**
   * Gives a command to delete current entry to companion app
   */
  deleteCurrentEntry() {
    this._transmitter.sendMessage({
      type: MESSAGE_TYPE.DELETE_CURRENT_ENTRY,
      data: {
        id: this.currentEntry.id,
      },
    });
    this.currentEntryUpdated(null);
  }

  /**
   * Sends a command to resume current(last) entry
   */
  resumeCurrentEntry() {
    this._transmitter.sendMessage({
      type: MESSAGE_TYPE.RESUME_LAST_ENTRY,
      data: {
        id: this.currentEntry.id,
        start: Date.now(),
      },
    });
    this.currentEntryUpdated({...this.currentEntry, start: Date.now()});
  }

  /**
   * Sends a command to stop current entry
   */
  stopCurrentEntry() {
    this._transmitter.sendMessage({
      type: MESSAGE_TYPE.STOP_CURRENT_ENTRY,
      data: {
        id: this.currentEntry.id,
        stop: Date.now(),
      },
    });
    this.currentEntryUpdated({...this.currentEntry, start: undefined});
  }
}

export {
  Tracking,

};
