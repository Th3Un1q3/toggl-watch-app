import {EntriesLog, LIST_TILE} from './entries-log.view';
import {TimeEntryRepository} from '../../time-entry.repository';
import {EID} from '../selectors';
import {timeEntryDetails} from '../../../companion/tracking';
import {timeEntryBody} from '../../../utils/factories/time-entries';
import {projectBody} from '../../../utils/factories/projects';
import {EventSource} from '../../../common/reactivity/event-source';
import faker from 'faker';
import {
  BACKGROUND_HIGHLIGHT_CLASS,
  REGULAR_TEXT_COLOR,
  TIME_ENTRY_BILLABLE_CLASS,
  TIME_ENTRY_HIDDEN_TILE_CLASS,
} from '../entries-log-tile.element';
import _ from 'lodash';

import document from 'document';
import {gettext} from 'i18n';
import {VIEW} from './index';
import {UserInterface} from '../../ui';

jest.mock('../../time-entry.repository');
jest.mock('../../ui');

describe(EntriesLog, () => {
  let entriesRepo;
  let subject;
  let entriesLog;
  let entryLogTile;
  let viewSwitch;
  let ui;

  const initializeAllElements = () => {
    viewSwitch = document.getElementById(EID.ViewSwitch);
    entriesLog = document.getElementById(EID.LogContainer);
    entryLogTile = document.getElementById('time-entry[1]');
  };

  const mountView = () => {
    entriesRepo = new TimeEntryRepository();
    entriesRepo.entriesLogContents = [];
    entriesRepo.entryInfoUpdated = new EventSource();
    entriesRepo.entriesLogContentsUpdate = new EventSource();
    ui = new UserInterface({entriesRepo});
    subject = new EntriesLog({entriesRepo, ui});
    subject.mounted();
  };

  beforeEach(() => {
    document._reset('./resources/views/entries-log.gui');
    mountView();
    initializeAllElements();
    jest.spyOn(Date, 'now').mockReturnValue(new Date().getTime());
  });

  afterEach(() => {
    subject.destroyed();
  });

  describe('on entries details update', () => {
    let timeEntry;

    const renderEntry = (entry) => entriesLog.delegate.configureTile(
        entryLogTile,
        {id: entry.id, isPlaceholder: false},
    );

    beforeEach(() => {
      timeEntry = timeEntryDetails(timeEntryBody({
        start: '2020-05-03T10:43:29+00:00',
        stop: '2020-05-03T11:53:49+00:00',
        billable: true,
      }), projectBody());

      renderEntry(timeEntry);

      entriesRepo.find.mockClear();
      entriesRepo.find.mockReturnValue(timeEntry);

      entriesRepo.entryInfoUpdated.next(faker.random.number());
      entriesRepo.entryInfoUpdated.next(timeEntry.id);
    });

    it('should request details', () => {
      expect(entriesRepo.find).toHaveBeenCalledTimes(1);
      expect(entriesRepo.find).toHaveBeenLastCalledWith({id: timeEntry.id});
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
      expect(entryLogTile.getElementById(EID.LogTileDuration)).toHaveProperty('text', '01:10:20');
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

        entriesRepo.find.mockReturnValue(null);

        renderEntry(nonBillableEntry);

        entriesRepo.find.mockReturnValue(nonBillableEntry);
      });

      it('should set entry to non billable', () => {
        expect(entryLogTile.getElementById('billable')).not.toHaveClass(TIME_ENTRY_BILLABLE_CLASS);
      });
    });
  });

  describe('on entriesLogContents update', () => {
    beforeEach(() => {
      entriesRepo.entriesLogContents = _.times(_.random(5, 15), faker.random.number);
    });

    it('should set log.length equal to contents length + one for placeholder', () => {
      expect(entriesLog.length).toBe(1);
      entriesRepo.entriesLogContentsUpdate.next();
      expect(entriesLog.length).toEqual(entriesRepo.entriesLogContents.length + 1);
    });

    describe('list renderer', () => {
      beforeEach(() => {
        entriesRepo.entriesLogContentsUpdate.next();
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

        const renderEntryFromLog = () => entriesLog.delegate.configureTile(
            entryLogTile,
            entriesLog.delegate.getTileInfo(entryPlace),
        );

        beforeEach(() => {
          entryPlace = _.random(1, entriesRepo.entriesLogContents.length);

          expectedEntryId = entriesRepo.entriesLogContents[entryPlace - 1];

          _.times(
              2,
              () => renderEntryFromLog(),
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
          expect(entryLogTile.getElementById(EID.LogTileDuration)).toHaveProperty(
              'text',
              '--:--:--',
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

        it('should call entriesRepo.find with entry id', () => {
          expect(entriesRepo.find).toHaveBeenCalledTimes(2);
          expect(entriesRepo.find).toHaveBeenLastCalledWith({
            id: expectedEntryId,
          });
        });

        it('should switch to current entry view', () => {
          expect(viewSwitch.value).toEqual(VIEW.EntriesLog);
          viewSwitch.dispatchEvent(new document._window.Event('select'));
          expect(ui.navigate).not.toHaveBeenCalled();
          entryLogTile.click();
          expect(viewSwitch.value).toEqual(VIEW.CurrentEntry);
          viewSwitch.dispatchEvent(new document._window.Event('select'));
          expect(ui.navigate).toHaveBeenCalledTimes(1);
          expect(ui.navigate).toHaveBeenLastCalledWith(VIEW.CurrentEntry);
        });

        it('should call repo.start on click', () => {
          expect(entriesRepo.start).not.toHaveBeenCalled();
          entryLogTile.click();
          expect(entriesRepo.start).toHaveBeenCalledTimes(1);
          expect(entriesRepo.start).toHaveBeenLastCalledWith({
            id: expectedEntryId,
            start: Date.now(),
          });
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

        describe('when time entry present', () => {
          let timeEntry;
          beforeEach(() => {
            timeEntry = timeEntryDetails(timeEntryBody({id: expectedEntryId}), projectBody());
            entriesRepo.find.mockReturnValue(timeEntry);
            renderEntryFromLog();
          });

          it('should render entry info', () => {
            expect(entryLogTile.getElementById('project')).toHaveProperty('text', timeEntry.projectName);
          });
        });
      });
    });
  });
});
