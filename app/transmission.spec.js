import {peerSocket, _resetPeerSocket} from 'messaging';
import {initIncomingMessagesHandler} from './transmission';
import {showConfigurationRequired} from './ui';
import {MESSAGE_TYPE} from '../common/message-types';

jest.mock('./ui');

describe('Transmission module', () => {
  beforeEach(() => {
    _resetPeerSocket();
  });

  describe('initIncomingMessagesHandler', () => {
    it('should configure on message handler', () => {
      expect(peerSocket._onmessageHandler).toBeNull();

      initIncomingMessagesHandler();

      expect(peerSocket._onmessageHandler).toEqual(expect.any(Function));
    });

    it('should not fail when type or data not defined', () => {
      expect.hasAssertions();
      initIncomingMessagesHandler();


      expect(() => {
        peerSocket._onmessageHandler({});

        peerSocket._onmessageHandler({data: 666});
        peerSocket._onmessageHandler({data: {type: 666}});
      }).not.toThrow();
    });

    describe('when message with type CURRENT_ENTRY_UPDATE received', () => {
      it.todo('should call ui.showCurrentEntry with entry params');
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


      beforeEach(() => {
        initIncomingMessagesHandler();
      });

      describe('and data contains {configured: false}', () => {
        it('should call ui.showConfigurationRequired', () => {
          expect(showConfigurationRequired).not.toHaveBeenCalled();

          triggerMessageReceived({configured: false});

          expect(showConfigurationRequired).toHaveBeenCalled();
        });
      });

      describe('and data contains {configured: true}', () => {
        it('should not call ui.showConfigurationRequired', () => {
          expect(showConfigurationRequired).not.toHaveBeenCalled();

          triggerMessageReceived({configured: true});

          expect(showConfigurationRequired).not.toHaveBeenCalled();
        });
      });
    });
  });
});
