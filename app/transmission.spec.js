import {peerSocket, _resetPeerSocket} from 'messaging';
import { initIncomingMessagesHandler, TIMER_UPDATE_INTERVAL_MS } from './transmission';
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

      it('should call ui.showCurrentEntry with entry params', () => {
        expect(showCurrentEntry).not.toHaveBeenCalled();

        triggerMessageReceived(currentEntry);

        expect(showCurrentEntry).toHaveBeenCalledTimes(1);
        expect(showCurrentEntry).toHaveBeenLastCalledWith(currentEntry);
      });

      it('should call show current entry every second since then', () => {
        triggerMessageReceived(currentEntry);
        jest.advanceTimersByTime(TIMER_UPDATE_INTERVAL_MS);

        expect(showCurrentEntry).toHaveBeenCalledTimes(2);
        expect(showCurrentEntry).toHaveBeenLastCalledWith(currentEntry);

        showCurrentEntry.mockClear();

        const newEntry = timeEntryBody();
        triggerMessageReceived(newEntry);

        jest.advanceTimersByTime(TIMER_UPDATE_INTERVAL_MS*5);
        expect(showCurrentEntry).toHaveBeenLastCalledWith(newEntry);
        expect(showCurrentEntry).not.toHaveBeenCalledWith(currentEntry);
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
