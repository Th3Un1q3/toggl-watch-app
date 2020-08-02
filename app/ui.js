import {_el, ElementWrapper} from './ui/document-helper';
import {gettext} from 'i18n';

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

const LIST_TILE = Object.freeze({
  TimeEntry: 'time-entry',
});

const TIME_ENTRY_HIDDEN_TILE_CLASS = 'item-wrapper--hidden';
const TIME_ENTRY_BILLABLE_CLASS = 'item__billing--billable';
const TIMER_SECTION_ACTIVE_CLASS = 'current-entry__time--active';

const formatTimeSection = (value) => {
  return value > 9 ? `${value}` : `0${value}`;
};

const TIMER_UPDATE_INTERVAL_MS = 1000;

/**
 * Allows to interact with a time entries log tile.
 */
class EntriesLogTile {
  /**
   * Defines a tile element
   * @param {HTMLElement|Document} tile
   */
  constructor(tile) {
    this._tileElement = tile;
    this.tile = new ElementWrapper(this._tileElement);

    this.billing = new ElementWrapper(this._tileElement.getElementById('billable'));
    this.project = new ElementWrapper(this._tileElement.getElementById('project'));
    this.duration = new ElementWrapper(this._tileElement.getElementById('duration'));
    this.description = new ElementWrapper(this._tileElement.getElementById('description'));
    this.wrapper = new ElementWrapper(this._tileElement.getElementById('wrapper'));
  }

  /**
   * Turns the tile into placeholder mode.
   * The mode is used for the first tile which is not time entry.
   */
  enablePlaceholderMode() {
    this.wrapper.addClass(TIME_ENTRY_HIDDEN_TILE_CLASS);
  }

  /**
   * Turns the tile into loading mode, to make its loading smoother
   */
  displayLoading() {
    this.description.text = gettext('log_description_loading');
    this.project.text = gettext('log_project_loading');
    this.duration.text = '--:--';
    this.billing.removeClass(TIME_ENTRY_BILLABLE_CLASS);
    this.wrapper.removeClass(TIME_ENTRY_HIDDEN_TILE_CLASS);
  }
}

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
  }

  /**
   * deactivates delete current entry button
   */
  disableDeleteButton() {
    _el(EID.DeleteButton).hide();
    _el(EID.DeleteButton).native.enabled = false;
  }

  /**
   * Disables loader
   */
  disableLoader() {
    _el('loader-container').hide();
  }

  /**
   * Updates current entry info
   */
  displayCurrentEntryInfo() {
    _el(EID.CurrentEntryProject).style.fill = this.currentEntry.color;
    _el(EID.CurrentEntryProject).text = this.currentEntry.projectName;
    _el(EID.CurrentEntryDescription).text = this.currentEntry.desc;

    this.updateCurrentEntryTimer();
  }

  /**
   * Allows to resume last entry
   */
  enableCurrentEntryResuming() {
    this._enableStopResumeButton();
    _el(EID.StopResumeButton).onactivate = () => {
      this.tracking.resumeCurrentEntry();
    };
    _el(EID.StopResumeButton).native.getElementById('combo-button-icon').href = BUTTON_IMAGE.Play;
    _el(EID.StopResumeButton).native.getElementById('combo-button-icon-press').href = BUTTON_IMAGE.PlayPress;
  }

  /**
   * Allows to pause current entry
   * and configures corresponding icon
   */
  enableCurrentEntryPausing() {
    this._enableStopResumeButton();
    _el(EID.StopResumeButton).onactivate = () => {
      this.tracking.stopCurrentEntry();
    };
    _el(EID.StopResumeButton).native.getElementById('combo-button-icon').href = BUTTON_IMAGE.Pause;
    _el(EID.StopResumeButton).native.getElementById('combo-button-icon-press').href = BUTTON_IMAGE.PausePress;
  }

  /**
   * Configures delete button to delete current entry
   */
  enableDeleteButton() {
    _el(EID.DeleteButton).onactivate = () => this.tracking.deleteCurrentEntry();
    _el(EID.DeleteButton).show();
    _el(EID.DeleteButton).native.enabled = true;
  }

  /**
   * Enables loader
   */
  enableLoader() {
    _el(EID.LoaderContainer).show();
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
      _el(EID.TimerHours).text = '--';
      _el(EID.TimerMinutes).text = '--';
      _el(EID.TimerSeconds).text = '--';
      this._highlightActiveTimerSection();
      return;
    }

    const difference = new Date(Date.now() - this.currentEntry.start);

    this._highlightActiveTimerSection(difference);

    _el(EID.TimerHours).text = formatTimeSection(difference.getUTCHours());
    _el(EID.TimerMinutes).text = formatTimeSection(difference.getUTCMinutes());
    _el(EID.TimerSeconds).text = formatTimeSection(difference.getUTCSeconds());
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
    _el(EID.StopResumeButton).hide();
    _el(EID.StopResumeButton).native.enabled = false;
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
    _el(EID.StopResumeButton).show();
    _el(EID.StopResumeButton).native.enabled = true;
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
   * Defines how entries list should behave
   * Attaches render processors.
   */
  attachEntriesLogBehavior() {
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

        tile.displayLoading();

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
    _el(EID.TimerHours).removeClass(TIMER_SECTION_ACTIVE_CLASS);
    _el(EID.TimerMinutes).removeClass(TIMER_SECTION_ACTIVE_CLASS);
    _el(EID.TimerSeconds).removeClass(TIMER_SECTION_ACTIVE_CLASS);

    if (difference.getUTCHours()) {
      _el(EID.TimerHours).addClass(TIMER_SECTION_ACTIVE_CLASS);
      return;
    }

    if (difference.getUTCMinutes()) {
      _el(EID.TimerMinutes).addClass(TIMER_SECTION_ACTIVE_CLASS);
      return;
    }

    _el(EID.TimerSeconds).addClass(TIMER_SECTION_ACTIVE_CLASS);
  }
}

export {
  UserInterface,
  LOADER_STATE,
  BUTTON_IMAGE,
  EID,
  LIST_TILE,
  TIME_ENTRY_BILLABLE_CLASS,
  TIME_ENTRY_HIDDEN_TILE_CLASS,
  TIMER_UPDATE_INTERVAL_MS,
};
