import {_el} from './ui/document-helper';

const LOADER_STATE = Object.freeze({
  ENABLED: 'enabled',
  DISABLED: 'disabled',
});

const BUTTON_IMAGE = Object.freeze({
  PLAY_PRESS: 'images/fitbit_icons/btn_combo_play_press_p.png',
  PLAY: 'images/fitbit_icons/btn_combo_play_p.png',
  PAUSE: 'images/fitbit_icons/btn_combo_pause_p.png',
  PAUSE_PRESS: 'images/fitbit_icons/btn_combo_pause_press_p.png',
});

// TODO: make app a module and invert dependency to tracking

const TIMER_SECTION_ACTIVE_CLASS = 'current-entry__time--active';

const _formatTimeSection = (value) => {
  return value > 9 ? `${value}` : `0${value}`;
};

const enableLoader = () => {
  // TODO: make always active with background
  _el('loader').state = LOADER_STATE.ENABLED;
  _el('current-entry').hide();
};

const disableLoader = () => {
  _el('loader').state = LOADER_STATE.DISABLED;
};

const showConfigurationRequired = () => {
  disableLoader();
  _el('configuration-instruction').show();
  _el('current-entry').hide();
};

const hideConfigurationRequired = () => {
  _el('configuration-instruction').hide();
};

const _assignActiveClass = (difference = new Date(0)) => {
  _el('current-entry-timer-hours').removeClass(TIMER_SECTION_ACTIVE_CLASS);
  _el('current-entry-timer-minutes').removeClass(TIMER_SECTION_ACTIVE_CLASS);
  _el('current-entry-timer-seconds').removeClass(TIMER_SECTION_ACTIVE_CLASS);

  if (difference.getUTCHours()) {
    return _el('current-entry-timer-hours').addClass(TIMER_SECTION_ACTIVE_CLASS);
  }

  if (difference.getUTCMinutes()) {
    return _el('current-entry-timer-minutes').addClass(TIMER_SECTION_ACTIVE_CLASS);
  }

  _el('current-entry-timer-seconds').addClass(TIMER_SECTION_ACTIVE_CLASS);
};

const enableCurrentEntryDeletion = (tracking) => {
  _el('delete-button').onactivate = () => tracking.deleteCurrentEntry();
  _el('delete-button').show();
  _el('delete-button').native.enabled = true;
};

const enableCurrentEntryPausing = (tracking) => {
  _el('delete-button').native.enabled = true;
  _el('stop-resume-button').onactivate = () => {
    tracking.stopCurrentEntry();
    _el('delete-button').native.enabled = false;
  };
  _el('stop-resume-button').native.getElementById('combo-button-icon').href = BUTTON_IMAGE.PAUSE;
  _el('stop-resume-button').native.getElementById('combo-button-icon-press').href = BUTTON_IMAGE.PAUSE_PRESS;
};

const enableCurrentEntryResuming = (tracking) => {
  _el('delete-button').native.enabled = true;
  _el('stop-resume-button').onactivate = () => {
    tracking.resumeCurrentEntry();
    _el('delete-button').native.enabled = false;
  };
  _el('stop-resume-button').native.getElementById('combo-button-icon').href = BUTTON_IMAGE.PLAY;
  _el('stop-resume-button').native.getElementById('combo-button-icon-press').href = BUTTON_IMAGE.PLAY_PRESS;
};

const disableCurrentEntryDeletion = () => {
  _el('delete-button').hide();
  _el('delete-button').native.enabled = false;
};

const showCurrentEntry = (entry = {}) => {
  disableLoader();
  _el('current-entry').show();
  _el('current-entry-project').style.fill = entry.color;
  _el('current-entry-project').text = entry.projectName;
  _el('current-entry-description').text = entry.desc;

  if (!entry.start) {
    _el('current-entry-timer-hours').text = '--';
    _el('current-entry-timer-minutes').text = '--';
    _el('current-entry-timer-seconds').text = '--';
    _el('current-entry-timer-seconds').addClass(TIMER_SECTION_ACTIVE_CLASS);
    _assignActiveClass();
    return;
  }

  const difference = new Date(Date.now() - entry.start);

  _assignActiveClass(difference);

  _el('current-entry-timer-hours').text = _formatTimeSection(difference.getUTCHours());
  _el('current-entry-timer-minutes').text = _formatTimeSection(difference.getUTCMinutes());
  _el('current-entry-timer-seconds').text = _formatTimeSection(difference.getUTCSeconds());
};

export {
  showConfigurationRequired,
  hideConfigurationRequired,
  enableLoader,
  showCurrentEntry,
  enableCurrentEntryPausing,
  enableCurrentEntryDeletion,
  enableCurrentEntryResuming,
  disableCurrentEntryDeletion,
  LOADER_STATE,
  BUTTON_IMAGE,
};
