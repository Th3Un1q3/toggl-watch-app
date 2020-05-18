import {MESSAGE_TYPE} from '../common/message-types';
import {hideConfigurationRequired, showConfigurationRequired} from './ui';
import {debug} from '../common/debug';

const initIncomingMessagesHandler = ({transmitter, tracking}) => {
  transmitter.onMessage(MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE, ({configured}) => {
    if (!configured) {
      return showConfigurationRequired();
    }

    hideConfigurationRequired();
  });

  transmitter.onMessage(MESSAGE_TYPE.CURRENT_ENTRY_UPDATE, (entry) => {
    debug('received', entry);
    tracking.currentEntryUpdated(entry);
  });
};

export {
  initIncomingMessagesHandler,
};
