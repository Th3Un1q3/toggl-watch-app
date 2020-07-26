import document from 'document';
import {UserInterface, BUTTON_IMAGE, LOADER_STATE, TIMER_UPDATE_INTERVAL_MS} from './ui';
import {Subject} from '../common/observable';
import faker from 'faker';
import {timeEntryDetails} from '../companion/tracking';
import {timeEntryBody} from '../utils/factories/time-entries';
import {projectBody} from '../utils/factories/projects';

describe('UI module', () => {
  let configurationRequired;
  let loader;
  let project;
  let description;
  let hours;
  let minutes;
  let seconds;
  let deleteButton;
  let stopResumeButton;
  let uiInstance;
  let tracking;
  let entriesLog;

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

  const assertDeleteButtonIsDisabled = () => {
    it('should hide screen delete button', () => {
      expect(deleteButton)
          .not
          .toBeVisible();
      expect(deleteButton.enabled)
          .toBeFalsy();
    });

    it('should de-attach physical button click handler', () => {
      deleteButton.click();

      expect(tracking.deleteCurrentEntry)
          .not
          .toHaveBeenCalled();
    });
  };

  const initializeAllElements = () => {
    configurationRequired = document.getElementById('configuration-instruction');
    loader = document.getElementById('loader');
    project = document.getElementById('current-entry-project');
    description = document.getElementById('current-entry-description');
    hours = document.getElementById('current-entry-timer-hours');
    minutes = document.getElementById('current-entry-timer-minutes');
    seconds = document.getElementById('current-entry-timer-seconds');
    deleteButton = document.getElementById('delete-button');
    stopResumeButton = document.getElementById('stop-resume-button');
    entriesLog = document.getElementById('time-entries-list-container');
  };

  const initializeUI = () => {
    tracking = {
      currentEntrySubject: new Subject(),
      deleteCurrentEntry: jest.fn(),
      resumeCurrentEntry: jest.fn(),
      stopCurrentEntry: jest.fn(),
    };
    document._reset();
    uiInstance = new UserInterface({tracking});
  };

  beforeEach(() => {
    initializeUI();
    initializeAllElements();
    jest.spyOn(Date, 'now').mockReturnValue(new Date().getTime());
  });

  afterEach(() => {
    uiInstance.teardown();
  });

  describe('on initialize', () => {
    assertLoaderEnabled();

    it('should subscribe on tracking.currentEntrySubject', () => {
      expect(tracking.currentEntrySubject.hasSubscriptions).toBeTruthy();
    });

    describe('if loading takes longer than 10 seconds', () => {
      it.todo('should show check your connection message');
    });
  });

  describe('.onCurrentEntryChange', () => {
    const start = 1589285423000;
    const timeSectionActiveClass = 'current-entry__time--active';

    beforeEach(() => {
      tracking.currentEntry = timeEntryDetails(timeEntryBody(), projectBody({id: 11}));

      tracking.currentEntrySubject.next(tracking.currentEntry);

      initializeAllElements();
    });

    it('should change fill color of project', () => {
      expect(project.style.fill).toEqual(tracking.currentEntry.color);
    });

    it('should set project name', () => {
      expect(project.text).toEqual(tracking.currentEntry.projectName);
    });

    it('should set entry description', () => {
      expect(description.text).toEqual(tracking.currentEntry.desc);
    });

    assertLoaderDisabled();

    describe('when there is no entry', () => {
      beforeEach(() => {
        tracking.currentEntrySubject.next(tracking.currentEntry);
        tracking.currentEntry = null;
        tracking.currentEntrySubject.next(null);
      });
      assertLoaderEnabled();
      assertDeleteButtonIsDisabled();

      it('should disable stop-resume', () => {
        expect(stopResumeButton.enabled).toBeFalsy();
        stopResumeButton.click();

        expect(tracking.resumeCurrentEntry).not.toHaveBeenCalled();
        expect(tracking.stopCurrentEntry).not.toHaveBeenCalled();
      });
    });

    describe('when entry is not playing', () => {
      beforeEach(() => {
        tracking.currentEntry = timeEntryDetails(timeEntryBody({isPlaying: false}), projectBody({id: 11}));

        tracking.currentEntrySubject.next(tracking.currentEntry);
      });

      it('should stop timer refresh and set it to --:--:--', () => {
        expect(hours.text).toEqual('--');
        expect(minutes.text).toEqual('--');
        expect(seconds.text).toEqual('--');
      });

      it('should set active class to seconds', () => {
        expect(hours.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
        expect(minutes.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
        expect(seconds.class).toEqual(expect.stringContaining(timeSectionActiveClass));
      });


      assertDeleteButtonIsDisabled();


      it('should set button image to play', () => {
        expect(stopResumeButton).toBeVisible();
        expect(stopResumeButton.getElementById('combo-button-icon-press').href).toEqual(
            BUTTON_IMAGE.PLAY_PRESS,
        );
        expect(stopResumeButton.getElementById('combo-button-icon').href).toEqual(
            BUTTON_IMAGE.PLAY,
        );
      });

      it('should call tracking.resumeCurrentEntry when screen or physical button clicked', () => {
        expect(tracking.resumeCurrentEntry).not.toHaveBeenCalled();

        stopResumeButton.click();

        expect(tracking.resumeCurrentEntry).toHaveBeenCalledTimes(1);
      });
    });

    describe('when entry is playing', () => {
      beforeEach(() => {
        tracking.currentEntry = timeEntryDetails(timeEntryBody({
          start: new Date(start).toISOString(),
        }), projectBody({id: 11}));
        tracking.currentEntrySubject.next(tracking.currentEntry);
        initializeAllElements();
      });

      describe('timer', () => {
        beforeEach(() => {
          Date.now.mockReturnValue(start);
          tracking.currentEntrySubject.next(tracking.currentEntry);
        });

        it('should refresh timer', () => {
          expect(hours.text).toEqual('00');
          expect(minutes.text).toEqual('00');
          expect(seconds.text).toEqual('00');

          const extraSecondsInMS = 9.2 * 1000;
          Date.now.mockReturnValue(start + extraSecondsInMS);

          jest.advanceTimersByTime(TIMER_UPDATE_INTERVAL_MS);

          expect(hours.text).toEqual('00');
          expect(minutes.text).toEqual('00');
          expect(seconds.text).toEqual('09');
        });
      });

      describe('timer values', () => {
        describe('when difference has minutes', () => {
          beforeEach(() => {
            const extraSecondsInMS = 9.2 * 1000;
            const extraMinutesInMS = 15 * 1000 * 60;

            Date.now.mockReturnValue(start + extraSecondsInMS + extraMinutesInMS);

            tracking.currentEntrySubject.next();
          });

          it('should set corresponding timer section texts 00:15:09', () => {
            expect(hours.text).toEqual('00');
            expect(minutes.text).toEqual('15');
            expect(seconds.text).toEqual('09');
          });

          it('should add active class to minutes', () => {
            expect(hours.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
            expect(minutes.class).toEqual(expect.stringContaining(timeSectionActiveClass));
            expect(seconds.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
          });
        });

        describe('when difference has hours ', () => {
          beforeEach(() => {
            const extraSecondsInMS = 9.2 * 1000;
            const extraMinutesInMS = 15 * 60 * 1000;
            const extraHoursInMS = 2 * 60 * 60 * 1000;

            Date.now.mockReturnValue(start + extraSecondsInMS + extraMinutesInMS + extraHoursInMS);

            tracking.currentEntrySubject.next();
          });

          it('should set corresponding timer section texts 02:15:09', () => {
            expect(hours.text).toEqual('02');
            expect(minutes.text).toEqual('15');
            expect(seconds.text).toEqual('09');
          });

          it('should mark hours section as active', () => {
            expect(hours.class).toEqual(expect.stringContaining(timeSectionActiveClass));
            expect(minutes.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
            expect(seconds.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
          });
        });

        describe('when difference has seconds', () => {
          beforeEach(() => {
            const extraSecondsInMS = 9.2 * 1000;

            Date.now.mockReturnValue(start + extraSecondsInMS);

            tracking.currentEntrySubject.next(tracking.currentEntry);
          });

          it('should set corresponding timer section texts 00:00:09', () => {
            expect(hours.text).toEqual('00');
            expect(minutes.text).toEqual('00');
            expect(seconds.text).toEqual('09');
          });

          it('should mark seconds section as active', () => {
            expect(hours.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
            expect(minutes.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
            expect(seconds.class).toEqual(expect.stringContaining(timeSectionActiveClass));
          });
        });
      });

      describe('delete button', () => {
        it('should show and enable current entry delete button', () => {
          expect(deleteButton).toBeVisible();
          expect(deleteButton.enabled).toBeTruthy();
        });

        it('should call tracking.deleteCurrentEntry when screen or physical button button clicked', () => {
          deleteButton.click();

          expect(tracking.deleteCurrentEntry).toHaveBeenCalledTimes(1);
        });
      });

      describe('stop-resume button', () => {
        it('should make stopResume button in stop mode', () => {
          expect(stopResumeButton).toBeVisible();
          expect(stopResumeButton.getElementById('combo-button-icon-press').href).toEqual(
              BUTTON_IMAGE.PAUSE_PRESS,
          );
          expect(stopResumeButton.getElementById('combo-button-icon').href).toEqual(
              BUTTON_IMAGE.PAUSE,
          );
        });

        it('should call tracking.stopCurrentEntry when screen or physical button clicked', () => {
          expect(tracking.stopCurrentEntry).not.toHaveBeenCalled();

          stopResumeButton.click();

          expect(tracking.stopCurrentEntry).toHaveBeenCalledTimes(1);
        });

        it('should not call tracking.resumeCurrentEntry on click', () => {
          stopResumeButton.click();

          expect(tracking.resumeCurrentEntry).not.toHaveBeenCalled();
        });
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
