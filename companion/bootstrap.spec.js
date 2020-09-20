import _ from 'lodash';
import {settingsStorage, _resetSettings} from 'settings';
import {MESSAGE_TYPE} from '../common/constants/message-types';
import {bootstrap} from './bootstrap';
import {API_TOKEN_SETTINGS_STORAGE_KEY} from '../common/constants/settings';
import {Transmitter, COMPANION_QUEUE_SIZE} from '../common/transmitter';
import {API} from './api';
import {Tracking} from './tracking';

jest.mock('../common/transmitter');
jest.mock('./api');
jest.mock('./tracking');

describe('Companion app bootstrap', () => {
  const trackingInstance = {
    initialize: jest.fn(),
  };

  const apiInstance = () => _.last(API.mock.instances);

  beforeEach(() => {
    _resetSettings();

    Tracking.mockReturnValue(trackingInstance);
  });

  describe('when api not authenticated', () => {
    beforeEach(() => {
      settingsStorage.setItem(API_TOKEN_SETTINGS_STORAGE_KEY, 'token');

      bootstrap();
    });

    it('should clear api token in settings', () => {
      expect(settingsStorage.getItem(API_TOKEN_SETTINGS_STORAGE_KEY)).toEqual('token');

      expect(apiInstance().handleUnauthorizedWith).toHaveBeenCalledWith(expect.any(Function));

      const [handler] = _.last(apiInstance().handleUnauthorizedWith.mock.calls);

      handler();

      expect(settingsStorage.getItem(API_TOKEN_SETTINGS_STORAGE_KEY)).not.toBeDefined();
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith({
        type: MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE,
        data: {configured: false},
      });
    });
  });

  it('should initiate api', () => {
    expect(API).not.toHaveBeenCalled();

    bootstrap();

    expect(API).toHaveBeenCalledTimes(1);
  });

  it('should create transmitter instance with correct queue size', () => {
    expect(Transmitter).not.toHaveBeenCalled();

    bootstrap();

    expect(Transmitter).toHaveBeenCalledTimes(1);
    expect(Transmitter).toHaveBeenCalledWith({queueSize: COMPANION_QUEUE_SIZE});
  });

  it('should create tracking instance with api passed', () => {
    expect(Tracking).not.toHaveBeenCalled();

    bootstrap();

    expect(Tracking).toHaveBeenCalledTimes(1);
    expect(Tracking).toHaveBeenCalledWith({api: apiInstance(), transmitter: new Transmitter()});
  });

  describe('on settings change', () => {
    beforeEach(() => {
      bootstrap();

      settingsStorage.setItem(API_TOKEN_SETTINGS_STORAGE_KEY, 'token');

      Transmitter.instanceSendMessage.mockClear();
    });

    it('should subscribe on updates', () => {
      expect(settingsStorage._onchangeHandler).toEqual(expect.any(Function));
    });

    it('should update token in api', () => {
      expect(apiInstance().updateToken).not.toHaveBeenCalled();

      settingsStorage._onchangeHandler();

      expect(apiInstance().updateToken).toHaveBeenCalledWith('token');
    });

    it('should call initialize on tracking instance', () => {
      expect(trackingInstance.initialize).not.toHaveBeenCalled();

      settingsStorage._onchangeHandler();

      expect(trackingInstance.initialize).toHaveBeenCalledTimes(1);
    });

    it('should send updates of api token statuses', () => {
      expect(Transmitter.instanceSendMessage).not.toHaveBeenCalled();

      settingsStorage._onchangeHandler();

      expect(Transmitter.instanceSendMessage).toHaveBeenCalledTimes(1);
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith({
        type: MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE,
        data: {configured: true},
      });
    });
  });

  describe('when api token is not defined', () => {
    it('should send message to show instructions on device', () => {
      expect(Transmitter.instanceSendMessage).not.toHaveBeenCalled();

      bootstrap();

      expect(Transmitter.instanceSendMessage).toHaveBeenCalledTimes(1);
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith({
        type: MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE,
        data: {configured: false},
      });
    });
  });

  describe('when api token defined', () => {
    beforeEach(() => {
      settingsStorage.setItem(API_TOKEN_SETTINGS_STORAGE_KEY, 'token');

      bootstrap();
    });

    it('should create api instance with api token', () => {
      expect(API).toHaveBeenCalledTimes(1);
      expect(API).toHaveBeenCalledWith({token: 'token'});
    });

    it('send api token present', () => {
      expect(Transmitter.instanceSendMessage).toHaveBeenCalledTimes(1);
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith({
        type: MESSAGE_TYPE.API_TOKEN_STATUS_UPDATE,
        data: {configured: true},
      });
    });
  });
});
