import {MESSAGE_TYPE} from '../common/constants/message-types';
import {settingsStorage} from 'settings';
import {API_TOKEN_SETTINGS_STORAGE_KEY} from '../common/constants/settings';
import {COMPANION_QUEUE_SIZE, Transmitter} from '../common/transmitter';
import {API} from './api';
import {Tracking} from './tracking';
import {debug} from '../common/debug';

const appModules = {};

const apiToken = () => {
  return settingsStorage.getItem(API_TOKEN_SETTINGS_STORAGE_KEY);
};

const sendConfigurationStatus = () => {
  appModules.transmitter.sendMessage({
    type: MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE,
    data: {
      configured: !!apiToken()},
  });
};

const bootstrap = () => {
  const transmitter = new Transmitter({queueSize: COMPANION_QUEUE_SIZE});
  const api = new API({token: apiToken()});

  api.handleUnauthorizedWith(() => {
    settingsStorage.removeItem(API_TOKEN_SETTINGS_STORAGE_KEY);
    sendConfigurationStatus();
  });

  const tracker = new Tracking({api, transmitter});


  Object.assign(appModules, {transmitter, api, tracker});

  sendConfigurationStatus();

  settingsStorage.onchange = (event) => {
    debug('settings changed', event);
    sendConfigurationStatus();
    api.updateToken(apiToken());
    tracker.initialize();
  };
};

export {bootstrap};
