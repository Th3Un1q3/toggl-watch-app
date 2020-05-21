import {peerSocket, _resetPeerSocket} from 'messaging';
import {initIncomingMessagesHandler} from './transmission';
import {hideConfigurationRequired, showConfigurationRequired} from './ui';
import {MESSAGE_TYPE} from '../common/message-types';
import {timeEntryBody} from '../utils/factories/time-entries';
import {Transmitter} from '../common/transmitter';
import {Tracking} from './tracking';

jest.mock('./ui');
jest.mock('./tracking');

describe('Transmission module', () => {
  let tracking;

  beforeEach(() => {
    _resetPeerSocket();
    tracking = new Tracking();
  });

  describe('initIncomingMessagesHandler', () => {
    beforeEach(() => {
      initIncomingMessagesHandler({transmitter: new Transmitter(), tracking});
    });

    describe('when message with type CURRENT_ENTRY_UPDATE received', () => {
      let currentEntry;

      const triggerMessageReceived = (data) => {
        peerSocket._onmessageHandler({
          data: {
            type: MESSAGE_TYPE.CURRENT_ENTRY_UPDATE,
            data,
          },
        });
      };

      beforeEach(() => {
        currentEntry = timeEntryBody();
      });

      it('should call tracking.currentEntryUpdated with entry params', () => {
        expect(tracking.currentEntryUpdated).not.toHaveBeenCalled();

        triggerMessageReceived(currentEntry);

        expect(tracking.currentEntryUpdated).toHaveBeenCalledTimes(1);
        expect(tracking.currentEntryUpdated).toHaveBeenLastCalledWith(currentEntry);
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
