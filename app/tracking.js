
import {showCurrentEntry} from './ui';

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
    this._currentEntryRefreshInterval = null;
  }

  /**
   * Makes everything required when current entry is updated
   * @param {Object} entry
   */
  currentEntryUpdated(entry) {
    this.currentEntry = entry;
    showCurrentEntry(this.currentEntry);

    if (this._currentEntryRefreshInterval) {
      clearInterval(this._currentEntryRefreshInterval);
    }

    this._currentEntryRefreshInterval = setInterval(() => {
      showCurrentEntry(this.currentEntry);
    }, TIMER_UPDATE_INTERVAL_MS);
  }
}

export {
  Tracking,
  TIMER_UPDATE_INTERVAL_MS,
};
