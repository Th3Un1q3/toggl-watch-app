const {COMPANION_QUEUE_SIZE, DEVICE_QUEUE_SIZE} = jest.requireActual('../transmitter');

const sendMessage = jest.fn();

const {Transmitter} = jest.genMockFromModule('../transmitter');

Transmitter.mockReturnValue({
  sendMessage,
});

export {
  Transmitter,
  sendMessage,
  COMPANION_QUEUE_SIZE,
  DEVICE_QUEUE_SIZE,
};
