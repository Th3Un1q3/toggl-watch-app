import {MESSAGE_TYPE} from '../common/message-types';
import {hideConfigurationRequired, showConfigurationRequired, showCurrentEntry} from './ui';
import {DEVICE_QUEUE_SIZE, Transmitter} from '../common/transmitter';

const initIncomingMessagesHandler = ({transmitter = new Transmitter({queueSize: DEVICE_QUEUE_SIZE})} = {}) => {
  transmitter.onMessage(MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE, ({configured}) => {
    if (!configured) {
      return showConfigurationRequired();
    }

    hideConfigurationRequired();
  });

  transmitter.onMessage(MESSAGE_TYPE.CURRENT_ENTRY_UPDATE, showCurrentEntry);
};

export {
  initIncomingMessagesHandler,
};
