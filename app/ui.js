import {_el} from './ui/document-helper';
import document from 'document';
import {debug} from '../common/debug';
import {lazyDecorator} from '../common/utils/lazy-decorator';
import {EntriesLogTile} from './ui/entries-log-tile';
import {formatTimeSection} from './ui/date-utils';

const LOADER_STATE = Object.freeze({
  Enabled: 'enabled',
  Disabled: 'disabled',
});

const BUTTON_IMAGE = Object.freeze({
  PlayPress: 'images/fitbit_icons/btn_combo_play_press_p.png',
  Play: 'images/fitbit_icons/btn_combo_play_p.png',
  Pause: 'images/fitbit_icons/btn_combo_pause_p.png',
  PausePress: 'images/fitbit_icons/btn_combo_pause_press_p.png',
});

const EID = Object.freeze({
  ViewSwitch: 'view-switch',
  DeleteButton: 'delete-button',
  CurrentEntryProject: 'current-entry-project',
  CurrentEntryDescription: 'current-entry-description',
  StopResumeButton: 'stop-resume-button',
  TimerHours: 'current-entry-timer-hours',
  TimerMinutes: 'current-entry-timer-minutes',
  TimerSeconds: 'current-entry-timer-seconds',
  ConfigurationInstruction: 'configuration-instruction',
  LoaderContainer: 'loader-container',
  Loader: 'loader',
  LogContainer: 'time-entries-list-container',
});

const VIEW = Object.freeze({
  EntriesLog: 0,
  CurrentEntry: 1,
});

const LIST_TILE = Object.freeze({
  TimeEntry: 'time-entry',
});

const TIMER_SECTION_ACTIVE_CLASS = 'current-entry__time--active';

const TIMER_UPDATE_INTERVAL_MS = 1000;

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
    this._entriesLogChangeSubscription = null;
    this.tracking = tracking;
    lazyDecorator(this, 'deleteButton', () => _el(EID.DeleteButton));
    lazyDecorator(this, 'currentEntryProject', () => _el(EID.CurrentEntryProject));
    lazyDecorator(this, 'stopResumeButton', () => _el(EID.StopResumeButton));
    lazyDecorator(this, 'currentEntryDescription', () => _el(EID.CurrentEntryDescription));
    lazyDecorator(this, 'timerHours', () => _el(EID.TimerHours));
    lazyDecorator(this, 'timerMinutes', () => _el(EID.TimerMinutes));
    lazyDecorator(this, 'timerSeconds', () => _el(EID.TimerSeconds));
    lazyDecorator(this, 'loaderContainer', () => _el(EID.LoaderContainer));
    this.initialize();
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
    return !!this.currentEntry && this.currentEntry.isPlaying;
  }

  /**
   * Launches initial ui state
   */
  initialize() {
    this.enableLoader();
    this.attachEntriesLogBehavior();
    this._subscribeOnCurrentEntryChange();
    this._subscribeOnLogChange();
    this.setView(VIEW.CurrentEntry);
  }

  /**
   * deactivates delete current entry button
   */
  disableDeleteButton() {
    this.deleteButton.hide();
    this.deleteButton.native.enabled = false;
  }

  /**
   * Disables loader
   */
  disableLoader() {
    this.loaderContainer.hide();
  }

  /**
   * Updates current entry info
   */
  displayCurrentEntryInfo() {
    this.currentEntryProject.fill = this.currentEntry.color;
    this.currentEntryProject.text = this.currentEntry.projectName;
    this.currentEntryDescription.text = this.currentEntry.desc;

    this.updateCurrentEntryTimer();
  }

  /**
   * Allows to resume last entry
   */
  enableCurrentEntryResuming() {
    this._enableStopResumeButton();
    this.stopResumeButton.onactivate = () => {
      this.tracking.resumeCurrentEntry();
    };
    this.stopResumeButton.native.getElementById('combo-button-icon').href = BUTTON_IMAGE.Play;
    this.stopResumeButton.native.getElementById('combo-button-icon-press').href = BUTTON_IMAGE.PlayPress;
  }

  /**
   * Allows to pause current entry
   * and configures corresponding icon
   */
  enableCurrentEntryPausing() {
    this._enableStopResumeButton();
    this.stopResumeButton.onactivate = () => {
      this.tracking.stopCurrentEntry();
    };
    this.stopResumeButton.native.getElementById('combo-button-icon').href = BUTTON_IMAGE.Pause;
    this.stopResumeButton.native.getElementById('combo-button-icon-press').href = BUTTON_IMAGE.PausePress;
  }

  /**
   * Configures delete button to delete current entry
   */
  enableDeleteButton() {
    this.deleteButton.onactivate = () => this.tracking.deleteCurrentEntry();
    this.deleteButton.show();
    this.deleteButton.native.enabled = true;
  }

  /**
   * Enables loader
   */
  enableLoader() {
    this.loaderContainer.show();
    _el(EID.Loader).state = LOADER_STATE.Enabled;
  }


  /**
   * Hide how application can be configured message
   */
  hideConfigurationRequired() {
    _el(EID.ConfigurationInstruction).hide();
  }

  /**
   * Handles current entry change
   */
  onCurrentEntryChange() {
    this._stopCurrentEntryRefresh();
    this._disableCurrentEntryControls();

    if (!this.currentEntry) {
      this.enableLoader();

      return;
    }

    this.disableLoader();
    this.displayCurrentEntryInfo();

    if (!this.isCurrentEntryPlaying) {
      this.enableCurrentEntryResuming();

      return;
    }

    this.enableDeleteButton();
    this.enableCurrentEntryPausing();
    this._startTimerRefresh();
  }

  /**
   * Set's timer value according to current entry
   */
  updateCurrentEntryTimer() {
    if (!this.isCurrentEntryPlaying) {
      this.timerHours.text = '--';
      this.timerMinutes.text = '--';
      this.timerSeconds.text = '--';
      this._highlightActiveTimerSection();
      return;
    }

    const difference = new Date(Date.now() - this.currentEntry.start);

    this._highlightActiveTimerSection(difference);

    this.timerHours.text = formatTimeSection(difference.getUTCHours());
    this.timerMinutes.text = formatTimeSection(difference.getUTCMinutes());
    this.timerSeconds.text = formatTimeSection(difference.getUTCSeconds());
  }

  /**
   * Shows how application can be configured
   */
  showConfigurationRequired() {
    this.disableLoader();
    _el(EID.ConfigurationInstruction).show();
  }

  /**
   * Removes all subscriptions
   */
  teardown() {
    this._stopCurrentEntryRefresh();
    this._unsubscribeCurrentEntryChange();
    this._unsubscribeEntriesLogChange();
  }

  /**
   * Disables resuming of current entry
   * @private
   */
  _disableStopResumeButton() {
    this.stopResumeButton.hide();
    this.stopResumeButton.native.enabled = false;
  }

  /**
   * Disables controls of current entry
   * @private
   */
  _disableCurrentEntryControls() {
    this._disableStopResumeButton();
    this.disableDeleteButton();
  }

  /**
   * Enables stop resume button
   * @private
   */
  _enableStopResumeButton() {
    this.stopResumeButton.show();
    this.stopResumeButton.native.enabled = true;
  }

  /**
   * Stops current entry refresh screen
   * @private
   */
  _stopCurrentEntryRefresh() {
    if (this._currentEntryRefresh) {
      clearInterval(this._currentEntryRefresh);
    }
  }

  /**
   * Refreshes timer every second
   * @private
   */
  _startTimerRefresh() {
    this._currentEntryRefresh = setInterval(() => {
      this.updateCurrentEntryTimer();
    }, TIMER_UPDATE_INTERVAL_MS);
  }

  /**
   * Start track current entry change
   * @private
   */
  _subscribeOnCurrentEntryChange() {
    this._unsubscribeCurrentEntryChange();
    this._currentEntryChangeSubscription = this.tracking.currentEntrySubject.subscribe(() => {
      this.onCurrentEntryChange();
    });
  }

  /**
   * Start track entries log update
   * @private
   */
  _subscribeOnLogChange() {
    this._unsubscribeEntriesLogChange();
    this._entriesLogChangeSubscription = this.tracking.entriesLogContentsSubject.subscribe(() => {
      this._initiateEntriesLog();
    });
  }

  /**
   * Defines entries log behavior
   * @private
   */
  _initiateEntriesLog() {
    _el(EID.LogContainer).native.length = this.tracking.entriesLogContents.length + 1;
  }

  /**
   * Sets provided view
   * @param {number} view
   */
  setView(view) {
    _el(EID.ViewSwitch).value = view;
  }

  /**
   * Defines how entries list should behave
   * Attaches render processors.
   */
  attachEntriesLogBehavior() {
    this.tracking.entriesLogDetailsSubject.subscribe(() => {
      debug('entries details', this.tracking.entriesLogDetails.length);
      this.tracking.entriesLogDetails.filter(({info}) => !!info).forEach(({displayedIn, info}) => {
        const targetTileElement = document.getElementById(displayedIn);
        new EntriesLogTile(targetTileElement)
            .displayTimeEntryInfo(info);
      });
    });

    _el(EID.LogContainer).native.delegate = {
      getTileInfo: (position) => {
        const positionInEntriesLog = position - 1;
        const entryId = position ? {id: this.tracking.entriesLogContents[positionInEntriesLog]} : {};
        return {
          type: LIST_TILE.TimeEntry,
          isPlaceholder: !position,
          ...entryId,
        };
      },
      configureTile: (tileElement, {isPlaceholder, id}) => {
        const tile = new EntriesLogTile(tileElement);
        if (isPlaceholder) {
          return tile.enablePlaceholderMode();
        }

        tile
            .onClick(() => {
              this.tracking.startEntryFromLog(id);
              this.setView(VIEW.CurrentEntry);
            })
            .displayLoading();

        this.tracking.requestDetails({
          displayedIn: tileElement.id,
          entryId: id,
        });
      },
    };
  }

  /**
   * Stop track entries log
   * @private
   */
  _unsubscribeEntriesLogChange() {
    if (this._entriesLogChangeSubscription) {
      this._entriesLogChangeSubscription.unsubscribe();
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
   * Highlights either hours min or sec in timer
   * @param {Date} difference
   * @private
   */
  _highlightActiveTimerSection(difference = new Date(0)) {
    this.timerHours.removeClass(TIMER_SECTION_ACTIVE_CLASS);
    this.timerMinutes.removeClass(TIMER_SECTION_ACTIVE_CLASS);
    this.timerSeconds.removeClass(TIMER_SECTION_ACTIVE_CLASS);

    if (difference.getUTCHours()) {
      this.timerHours.addClass(TIMER_SECTION_ACTIVE_CLASS);
      return;
    }

    if (difference.getUTCMinutes()) {
      this.timerMinutes.addClass(TIMER_SECTION_ACTIVE_CLASS);
      return;
    }

    this.timerSeconds.addClass(TIMER_SECTION_ACTIVE_CLASS);
  }
}

export {
  UserInterface,
  LOADER_STATE,
  BUTTON_IMAGE,
  EID,
  LIST_TILE,
  VIEW,
  TIMER_UPDATE_INTERVAL_MS,
};
