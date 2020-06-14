import document from 'document';
import {LOADER_STATE} from './ui';
import {UserInterface} from './new-ui';
import { Tracking } from './tracking';

jest.mock('./tracking');

describe('UI module', () => {
  let configurationRequired;
  let loader;
  let currentEntry;
  let project;
  let description;
  let hours;
  let minutes;
  let seconds;
  let deleteButton;
  let stopResumeButton;
  let uiInstance;
  let tracking;

  const assertLoaderEnabled = () => {
    it('should make loader state enabled and loader visible', () => {
      expect(loader).toBeVisible();
      expect(loader.state).toEqual(LOADER_STATE.ENABLED);
    });
  };

  const assertLoaderDisabled = () => {
    it('should make loader state enabled and loader visible', () => {
      expect(loader).not.toBeVisible();
    });
  };

  const initializeAllElements = () => {
    configurationRequired = document.getElementById('configuration-instruction');
    loader = document.getElementById('loader');
    currentEntry = document.getElementById('current-entry');
    project = document.getElementById('current-entry-project');
    description = document.getElementById('current-entry-description');
    hours = document.getElementById('current-entry-timer-hours');
    minutes = document.getElementById('current-entry-timer-minutes');
    seconds = document.getElementById('current-entry-timer-seconds');
    deleteButton = document.getElementById('delete-button');
    stopResumeButton = document.getElementById('stop-resume-button');
  };

  const initializeUI = () => {
    tracking = Tracking.lastInstance();
    document._reset();
    uiInstance = new UserInterface({tracking});
  };

  beforeEach(() => {
    initializeUI();
    initializeAllElements();
    jest.spyOn(Date, 'now').mockReturnValue(new Date().getTime());
  });

  describe('on initialize', () => {
    assertLoaderEnabled();

    it.todo('should subscribe on tracking.currentEntryChange');

    describe('if loading takes longer than 10 seconds', () => {
      it.todo('should show check your connection message');
    });
  });

  describe('.onCurrentEntryChange', () => {
    it.todo('should subscribe on tracking.currentEntryChange');

    it.todo('should set description, project name and color');

    it.todo('should disable loader');

    describe('when entry is not playing', () => {
      it.todo('should stop timer refresh and set it to --:--:--');
      it.todo('should disable delete button');
    });

    describe('when entry is playing', () => {
      describe('timer', () => {
        it.todo('should refresh timer');
      });

      describe('delete button', () => {
        it.todo('should be available');
        it.todo('should call tracking.deleteCurrentEntry on activate');
      });

      describe('stop-resume button', () => {
        it.todo('should make stopResume button in stop mode');
        it.todo('should call tracking.stopCurrentEntry on activate');
      });
    });
  });

  describe('.hideConfigurationRequired', () => {
    beforeEach(() => {
      uiInstance.showConfigurationRequired();
      uiInstance.hideConfigurationRequired();
    });

    it('should hide configuration required', () => {
      expect(configurationRequired).not.toBeVisible();
    });

    it.todo('should resume current time entry refresh');
  });

  describe('.configurationRequired', () => {
    beforeEach(() => {
      uiInstance.showConfigurationRequired();
    });

    assertLoaderDisabled();

    it('should show #configuration-instruction', () => {
      expect(configurationRequired).toBeVisible();
    });

    it.todo('should pause current time entry refresh');
  });
});
