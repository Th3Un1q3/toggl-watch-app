import {peerSocket} from 'messaging';
import {MESSAGE_TYPE} from '../common/message-types';
import {settingsStorage} from 'settings';
import {API_TOKEN_SETTINGS_STORAGE_KEY} from '../common/constants';

const sendConnectionStatus = () => {
  if (peerSocket.readyState === peerSocket.OPEN) {
    peerSocket.send({
      type: MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE,
      data: {
        configured: !!settingsStorage.getItem(API_TOKEN_SETTINGS_STORAGE_KEY)},
    });
  }
};

const bootstrap = () => {
  settingsStorage.onchange = () => {
    sendConnectionStatus();
  };

  peerSocket.onopen = () => {
    sendConnectionStatus();
  };

  peerSocket.onerror = (error) => {
    console.log('Connection error: ' + error.code + ' - ' + error.message);
  };
};

export {bootstrap};
