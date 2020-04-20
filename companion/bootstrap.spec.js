import {peerSocket, _resetPeerSocket} from 'messaging';
import {settingsStorage, _resetSettings} from 'settings';
import {MESSAGE_TYPE} from '../common/message-types';
import {bootstrap} from './bootstrap';
import {API_TOKEN_SETTINGS_STORAGE_KEY} from '../common/constants';

describe('Companion app bootstrap', () => {
  beforeEach(() => {
    _resetPeerSocket();
    _resetSettings();
    bootstrap();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  it('should subscribe on settings change', () => {
    expect(settingsStorage._onchangeHandler).toEqual(expect.any(Function));
    peerSocket._readyState = peerSocket.OPEN;
    settingsStorage._onchangeHandler();
    expect(peerSocket.send).toHaveBeenCalledTimes(1);
    expect(peerSocket.send).toHaveBeenCalledWith({
      type: MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE,
      data: {configured: false},
    });
  });

  it('should setup console log when messaging error is triggered', () => {
    const code = '236526';
    const message = 'message body';

    expect(console.log).not.toHaveBeenCalled();

    bootstrap();

    expect(peerSocket._onerrorHandler).toEqual(expect.any(Function));

    peerSocket._onerrorHandler({code, message});

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining(code));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining(message));
  });

  describe('when api token is not defined', () => {
    it('should send message to show instructions on device', () => {
      expect(peerSocket.send).not.toHaveBeenCalled();

      peerSocket._readyState = peerSocket.CLOSED;

      expect(peerSocket._onopenHandler).toEqual(expect.any(Function));
      peerSocket._onopenHandler();

      expect(peerSocket.send).not.toHaveBeenCalled();

      peerSocket._readyState = peerSocket.OPEN;

      peerSocket._onopenHandler();

      expect(peerSocket.send).toHaveBeenCalledTimes(1);
      expect(peerSocket.send).toHaveBeenCalledWith({
        type: MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE,
        data: {configured: false},
      });
    });
  });

  describe('when api token defined', () => {
    beforeEach(() => {
      settingsStorage.setItem(API_TOKEN_SETTINGS_STORAGE_KEY, 'token');
    });

    it('send api token present', () => {
      peerSocket._readyState = peerSocket.OPEN;

      peerSocket._onopenHandler();

      expect(peerSocket.send).toHaveBeenCalledTimes(1);
      expect(peerSocket.send).toHaveBeenCalledWith({
        type: MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE,
        data: {configured: true},
      });
    });
  });
});
