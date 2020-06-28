import {_el} from './ui/document-helper';
import {BUTTON_IMAGE, LOADER_STATE, showCurrentEntry} from './ui';
import {TIMER_UPDATE_INTERVAL_MS} from './tracking';

const TIMER_SECTION_ACTIVE_CLASS = 'current-entry__time--active';

const formatTimeSection = (value) => {
  return value > 9 ? `${value}` : `0${value}`;
};

// TODO: reorder methods

/**
 * User interface module
 */
class UserInterface {
  /**
   * Constructor function
   * @param {Tracking} tracking
   */
  constructor({tracking}) {
    this._currentEntryChangeSubscription = null;
    this.tracking = tracking;
    this.initialize();
  }

  /**
   * Launches initial ui state
   */
  initialize() {
    this.enableLoader();
    this._subscribeOnCurrentEntryChange();
  }

  /**
   * Start track current entry change
   * @private
   */
  _subscribeOnCurrentEntryChange() {
    this._unsubscribeCurrentEntryChange();
    this._currentEntryChangeSubscription = this.tracking.currentEntryChange.subscribe(() => {
      this.onCurrentEntryChange();
    });
  }

  /**
   * Handles current entry change
   */
  onCurrentEntryChange() {
    this.disableLoader();
    this._stopCurrentEntryRefresh();
    this.updateCurrentEntry();
    if (this.isCurrentEntryPlaying) {
      this.enableDeleteButton();
      this.enableCurrentEntryPausing();
      this._currentEntryRefresh = setInterval(() => {
        this.updateCurrentEntryTimer();
      }, TIMER_UPDATE_INTERVAL_MS);
      return;
    }

    this.disableDeleteButton();
    this.enableCurrentEntryResuming();
  }

  /**
   * Configures delete button to delete current entry
   */
  enableDeleteButton() {
    // TODO: make sure it nullifies current entry in place
    _el('delete-button').onactivate = () => this.tracking.deleteCurrentEntry();
    _el('delete-button').show();
    _el('delete-button').native.enabled = true;
  }

  /**
   * Allows to resume last entry
   */
  enableCurrentEntryResuming() {
    _el('stop-resume-button').onactivate = () => {
      this.tracking.resumeCurrentEntry();
    };
    _el('stop-resume-button').native.getElementById('combo-button-icon').href = BUTTON_IMAGE.PLAY;
    _el('stop-resume-button').native.getElementById('combo-button-icon-press').href = BUTTON_IMAGE.PLAY_PRESS;
  }

  /**
   * Allows to pause current entry
   * and configures corresponding icon
   */
  enableCurrentEntryPausing() {
    _el('stop-resume-button').onactivate = () => {
      this.tracking.stopCurrentEntry(); // TODO: make sure it updates entry in place
    };
    _el('stop-resume-button').native.getElementById('combo-button-icon').href = BUTTON_IMAGE.PAUSE;
    _el('stop-resume-button').native.getElementById('combo-button-icon-press').href = BUTTON_IMAGE.PAUSE_PRESS;
  }

  /**
   * Stops current entry refresh screen
   * @private
   */
  _stopCurrentEntryRefresh() { // TODO: stop refresh when screen was left and resume when it was activated
    if (this._currentEntryRefresh) {
      clearInterval(this._currentEntryRefresh);
    }
  }

  /**
   * Stops reaction on current entry change
   * @private
   */
  _unsubscribeCurrentEntryChange() {
    if (this._currentEntryChangeSubscription) {
      this._currentEntryChangeSubscription.unsubscribe();
    }
  }

  /**
   * Returns current entry
   * @return {null|Object}
   */
  get currentEntry() {
    return this.tracking.currentEntry;
  }

  /**
   * Returns true when current entry is playing
   * @return {boolean}
   */
  get isCurrentEntryPlaying() {
    return !!this.currentEntry && !!this.currentEntry.start;
  }

  /**
   * Updates current entry info
   */
  updateCurrentEntry() {
    _el('current-entry-project').style.fill = this.currentEntry.color;
    _el('current-entry-project').text = this.currentEntry.projectName;
    _el('current-entry-description').text = this.currentEntry.desc;

    this.updateCurrentEntryTimer();
  }

  /**
   * Set's timer value according to current entry
   */
  updateCurrentEntryTimer() {
    if (!this.isCurrentEntryPlaying) {
      _el('current-entry-timer-hours').text = '--';
      _el('current-entry-timer-minutes').text = '--';
      _el('current-entry-timer-seconds').text = '--';
      this._highlightActiveTimerSection();
      return;
    }

    const difference = new Date(Date.now() - this.currentEntry.start);

    this._highlightActiveTimerSection(difference);

    _el('current-entry-timer-hours').text = formatTimeSection(difference.getUTCHours());
    _el('current-entry-timer-minutes').text = formatTimeSection(difference.getUTCMinutes());
    _el('current-entry-timer-seconds').text = formatTimeSection(difference.getUTCSeconds());
  }

  /**
   * Highlights either hours min or sec in timer
   * @param {Date} difference
   * @private
   */
  _highlightActiveTimerSection(difference = new Date(0)) {
    _el('current-entry-timer-hours').removeClass(TIMER_SECTION_ACTIVE_CLASS);
    _el('current-entry-timer-minutes').removeClass(TIMER_SECTION_ACTIVE_CLASS);
    _el('current-entry-timer-seconds').removeClass(TIMER_SECTION_ACTIVE_CLASS);

    if (difference.getUTCHours()) {
      _el('current-entry-timer-hours').addClass(TIMER_SECTION_ACTIVE_CLASS);
      return;
    }

    if (difference.getUTCMinutes()) {
      _el('current-entry-timer-minutes').addClass(TIMER_SECTION_ACTIVE_CLASS);
      return;
    }

    _el('current-entry-timer-seconds').addClass(TIMER_SECTION_ACTIVE_CLASS);
  }

  /**
   * deactivates delete current entry button
   */
  disableDeleteButton() {
    _el('delete-button').hide();
    _el('delete-button').native.enabled = false;
  }

  /**
   * Removes all subscriptions
   */
  teardown() {
    this._stopCurrentEntryRefresh();
    this._unsubscribeCurrentEntryChange();
  }

  /**
   * Enables loader
   */
  enableLoader() {
    _el('loader-container').show();
    _el('loader').state = LOADER_STATE.ENABLED;
  }

  /**
   * Disables loader
   */
  disableLoader() {
    _el('loader-container').hide();
  }

  /**
   * Shows how application can be configured
   */
  showConfigurationRequired() {
    this.disableLoader();
    _el('configuration-instruction').show();
  }

  /**
   * Hide how application can be configured message
   */
  hideConfigurationRequired() {
    _el('configuration-instruction').hide();
  }
}

export {
  UserInterface,
};
