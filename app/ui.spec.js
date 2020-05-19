import faker from 'faker';
import document from 'document';
import {
  BUTTON_IMAGE,
  disableCurrentEntryDeletion,
  enableCurrentEntryDeletion, enableCurrentEntryPausing, enableCurrentEntryResuming,
  enableLoader,
  hideConfigurationRequired,
  LOADER_STATE,
  showConfigurationRequired, showCurrentEntry,
} from './ui';
import {Tracking} from './tracking';

jest.mock('./tracking');

describe('User Interface module', () => {
  let configurationRequired;
  let loader;
  let currentEntry;
  let project;
  let description;
  let hours;
  let minutes;
  let seconds;
  let deleteButton;
  let tracking;
  let stopResumeButton;

  beforeEach(() => {
    document._reset();
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
    tracking = new Tracking();
    jest.spyOn(Date, 'now').mockReturnValue(new Date().getTime());
  });

  afterEach(() => {
    if (Date.now.mock) {
      Date.now.mockRestore();
    }
  });

  test('ui elements present and have correct defaults', () => {
    expect(loader).toBeTruthy();
    expect(configurationRequired).toBeTruthy();
    expect(currentEntry).toBeTruthy();
    expect(project).toBeTruthy();
    expect(description).toBeTruthy();
    expect(hours).toBeTruthy();
    expect(minutes).toBeTruthy();
    expect(seconds).toBeTruthy();
    expect(deleteButton).toBeTruthy();
    expect(stopResumeButton).toBeTruthy();


    expect(stopResumeButton).toBeVisible();
    expect(deleteButton).not.toBeVisible();
    expect(configurationRequired).not.toBeVisible();
    expect(currentEntry).not.toBeVisible();
  });

  describe('showCurrentEntry', () => {
    beforeEach(() => {
      enableLoader();
    });

    describe('when there is entry', () => {
      let currentEntryBody;
      const start = 1589285423000;

      beforeEach(() => {
        currentEntryBody = {
          id: faker.random.number(),
          desc: faker.lorem.sentence(),
          billable: true,
          color: '#a0a0a0',
          projectName: faker.hacker.adjective(),
        };

        showCurrentEntry(currentEntryBody);
      });

      it('should disable loader', () => {
        expect(loader.state).toEqual(LOADER_STATE.DISABLED);
      });

      it('should make #current-entry visible', () => {
        expect(currentEntry.style.display).toEqual('inline');
      });

      it('should change fill color of project', () => {
        expect(project.style.fill).toEqual(currentEntryBody.color);
      });

      it('should set project name', () => {
        expect(project.text).toEqual(currentEntryBody.projectName);
      });

      it('should set entry description', () => {
        expect(description.text).toEqual(currentEntryBody.desc);
      });

      describe('timer', () => {
        const timeSectionActiveClass = 'current-entry__time--active';

        it('should set time to empty values', () => {
          expect(hours.text).toEqual('--');
          expect(minutes.text).toEqual('--');
          expect(seconds.text).toEqual('--');
        });

        it('should set active class to seconds', () => {
          expect(hours.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
          expect(minutes.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
          expect(seconds.class).toEqual(expect.stringContaining(timeSectionActiveClass));
        });

        describe('when entry is not stopped', () => {
          beforeEach(() => {
            const extraSecondsInMS = 9.2 * 1000;
            const extraMinutesInMS = 15 * 1000 * 60;

            Date.now.mockReturnValue(start + extraSecondsInMS + extraMinutesInMS);

            currentEntryBody = {
              ...currentEntryBody,
              start,
            };

            showCurrentEntry(currentEntryBody);
          });

          it('should set corresponding timer section texts', () => {
            expect(hours.text).toEqual('00');
            expect(minutes.text).toEqual('15');
            expect(seconds.text).toEqual('09');
          });

          it('should add active class to minutes', () => {
            expect(hours.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
            expect(minutes.class).toEqual(expect.stringContaining(timeSectionActiveClass));
            expect(seconds.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
          });

          describe('when difference has hours', () => {
            beforeEach(() => {
              const extraSecondsInMS = 9.2 * 1000;
              const extraMinutesInMS = 15 * 60 * 1000;
              const extraHoursInMS = 2 * 60 * 60 * 1000;

              Date.now.mockReturnValue(start + extraSecondsInMS + extraMinutesInMS + extraHoursInMS);

              showCurrentEntry(currentEntryBody);
            });

            it('should mark hours section as active', () => {
              expect(hours.class).toEqual(expect.stringContaining(timeSectionActiveClass));
              expect(minutes.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
              expect(seconds.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
            });
          });

          describe('when difference has only seconds', () => {
            beforeEach(() => {
              const extraSecondsInMS = 9.2 * 1000;

              Date.now.mockReturnValue(start + extraSecondsInMS);

              showCurrentEntry(currentEntryBody);
            });

            it('should mark seconds section as active', () => {
              expect(hours.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
              expect(minutes.class).toEqual(expect.not.stringContaining(timeSectionActiveClass));
              expect(seconds.class).toEqual(expect.stringContaining(timeSectionActiveClass));
            });
          });
        });
      });
    });
  });

  describe('enableCurrentEntryDeletion', () => {
    beforeEach(() => {
      enableCurrentEntryDeletion(tracking);
    });

    it('should show and enable current entry delete button', () => {
      expect(deleteButton).toBeVisible();
      expect(deleteButton.enabled).toBeTruthy();
    });

    it('should call tracking.deleteCurrentEntry when screen or physical button button clicked', () => {
      deleteButton.click();

      expect(tracking.deleteCurrentEntry).toHaveBeenCalledTimes(1);
    });
  });

  describe('disableCurrentEntryDeletion', () => {
    beforeEach(() => {
      enableCurrentEntryDeletion(tracking);
      disableCurrentEntryDeletion();
    });

    it('should hide screen delete button', () => {
      expect(deleteButton).not.toBeVisible();
      expect(deleteButton.enabled).toBeFalsy();
    });

    it('should de-attach physical button click handler', () => {
      deleteButton.click();

      expect(tracking.deleteCurrentEntry).not.toHaveBeenCalled();
    });
  });

  describe('enableCurrentEntryResuming', () => {
    beforeEach(() => {
      showCurrentEntry();
      enableCurrentEntryResuming(tracking);
    });

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

  describe('enableCurrentEntryPausing', () => {
    beforeEach(() => {
      showCurrentEntry();
      enableCurrentEntryResuming(tracking);
      enableCurrentEntryPausing(tracking);
    });

    it('should set pause image to the button', () => {
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

  describe('enableLoader', () => {
    beforeEach(() => {
      showCurrentEntry();
    });

    it('should make loader state enabled', () => {
      enableLoader();
      expect(loader.state).toEqual(LOADER_STATE.ENABLED);
    });

    it('should hide current entry', () => {
      expect(currentEntry).toBeVisible();

      enableLoader();

      expect(currentEntry).not.toBeVisible();
    });
  });

  describe('hideConfigurationRequired', () => {
    beforeEach(showConfigurationRequired);

    it('should hide #configuration-instruction', () => {
      hideConfigurationRequired();
      expect(configurationRequired).not.toBeVisible();
    });
  });

  describe('showConfigurationRequired', () => {
    beforeEach(() => {
      showCurrentEntry();
      showConfigurationRequired();
    });

    it('should show #configuration-instruction', () => {
      expect(configurationRequired).toBeVisible();
    });

    it('should hide current entry', () => {
      expect(currentEntry).not.toBeVisible();
    });

    it('should disable #loader', () => {
      expect(loader.state).toEqual(LOADER_STATE.DISABLED);
    });
  });
});
