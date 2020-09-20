import {peerSocket, _resetPeerSocket} from 'messaging';
import {MESSAGE_TYPE} from './constants/message-types';
import {DEVICE_QUEUE_SIZE, SUSPENSION_BUFFER_BYTES, Transmitter} from './transmitter';
import {timeEntryBody} from '../utils/factories/time-entries';

describe('Transmitter', () => {
  let transmitter;

  beforeEach(() => {
    _resetPeerSocket();

    jest.spyOn(console, 'log').mockImplementation(() => {});
    transmitter = new Transmitter({queueSize: DEVICE_QUEUE_SIZE});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  it('should setup console log when messaging error is triggered', () => {
    const code = '236526';
    const message = 'message body';

    expect(console.log).not.toHaveBeenCalled();

    expect(peerSocket._onerrorHandler).toEqual(expect.any(Function));

    peerSocket._onerrorHandler({code, message});

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining(code));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining(message));
  });

  describe('.onMessage', () => {
    it('should not allow to subscribe without type', () => {
      expect(() => {
        transmitter.onMessage(undefined, () => {});
      }).toThrow();
    });

    it('should not allow to subscribe without handler', () => {
      expect(() => {
        transmitter.onMessage('MESS');
      }).toThrow();
    });

    it('should configure on message handler', () => {
      expect(peerSocket._onmessageHandler).toBeNull();

      transmitter.onMessage(MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE, () => {});

      expect(peerSocket._onmessageHandler).toEqual(expect.any(Function));
    });

    it('should not fail when type or data not defined', () => {
      expect.hasAssertions();

      transmitter.onMessage(MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE, () => {});


      expect(() => {
        peerSocket._onmessageHandler({});

        peerSocket._onmessageHandler({data: 666});
        peerSocket._onmessageHandler({data: {type: 666}});
      }).not.toThrow();
    });

    it('should only call handlers for corresponding type only', () => {
      const apiTokenHandler = jest.fn();
      const currentEntryHandler = jest.fn();
      const apiTokenUpdatePayload = {configured: true};
      const currentEntryPayload = timeEntryBody({});

      transmitter.onMessage(MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE, apiTokenHandler);
      transmitter.onMessage(MESSAGE_TYPE.TIME_ENTRY_DETAILS, currentEntryHandler);

      expect(apiTokenHandler).not.toHaveBeenCalled();

      peerSocket._onmessageHandler({data: {type: MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE, data: apiTokenUpdatePayload}});

      expect(apiTokenHandler).toHaveBeenCalledTimes(1);
      expect(apiTokenHandler).toHaveBeenCalledWith(apiTokenUpdatePayload);
      expect(currentEntryHandler).not.toHaveBeenCalled();

      peerSocket._onmessageHandler({data: {type: MESSAGE_TYPE.TIME_ENTRY_DETAILS, data: currentEntryPayload}});

      expect(apiTokenHandler).toHaveBeenCalledTimes(1);
      expect(currentEntryHandler).toHaveBeenCalledTimes(1);
      expect(currentEntryHandler).toHaveBeenCalledWith(currentEntryPayload);
    });

    it('should allow to subscribe on the same type more than once', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      transmitter.onMessage(MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE, handler1);
      transmitter.onMessage(MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE, handler2);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      peerSocket._onmessageHandler({data: {type: MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE}});

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('.sendMessage', () => {
    let messageBody;

    beforeEach(() => {
      messageBody = {
        type: MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE,
        data: {configured: false},
      };
    });

    it('should not send any message on initiation', () => {
      expect(peerSocket.send).not.toHaveBeenCalled();
    });

    describe('when connection is established', () => {
      beforeEach(() => {
        peerSocket._readyState = peerSocket.OPEN;
      });

      describe(`when buffer amount is less than ${SUSPENSION_BUFFER_BYTES} bytes`, () => {
        beforeEach(() => {
          peerSocket._bufferedAmount = SUSPENSION_BUFFER_BYTES - 1;
        });

        it('should send a message using messaging', () => {
          transmitter.sendMessage(messageBody);

          expect(peerSocket.send).toHaveBeenCalledTimes(1);
          expect(peerSocket.send).toHaveBeenCalledWith(messageBody);
        });
      });

      describe('when buffer amount is more than 1kb', () => {
        beforeEach(() => {
          peerSocket._bufferedAmount = 1024;
        });

        it('should not send a message', () => {
          transmitter.sendMessage(messageBody);

          expect(peerSocket.send).not.toHaveBeenCalled();
        });

        describe(`when buffer amount become less than ${SUSPENSION_BUFFER_BYTES} bytes`, () => {
          beforeEach(() => {
            transmitter.sendMessage(messageBody);

            peerSocket._bufferedAmount = SUSPENSION_BUFFER_BYTES - 1;
          });

          it('should perform sending', () => {
            expect(peerSocket._onbufferedamountdecreaseHandler)
                .toEqual(expect.any(Function));

            expect(peerSocket.send).not.toHaveBeenCalled();

            peerSocket._onbufferedamountdecreaseHandler();

            expect(peerSocket.send).toHaveBeenCalledWith(messageBody);

            peerSocket._onbufferedamountdecreaseHandler();

            expect(peerSocket.send).toHaveBeenCalledTimes(1);
          });
        });
      });
    });

    describe('when connection is closed', () => {
      beforeEach(() => {
        peerSocket._readyState = peerSocket.CLOSED;
      });

      it('should not send a message', () => {
        transmitter.sendMessage(messageBody);

        expect(peerSocket.send).not.toHaveBeenCalled();
      });

      describe('when more than queue messages send', () => {
        const nonInQueueCount = 5;

        beforeEach(() => {
          transmitter = new Transmitter();

          for (let queueNumber = 0; queueNumber < nonInQueueCount; queueNumber++) {
            transmitter.sendMessage({isLast: false});
          }

          for (let queueNumber = 0; queueNumber < DEVICE_QUEUE_SIZE; queueNumber++) {
            transmitter.sendMessage({isLast: true});
          }

          peerSocket._readyState = peerSocket.OPEN;
        });

        it('should only send last queued', () => {
          for (let queueNumber = 0; queueNumber < DEVICE_QUEUE_SIZE + nonInQueueCount; queueNumber++) {
            peerSocket._onbufferedamountdecreaseHandler();
          }

          expect(peerSocket.send).toHaveBeenCalledTimes(DEVICE_QUEUE_SIZE);

          expect(peerSocket.send.mock.calls.every(([message]) => message.isLast)).toBeTruthy();
        });
      });

      describe('when connection become open', () => {
        beforeEach(() => {
          transmitter.sendMessage(messageBody);

          peerSocket._readyState = peerSocket.OPEN;
        });

        it('should send a message', () => {
          expect(peerSocket._onopenHandler).toEqual(expect.any(Function));

          peerSocket._onopenHandler();
          expect(peerSocket.send).toHaveBeenCalledWith(messageBody);

          peerSocket._onopenHandler();
          expect(peerSocket.send).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
