import {BUTTON_IMAGE, CurrentEntry, TIMER_UPDATE_INTERVAL_MS} from './current-entry.view';
import {EID} from '../selectors';
import {TimeEntryRepository} from '../../time-entry.repository';
import {timeEntryDetails} from '../../../companion/tracking';
import {timeEntryBody} from '../../../utils/factories/time-entries';
import {projectBody} from '../../../utils/factories/projects';
import document from 'document';
import {VIEW} from './index';
import {EventSource} from '../../../common/reactivity/event-source';
import {UserInterface} from '../../ui';

jest.mock('../../time-entry.repository');
jest.mock('../../ui');

describe(CurrentEntry, () => {
  let subject;
  let entriesRepo;
  let viewSwitch;
  let project;
  let description;
  let hours;
  let minutes;
  let seconds;
  let deleteButton;
  let stopResumeButton;
  let loader;
  let ui;

  const initializeAllElements = () => {
    loader = document.getElementById(EID.Loader);
    viewSwitch = document.getElementById(EID.ViewSwitch); // TODO: complete switch behavior
    project = document.getElementById(EID.CurrentEntryProject);
    description = document.getElementById(EID.CurrentEntryDescription);
    hours = document.getElementById(EID.TimerHours);
    minutes = document.getElementById(EID.TimerMinutes);
    seconds = document.getElementById(EID.TimerSeconds);
    deleteButton = document.getElementById(EID.DeleteButton);
    stopResumeButton = document.getElementById(EID.StopResumeButton);
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

      expect(entriesRepo.delete)
          .not
          .toHaveBeenCalled();
    });
  };

  const mountView = () => {
    entriesRepo = new TimeEntryRepository();
    ui = new UserInterface({entriesRepo});
    entriesRepo.currentEntryUpdated = new EventSource();
    subject = new CurrentEntry({entriesRepo, ui});
    subject.mounted();
  };

  beforeEach(() => {
    document._reset('./resources/views/current-entry.gui');
    mountView();
    initializeAllElements();
    jest.spyOn(Date, 'now').mockReturnValue(new Date().getTime());
  });

  afterEach(() => {
    subject.destroyed();
  });

  it('should switch to current entry tab', () => {
    expect(viewSwitch.value).toEqual(VIEW.CurrentEntry);
  });

  it('should call ui navigate on tab change', () => {
    expect(ui.navigate).not.toHaveBeenCalled();
    viewSwitch.value = VIEW.CurrentEntry;
    viewSwitch.dispatchEvent(new document._window.Event('select'));
    expect(ui.navigate).not.toHaveBeenCalled();
    viewSwitch.value = VIEW.EntriesLog;
    viewSwitch.dispatchEvent(new document._window.Event('select'));
    expect(ui.navigate).toHaveBeenCalledTimes(1);
    expect(ui.navigate).toHaveBeenLastCalledWith(VIEW.EntriesLog);
  });

  describe('when there is no current entry', () => {
    beforeEach(() => {
      entriesRepo.currentEntry = null;

      entriesRepo.currentEntryUpdated.next();

      initializeAllElements();
    });

    it('should show loader', () => {
      expect(loader).toBeVisible();
      expect(loader.getElementById(EID.LoaderRotation).state).toEqual('enabled');
    });
  });

  describe('view interaction', () => {
    const start = 1589285423000;
    const timeSectionActiveClass = 'current-entry__time--active';

    beforeEach(() => {
      entriesRepo.currentEntry = timeEntryDetails(timeEntryBody(), projectBody({id: 11}));

      entriesRepo.currentEntryUpdated.next();

      initializeAllElements();
    });

    it('should show loader', () => {
      expect(loader).not.toBeVisible();
    });

    it('should change fill color of project', () => {
      expect(project.style.fill).toEqual(entriesRepo.currentEntry.color);
    });

    it('should set project name', () => {
      expect(project.text).toEqual(entriesRepo.currentEntry.projectName);
    });

    it('should set entry description', () => {
      expect(description.text).toEqual(entriesRepo.currentEntry.desc);
    });

    describe('when there is no entry', () => {
      beforeEach(() => {
        entriesRepo.currentEntryUpdated.next(entriesRepo.currentEntry);
        entriesRepo.currentEntry = null;
        entriesRepo.currentEntryUpdated.next(null);
      });

      assertDeleteButtonIsDisabled();

      it('should disable stop-resume', () => {
        expect(stopResumeButton.enabled).toBeFalsy();
        stopResumeButton.click();

        expect(entriesRepo.start).not.toHaveBeenCalled();
        expect(entriesRepo.stop).not.toHaveBeenCalled();
      });
    });

    describe('when entry is not playing', () => {
      beforeEach(() => {
        entriesRepo.currentEntry = timeEntryDetails(timeEntryBody({isPlaying: false}), projectBody({id: 11}));

        entriesRepo.currentEntryUpdated.next(entriesRepo.currentEntry);
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

      it('should call repo.start when screen or physical button clicked', () => {
        expect(entriesRepo.start).not.toHaveBeenCalled();

        stopResumeButton.click();

        expect(entriesRepo.start).toHaveBeenCalledTimes(1);
        expect(entriesRepo.start).toHaveBeenLastCalledWith({
          id: entriesRepo.currentEntry.id,
          start: Date.now(),
        });
      });
    });

    describe('when entry is playing', () => {
      beforeEach(() => {
        entriesRepo.currentEntry = timeEntryDetails(timeEntryBody({
          start: new Date(start).toISOString(),
        }), projectBody({id: 11}));
        entriesRepo.currentEntryUpdated.next(entriesRepo.currentEntry);
        initializeAllElements();
      });

      describe('timer', () => {
        beforeEach(() => {
          Date.now.mockReturnValue(start);
          entriesRepo.currentEntryUpdated.next(entriesRepo.currentEntry);
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

            entriesRepo.currentEntryUpdated.next();
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

            entriesRepo.currentEntryUpdated.next();
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

            entriesRepo.currentEntryUpdated.next();
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

        it('should call repo.delete when screen or physical button button clicked', () => {
          deleteButton.click();

          expect(entriesRepo.delete).toHaveBeenCalledTimes(1);
          expect(entriesRepo.delete).toHaveBeenLastCalledWith({
            id: entriesRepo.currentEntry.id,
          });
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

        it('should call repo.stop when screen or physical button clicked', () => {
          expect(entriesRepo.stop).not.toHaveBeenCalled();

          stopResumeButton.click();

          expect(entriesRepo.stop).toHaveBeenCalledTimes(1);
          expect(entriesRepo.stop).toHaveBeenLastCalledWith({
            id: entriesRepo.currentEntry.id,
            stop: Date.now(),
          });
        });

        it('should not call repo.start on click', () => {
          stopResumeButton.click();

          expect(entriesRepo.start).not.toHaveBeenCalled();
        });
      });
    });
  });
});
