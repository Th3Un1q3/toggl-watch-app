import document from 'document';

const LOADER_STATE = Object.freeze({
  ENABLED: 'enabled',
  DISABLED: 'disabled',
});

const _el = (id) => {
  return document.getElementById(id);
};

const enableLoader = () => {
  _el('loader').state = LOADER_STATE.ENABLED;
};

const disableLoader = () => {
  _el('loader').state = LOADER_STATE.DISABLED;
};

const showConfigurationRequired = () => {
  disableLoader();
  _el('auth_token_info').style.display = 'inline';
  _el('current_entry').style.display = 'none';
};

const hideConfigurationRequired = () => {
  _el('auth_token_info').style.display = 'none';
};

const showCurrentEntry = (entry = {}) => {
  disableLoader();
  _el('current_entry').style.display = 'inline';
  _el('current_entry_project').style.fill = entry.color;
  _el('current_entry_project').text = entry.projectName;
  _el('current_entry_description').text = entry.desc;
  _el('current_entry_time_hours').text = '--';
  _el('current_entry_time_minutes').text = '--';
  _el('current_entry_time_seconds').text = '--';
};

export {showConfigurationRequired, hideConfigurationRequired, enableLoader, showCurrentEntry, LOADER_STATE};
