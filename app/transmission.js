import {peerSocket} from 'messaging';
import {MESSAGE_TYPE} from '../common/message-types';
import {showConfigurationRequired} from './ui';

const handleNotConfiguredMessage = ({type, data: status}) => {
  if (type !== MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE || !status) {
    return;
  }

  if (!status.configured) {
    return showConfigurationRequired();
  }
};

const initIncomingMessagesHandler = () => {
  peerSocket.onmessage = ({data: message}) => {
    if (!message || !message.type) {
      return;
    }

    handleNotConfiguredMessage(message);
  };
};

export {
  initIncomingMessagesHandler,
};
