import _ from 'lodash';
import faker from 'faker';

import document from 'document';
import {
  UserInterface,
  BUTTON_IMAGE,
  LOADER_STATE,
  TIMER_UPDATE_INTERVAL_MS,
  EID,
  LIST_TILE,
  VIEW,
} from './ui';
import {Subject} from '../common/observable';
import {timeEntryDetails} from '../companion/tracking';
import {timeEntryBody} from '../utils/factories/time-entries';
import {projectBody} from '../utils/factories/projects';
import {gettext} from 'i18n';
import {Tracking} from './tracking';
import {
  BACKGROUND_HIGHLIGHT_CLASS, REGULAR_TEXT_COLOR,
  TIME_ENTRY_BILLABLE_CLASS,
  TIME_ENTRY_HIDDEN_TILE_CLASS,
} from './ui/entries-log-tile';

jest.mock('./tracking');

describe('UI module', () => {
  let viewSwitch;
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
  let entryLogTile;

  const assertLoaderEnabled = () => {
    it('should make loader state enabled and loader visible', () => {
      expect(loader).toBeVisible();
      expect(loader.state).toEqual(LOADER_STATE.Enabled);
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
    viewSwitch = document.getElementById(EID.ViewSwitch);
    configurationRequired = document.getElementById(EID.ConfigurationInstruction);
    loader = document.getElementById(EID.Loader);
    project = document.getElementById(EID.CurrentEntryProject);
    description = document.getElementById(EID.CurrentEntryDescription);
    hours = document.getElementById(EID.TimerHours);
    minutes = document.getElementById(EID.TimerMinutes);
    seconds = document.getElementById(EID.TimerSeconds);
    deleteButton = document.getElementById(EID.DeleteButton);
    stopResumeButton = document.getElementById(EID.StopResumeButton);
    entriesLog = document.getElementById(EID.LogContainer);
    entryLogTile = document.getElementById('time-entry[1]');
  };

  const initializeUI = () => {
    tracking = Object.assign(
        new Tracking({}),
        {
          currentEntrySubject: new Subject(),
          entriesLogContentsSubject: new Subject(),
          entriesLogDetailsSubject: new Subject(),
          entriesLogDetails: [],
        },
    );
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

    it('should switch to current entry view', () => {
      expect(viewSwitch.value).toEqual(VIEW.CurrentEntry);
    });

    describe('if loading takes longer than 10 seconds', () => {
      it.todo('should show check your connection message');
    });
  });

  describe('on entries details update', () => {
    let timeEntry;
    beforeEach(() => {
      timeEntry = timeEntryDetails(timeEntryBody({
        start: '2020-05-03T10:43:29+00:00',
        stop: '2020-05-03T11:53:49+00:00',
        billable: true,
      }), projectBody());

      tracking.entriesLogDetails = [
        {entryId: 1010101, displayedIn: 'time-entry[0]'},
        {entryId: timeEntry.id, displayedIn: entryLogTile.id, info: timeEntry},
      ];

      tracking.entriesLogDetailsSubject.next();
    });

    it('should set project name', () => {
      expect(entryLogTile.getElementById('project')).toHaveProperty('text', timeEntry.projectName);
    });

    it('should set project color', () => {
      expect(entryLogTile.getElementById('project')).toHaveStyle({'fill': timeEntry.color});
    });

    it('should set entry description', () => {
      expect(entryLogTile.getElementById('description')).toHaveProperty('text', timeEntry.desc);
    });

    it('should set formatted entry duration', () => {
      expect(entryLogTile.getElementById('duration')).toHaveProperty('text', '01:10:20');
    });

    it('should set entry billable', () => {
      expect(entryLogTile.getElementById('billable')).toHaveClass(TIME_ENTRY_BILLABLE_CLASS);
    });

    describe('when it is non billable entry received', () => {
      beforeEach(() => {
        const nonBillableEntry = timeEntryDetails(timeEntryBody({
          start: '2020-05-03T10:43:29+00:00',
          stop: '2020-05-03T11:53:49+00:00',
          billable: false,
        }), projectBody());

        tracking.entriesLogDetails = [
          {entryId: 1010101, displayedIn: 'time-entry[0]'},
          {entryId: nonBillableEntry.id, displayedIn: entryLogTile.id, info: nonBillableEntry},
        ];

        tracking.entriesLogDetailsSubject.next();
      });

      it('should set entry to non billable', () => {
        expect(entryLogTile.getElementById('billable')).not.toHaveClass(TIME_ENTRY_BILLABLE_CLASS);
      });
    });
  });

  describe('on entriesLogContents update', () => {
    beforeEach(() => {
      tracking.entriesLogContents = _.times(_.random(5, 15), faker.random.number);
    });

    it('should set log.length equal to contents length + one for placeholder', () => {
      expect(entriesLog.length).not.toBeDefined();
      tracking.entriesLogContentsSubject.next(tracking.entriesLogContents);
      expect(entriesLog.length).toEqual(tracking.entriesLogContents.length + 1);
    });

    describe('list renderer', () => {
      beforeEach(() => {
        viewSwitch.value = VIEW.EntriesLog;
        tracking.entriesLogContentsSubject.next(tracking.entriesLogContents);
      });

      describe('for first tile(placeholder)', () => {
        it('should set first log tile to placeholder', () => {
          expect(entriesLog.delegate.getTileInfo(0).type).toEqual(LIST_TILE.TimeEntry);
          expect(entriesLog.delegate.getTileInfo(0).isPlaceholder).toBeTruthy();
        });

        it('should hide a tile', () => {
          entriesLog.delegate.configureTile(entryLogTile, {isPlaceholder: true, type: LIST_TILE.TimeEntry});
          expect(entryLogTile.getElementById('wrapper')).toHaveClass(TIME_ENTRY_HIDDEN_TILE_CLASS);
        });
      });

      describe('for time entry tile', () => {
        let entryPlace;
        let expectedEntryId;

        beforeEach(() => {
          entryPlace = _.random(1, tracking.entriesLogContents.length);
          expectedEntryId = tracking.entriesLogContents[entryPlace - 1];
          _.times(
              2,
              () => entriesLog.delegate.configureTile(entryLogTile, entriesLog.delegate.getTileInfo(entryPlace)),
          );
        });

        it('should not hide a tile', () => {
          expect(entryLogTile.getElementById('wrapper')).not.toHaveClass(TIME_ENTRY_HIDDEN_TILE_CLASS);
        });

        it('should set description to "log_description_loading"', () => {
          expect(entryLogTile.getElementById('description')).toHaveProperty(
              'text',
              gettext('log_description_loading'),
          );
        });

        it('should set project to "log_project_loading"', () => {
          expect(entryLogTile.getElementById('project')).toHaveProperty(
              'text',
              gettext('log_project_loading'),
          );
        });

        it('should set default project color', () => {
          expect(entryLogTile.getElementById('project')).toHaveStyle({'fill': REGULAR_TEXT_COLOR});
        });

        it('should set duration to "--:--"', () => {
          expect(entryLogTile.getElementById('duration')).toHaveProperty(
              'text',
              '--:--',
          );
        });

        it('should mark billable indicator as not billable', () => {
          expect(entryLogTile.getElementById('billable')).not.toHaveClass(TIME_ENTRY_BILLABLE_CLASS);
        });

        it('should set entries tile info', () => {
          expect(entriesLog.delegate.getTileInfo(entryPlace).type).toEqual(LIST_TILE.TimeEntry);
          expect(entriesLog.delegate.getTileInfo(entryPlace).isPlaceholder).toBeFalsy();
          expect(entriesLog.delegate.getTileInfo(entryPlace).id).toEqual(expectedEntryId);
        });

        it('should call tracker.requestDetails', () => {
          expect(tracking.requestDetails).toHaveBeenCalledTimes(2);
          expect(tracking.requestDetails).toHaveBeenLastCalledWith({
            entryId: expectedEntryId,
            displayedIn: entryLogTile.id,
          });
        });

        it('should switch to current entry view', () => {
          expect(viewSwitch.value).toEqual(VIEW.EntriesLog);
          entryLogTile.click();
          expect(viewSwitch.value).toEqual(VIEW.CurrentEntry);
        });


        it('should call tracking startEntryFromLog on click', () => {
          expect(tracking.startEntryFromLog).not.toHaveBeenCalled();
          entryLogTile.click();
          expect(tracking.startEntryFromLog).toHaveBeenCalledTimes(1);
          expect(tracking.startEntryFromLog).toHaveBeenLastCalledWith(expectedEntryId);
        });

        it('should attach highlight to the tile', () => {
          expect(entryLogTile.getElementById('background')).not.toHaveClass(BACKGROUND_HIGHLIGHT_CLASS);
          entryLogTile.onmousedown();
          jest.advanceTimersByTime(200);
          expect(entryLogTile.getElementById('background')).toHaveClass(BACKGROUND_HIGHLIGHT_CLASS);
          entryLogTile.onmousedown();
          expect(entryLogTile.getElementById('background')).toHaveClass(BACKGROUND_HIGHLIGHT_CLASS);
          jest.advanceTimersByTime(500);
          expect(entryLogTile.getElementById('background')).not.toHaveClass(BACKGROUND_HIGHLIGHT_CLASS);
          entryLogTile.onmousedown();

          expect(entryLogTile.getElementById('background')).toHaveClass(BACKGROUND_HIGHLIGHT_CLASS);
          entryLogTile.onmouseup();
          expect(entryLogTile.getElementById('background')).not.toHaveClass(BACKGROUND_HIGHLIGHT_CLASS);
        });
      });
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
        expect(entriesLog.value).toEqual();
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
        expect(hours).not.toHaveClass(timeSectionActiveClass);
        expect(minutes).not.toHaveClass(timeSectionActiveClass);
        expect(seconds).toHaveClass(timeSectionActiveClass);
      });


      assertDeleteButtonIsDisabled();


      it('should set button image to play', () => {
        expect(stopResumeButton).toBeVisible();
        expect(stopResumeButton.getElementById('combo-button-icon-press').href).toEqual(
            BUTTON_IMAGE.PlayPress,
        );
        expect(stopResumeButton.getElementById('combo-button-icon').href).toEqual(
            BUTTON_IMAGE.Play,
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
            expect(hours).not.toHaveClass(timeSectionActiveClass);
            expect(minutes).toHaveClass(timeSectionActiveClass);
            expect(seconds).not.toHaveClass(timeSectionActiveClass);
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
            expect(hours).toHaveClass(timeSectionActiveClass);
            expect(minutes).not.toHaveClass(timeSectionActiveClass);
            expect(seconds).not.toHaveClass(timeSectionActiveClass);
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
            expect(hours).not.toHaveClass(timeSectionActiveClass);
            expect(minutes).not.toHaveClass(timeSectionActiveClass);
            expect(seconds).toHaveClass(timeSectionActiveClass);
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
              BUTTON_IMAGE.PausePress,
          );
          expect(stopResumeButton.getElementById('combo-button-icon').href).toEqual(
              BUTTON_IMAGE.Pause,
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
