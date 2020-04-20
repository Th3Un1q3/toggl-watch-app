import document from 'document';

const LOADER_STATE = Object.freeze({
  ENABLED: 'enabled',
  DISABLED: 'disabled',
});

const enableLoader = () => {
  document.getElementById('loader').state = LOADER_STATE.ENABLED;
};

const disableLoader = () => {
  document.getElementById('loader').state = LOADER_STATE.DISABLED;
};

const showConfigurationRequired = () => {
  disableLoader();
  document.getElementById('auth_token_info').style.display = 'inline';
};

export {showConfigurationRequired, enableLoader, LOADER_STATE};
