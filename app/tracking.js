
import {
  disableCurrentEntryDeletion,
  enableCurrentEntryDeletion,
  enableCurrentEntryPausing, enableCurrentEntryResuming, enableLoader,
  showCurrentEntry,
} from './ui';
import {MESSAGE_TYPE} from '../common/message-types';

const TIMER_UPDATE_INTERVAL_MS = 1000;

/**
 * This module is responsible for tracking and works in pair with companion's tracking module.
 */
class Tracking {
  /**
   * Definition of initial values and properties
   */
  constructor({transmitter}) {
    this._transmitter = transmitter;
    this.currentEntry = null;
    this._currentEntryRefresh = null;
  }

  /**
   * Makes everything required when current entry is updated
   * @param {Object} entry
   */
  currentEntryUpdated(entry) {
    this.currentEntry = entry;
    showCurrentEntry(this.currentEntry);
    this._configureCurrentEntryControls();

    this._launchCurrentEntryRefresh();
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
    clearInterval(this._currentEntryRefresh);
    enableLoader();
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

  /**
   * Configures required ui controls depend of what
   * is applicable to the current time entry
   * @private
   */
  _configureCurrentEntryControls() {
    if (this.currentEntry.start) {
      enableCurrentEntryPausing(this);
      enableCurrentEntryDeletion(this);
      return;
    }

    enableCurrentEntryResuming(this);
    disableCurrentEntryDeletion(this);
  }

  /**
   * Starts screen refresh process
   * @private
   */
  _launchCurrentEntryRefresh() {
    if (this._currentEntryRefresh) {
      clearInterval(this._currentEntryRefresh);
    }

    this._currentEntryRefresh = setInterval(() => {
      showCurrentEntry(this.currentEntry);
    }, TIMER_UPDATE_INTERVAL_MS);
  }
}

export {
  Tracking,
  TIMER_UPDATE_INTERVAL_MS,
};
