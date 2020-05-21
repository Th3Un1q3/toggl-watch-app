const {COMPANION_QUEUE_SIZE, DEVICE_QUEUE_SIZE} = jest.requireActual('../transmitter');

const sendMessage = jest.fn();

let handlers = {};

const onMessage = jest.fn().mockImplementation((type, handler) => {
  handlers[type] = handler;
});

const {Transmitter} = jest.genMockFromModule('../transmitter');

Transmitter.mockImplementation(() => {
  handlers = {};

  return {
    sendMessage,
    onMessage,
  };
});

Transmitter.instanceSendMessage = sendMessage;
Transmitter.emitMessageReceived = (type, payload) => handlers[type](payload);

export {
  Transmitter,
  COMPANION_QUEUE_SIZE,
  DEVICE_QUEUE_SIZE,
};
