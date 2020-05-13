import {peerSocket, _resetPeerSocket} from 'messaging';
import {initIncomingMessagesHandler} from './transmission';
import {hideConfigurationRequired, showConfigurationRequired, showCurrentEntry} from './ui';
import {MESSAGE_TYPE} from '../common/message-types';
import {timeEntryBody} from '../utils/factories/time-entries';

jest.mock('./ui');

describe('Transmission module', () => {
  beforeEach(() => {
    _resetPeerSocket();
  });

  describe('initIncomingMessagesHandler', () => {
    beforeEach(() => {
      initIncomingMessagesHandler();
    });

    describe('when message with type CURRENT_ENTRY_UPDATE received', () => {
      const triggerMessageReceived = (data) => {
        peerSocket._onmessageHandler({
          data: {
            type: MESSAGE_TYPE.CURRENT_ENTRY_UPDATE,
            data,
          },
        });
      };

      it('should call ui.showCurrentEntry with entry params', () => {
        const currentEntry = timeEntryBody();

        expect(showCurrentEntry).not.toHaveBeenCalled();

        triggerMessageReceived(currentEntry);

        expect(showCurrentEntry).toHaveBeenCalledTimes(1);
        expect(showCurrentEntry).toHaveBeenCalledWith(currentEntry);
      });
    });

    describe('when message with type API_TOKEN_STATUS_UPDATE received', () => {
      const triggerMessageReceived = (data) => {
        peerSocket._onmessageHandler({
          data: {
            type: MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE,
            data,
          },
        });
      };

      it('should not call any ui changes unless message received', () => {
        expect(showConfigurationRequired).not.toHaveBeenCalled();
        expect(hideConfigurationRequired).not.toHaveBeenCalled();
      });


      describe('and data contains {configured: false}', () => {
        it('should call ui.showConfigurationRequired', () => {
          triggerMessageReceived({configured: false});

          expect(showConfigurationRequired).toHaveBeenCalled();
        });
      });

      describe('and data contains {configured: true}', () => {
        beforeEach(() => {
          triggerMessageReceived({configured: true});
        });

        it('should call ui.hideConfigurationRequired', () => {
          expect(hideConfigurationRequired).toHaveBeenCalledTimes(1);
        });

        it('should not call ui.showConfigurationRequired', () => {
          expect(showConfigurationRequired).not.toHaveBeenCalled();
        });
      });
    });
  });
});
