
import {
  disableCurrentEntryDeletion,
  enableCurrentEntryDeletion,
  enableCurrentEntryPausing, enableCurrentEntryResuming,
  showCurrentEntry,
} from './ui';

const TIMER_UPDATE_INTERVAL_MS = 1000;

/**
 * This module is responsible for tracking and works in pair with companion's tracking module.
 */
class Tracking {
  /**
   * Definition of initial values and properties
   */
  constructor() {
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
