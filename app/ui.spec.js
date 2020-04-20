import document from 'document';
import {enableLoader, LOADER_STATE, showConfigurationRequired} from './ui';

describe('User Interface module', () => {
  beforeEach(() => {
    document._reset();
  });

  describe('enableLoader', () => {
    it('should make loader state enabled', () => {
      enableLoader();
      const {state} = document.getElementById('loader');
      expect(state).toEqual(LOADER_STATE.ENABLED);
    });
  });

  describe('showConfigurationRequired', () => {
    it('should show #auth_token_info', () => {
      const infoMessage = document.getElementById('auth_token_info');
      expect(infoMessage.style.display).toEqual('none');
      showConfigurationRequired();
      expect(infoMessage.style.display).toEqual('inline');
    });

    it('should disable #loader', () => {
      showConfigurationRequired();
      const {state} = document.getElementById('loader');
      expect(state).toEqual(LOADER_STATE.DISABLED);
    });
  });
});
