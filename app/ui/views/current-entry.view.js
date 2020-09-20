import {EID} from '../selectors';
import {formatTimeSection} from '../date-utils';
import {VIEW} from './index';
import {$do, $} from '../lib/ui-action';
import {enableLoader} from '../actions/enable-loader';
import {disableLoader} from '../actions/disable-loader';
import {disableButton} from '../actions/disable-button';
import {defineButtonAction} from '../actions/define-button-action';
import {setComboButtonIcons} from '../actions/set-combo-button-icons';
import {setText} from '../actions/set-text';
import {removeClass} from '../actions/remove-class';
import {addClass} from '../actions/add-class';
import {setFill} from '../actions/set-fill';
import {changeView} from '../actions/change-view';

const TIMER_SECTION_ACTIVE_CLASS = 'current-entry__time--active';
const TIMER_UPDATE_INTERVAL_MS = 1000;

const BUTTON_IMAGE = Object.freeze({
  PlayPress: './resources/images/fitbit_icons/btn_combo_play_press_p.png',
  Play: './resources/images/fitbit_icons/btn_combo_play_p.png',
  Pause: './resources/images/fitbit_icons/btn_combo_pause_p.png',
  PausePress: './resources/images/fitbit_icons/btn_combo_pause_press_p.png',
});

class CurrentEntry {
  constructor({entriesRepo, ui}) {
    this.ui = ui;
    this.entriesRepo = entriesRepo;
    this.startCurrentEntry = this.startCurrentEntry.bind(this);
    this.stopCurrentEntry = this.stopCurrentEntry.bind(this);
    this.deleteCurrentEntry = this.deleteCurrentEntry.bind(this);

    this._openEntriesLog = () => {
      if ($(EID.ViewSwitch).value === VIEW.EntriesLog) {
        this.ui.navigate(VIEW.EntriesLog);
      }
    };
  }

  mounted() {
    this.activateCurrentEntryTab();
    $(EID.ViewSwitch).addEventListener('select', this._openEntriesLog);
    this.renderCurrentEntry();
    this._subscribeOnCurrentEntryChange();
  }

  destroyed() {
    $(EID.ViewSwitch).removeEventListener('select', this._openEntriesLog);
    this._stopCurrentEntryRefresh();
    this._unsubscribeCurrentEntryChange();
  }

  /**
   * Returns current entry
   * @return {null|Object}
   */
  get currentEntry() {
    return this.entriesRepo.currentEntry;
  }

  /**
   * Returns true when current entry is playing
   * @return {boolean}
   */
  get isCurrentEntryPlaying() {
    return !!this.currentEntry && this.currentEntry.isPlaying;
  }

  activateCurrentEntryTab() {
    $do(EID.ViewSwitch, changeView, VIEW.CurrentEntry);
  }

  /**
   * Updates current entry info
   */
  displayCurrentEntryInfo() {
    $do(EID.CurrentEntryProject, setFill, this.currentEntry.color);
    $do(EID.CurrentEntryProject, setText, this.currentEntry.projectName);
    $do(EID.CurrentEntryDescription, setText, this.currentEntry.desc);
    this.updateCurrentEntryTimer();
  }

  startCurrentEntry() {
    this.entriesRepo.start({
      id: this.currentEntry.id,
      start: Date.now(),
    });
  }

  /**
   * Allows to resume last entry
   */
  enableCurrentEntryResuming() {
    $do(EID.StopResumeButton, defineButtonAction, this.startCurrentEntry);
    $do(EID.StopResumeButton, setComboButtonIcons, {
      normal: BUTTON_IMAGE.Play,
      press: BUTTON_IMAGE.PlayPress,
    });
  }

  /**
   * Allows to pause current entry
   * and configures corresponding icon
   */
  enableCurrentEntryPausing() {
    $do(EID.StopResumeButton, defineButtonAction, this.stopCurrentEntry);
    $do(EID.StopResumeButton, setComboButtonIcons, {
      normal: BUTTON_IMAGE.Pause,
      press: BUTTON_IMAGE.PausePress,
    });
  }


  stopCurrentEntry() {
    this.entriesRepo.stop({
      id: this.currentEntry.id,
      stop: Date.now(),
    });
  }

  /**
   * Configures delete button to delete current entry
   */
  enableDeleteButton() {
    $do(EID.DeleteButton, defineButtonAction, this.deleteCurrentEntry);
  }


  deleteCurrentEntry() {
    this.entriesRepo.delete({
      id: this.currentEntry.id,
    });
  }

  /**
   * Handles current entry change
   */
  renderCurrentEntry() {
    this._stopCurrentEntryRefresh();
    this._disableCurrentEntryControls();

    $do(EID.Loader, disableLoader);

    if (!this.currentEntry) {
      $do(EID.Loader, enableLoader);
      return;
    }

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
      $do(EID.TimerHours, setText, '--');
      $do(EID.TimerMinutes, setText, '--');
      $do(EID.TimerSeconds, setText, '--');
      this._highlightActiveTimerSection();
      return;
    }

    const difference = new Date(Date.now() - this.currentEntry.start);

    this._highlightActiveTimerSection(difference);

    $do(EID.TimerHours, setText, formatTimeSection(difference.getUTCHours()));
    $do(EID.TimerMinutes, setText, formatTimeSection(difference.getUTCMinutes()));
    $do(EID.TimerSeconds, setText, formatTimeSection(difference.getUTCSeconds()));
  }

  /**
   * Disables controls of current entry
   * @private
   */
  _disableCurrentEntryControls() {
    $do(EID.StopResumeButton, disableButton);
    $do(EID.DeleteButton, disableButton);
  }

  /**
   * Stops current entry refresh screen
   * @private
   */
  _stopCurrentEntryRefresh() {
    clearInterval(this._currentEntryRefresh);
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
    this._currentEntryChangeSubscription = this.entriesRepo.currentEntryUpdated.subscribe(() => {
      this.renderCurrentEntry();
    });
  }

  /**
   * Stops reaction on current entry change
   * @private
   */
  _unsubscribeCurrentEntryChange() {
    if (this._currentEntryChangeSubscription) {
      this._currentEntryChangeSubscription.unsubscribe();
      delete this._currentEntryChangeSubscription;
    }
  }

  /**
   * Highlights either hours min or sec in timer
   * @param {Date} difference
   * @private
   */
  _highlightActiveTimerSection(difference = new Date(0)) {
    $do(EID.TimerHours, removeClass, TIMER_SECTION_ACTIVE_CLASS);
    $do(EID.TimerMinutes, removeClass, TIMER_SECTION_ACTIVE_CLASS);
    $do(EID.TimerSeconds, removeClass, TIMER_SECTION_ACTIVE_CLASS);

    if (difference.getUTCHours()) {
      $do(EID.TimerHours, addClass, TIMER_SECTION_ACTIVE_CLASS);
      return;
    }

    if (difference.getUTCMinutes()) {
      $do(EID.TimerMinutes, addClass, TIMER_SECTION_ACTIVE_CLASS);
      return;
    }

    $do(EID.TimerSeconds, addClass, TIMER_SECTION_ACTIVE_CLASS);
  }
}

export {CurrentEntry, TIMER_UPDATE_INTERVAL_MS, TIMER_SECTION_ACTIVE_CLASS, BUTTON_IMAGE};
