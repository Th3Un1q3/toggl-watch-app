import _ from 'lodash';
import faker from 'faker';
import {
  ENTRIES_REFRESH_INTERVAL,
  NO_PROJECT_COLOR, NO_PROJECT_INFO,
  OPTIMAL_TEXTS_LENGTH, timeEntryDetails,
  Tracking,
} from './tracking';
import {API} from './api';
import {Transmitter} from '../common/transmitter';
import flushPromises from 'flush-promises';
import {MESSAGE_TYPE} from '../common/message-types';
import {timeEntryBody} from '../utils/factories/time-entries';
import {projectBody} from '../utils/factories/projects';
import {gettext} from '../__mocks__/i18n';

jest.mock('../common/transmitter');
jest.mock('./api');

describe('Tracking', () => {
  let tracking;
  let api;

  beforeEach(async () => {
    api = new API();
    tracking = new Tracking({api, transmitter: new Transmitter()});
    await flushPromises();
    jest.clearAllMocks();
  });

  const assertRefreshesCurrentEntry = () => {
    it('should make tracking.refreshCurrentEntry', () => {
      expect(tracking.refreshCurrentEntry)
          .toHaveBeenCalledTimes(1);
    });
  };

  describe('commands handling', () => {
    let currentEntry;
    let entryInLog;

    beforeEach(async () => {
      currentEntry = timeEntryBody({stop: faker.date.past()});
      entryInLog = timeEntryBody();
      api.fetchTimeEntries.mockResolvedValue([
        currentEntry,
        entryInLog,
      ]);
      api.fetchProjects.mockResolvedValue([]);
      api.fetchCurrentEntry.mockResolvedValue(currentEntry);
      await tracking.initialize();
      jest.spyOn(tracking, 'refreshCurrentEntry');
      await flushPromises();
    });

    test('api is not called initially', () => {
      expect(api.updateTimeEntry).not.toHaveBeenCalled();
      expect(api.createTimeEntry).not.toHaveBeenCalled();
      expect(api.deleteTimeEntry).not.toHaveBeenCalled();
      expect(tracking.refreshCurrentEntry).not.toHaveBeenCalled();
    });

    describe('request time entry details', () => {
      beforeEach(() => {
        Transmitter.emitMessageReceived(MESSAGE_TYPE.REQUEST_ENTRY_DETAILS, {
          entryId: entryInLog.id,
        });
      });

      it('should send time entry info from the log', () => {
        expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith({
          type: MESSAGE_TYPE.TIME_ENTRY_DETAILS,
          data: {
            ...timeEntryDetails(entryInLog),
            cur: false,
          },
        });
      });
    });

    describe('stop current entry', () => {
      let stop;
      beforeEach(() => {
        stop = Date.now();

        Transmitter.emitMessageReceived(MESSAGE_TYPE.STOP_TIME_ENTRY, {
          id: currentEntry.id,
          stop,
        });
      });

      it('should call api.updateTimeEntry with stop property from message', () => {
        expect(api.updateTimeEntry).toHaveBeenCalledTimes(1);

        expect(api.updateTimeEntry).toHaveBeenLastCalledWith(expect.objectContaining({
          id: currentEntry.id,
          stop: new Date(stop).toISOString(),
        }));
      });

      describe('when id from message does not match current', () => {
        beforeEach(async () => {
          api.updateTimeEntry.mockClear();

          Transmitter.emitMessageReceived(MESSAGE_TYPE.STOP_TIME_ENTRY, {
            id: faker.random.number(),
            stop,
          });

          await flushPromises();
        });

        it('should not call api.updateTimeEntry', () => {
          expect(api.updateTimeEntry).not.toHaveBeenCalled();
        });
      });
    });

    describe('resume last entry', () => {
      let start;
      let wid;

      beforeEach(() => {
        wid = faker.random.number();
        start = Date.now();
        api.fetchUserInfo.mockResolvedValue({default_workspace_id: wid});

        Transmitter.emitMessageReceived(MESSAGE_TYPE.START_TIME_ENTRY, {
          id: currentEntry.id,
          start,
        });
      });

      it('should call api.createTimeEntry with entry data and start from message', () => {
        expect(api.createTimeEntry).toHaveBeenCalledTimes(1);

        expect(api.createTimeEntry).toHaveBeenLastCalledWith(expect.objectContaining({
          id: currentEntry.id,
          start: new Date(start).toISOString(),
          stop: null,
        }));
      });

      describe('when there is entry matched by id', () => {
        beforeEach(async () => {
          api.createTimeEntry.mockClear();
          api.fetchCurrentEntry.mockResolvedValue(null);
          await tracking.initialize();
          tracking.currentEntry = null;
          await flushPromises();

          Transmitter.emitMessageReceived(MESSAGE_TYPE.START_TIME_ENTRY, {
            start,
          });

          await flushPromises();
        });

        it('should create new with "wid"(required property) taken from user', () => {
          expect(api.createTimeEntry).toHaveBeenLastCalledWith(expect.objectContaining({
            start: new Date(start).toISOString(),
            stop: null,
            wid,
          }));
        });
      });

      describe('when id from message does not match current', () => {
        beforeEach(async () => {
          api.createTimeEntry.mockClear();

          Transmitter.emitMessageReceived(MESSAGE_TYPE.START_TIME_ENTRY, {
            id: entryInLog.id,
            start,
          });

          await flushPromises();
        });

        it('should resume entry from the log', () => {
          expect(api.createTimeEntry).toHaveBeenLastCalledWith(expect.objectContaining({
            ...entryInLog,
            start: new Date(start).toISOString(),
            stop: null,
          }));
        });
      });
    });

    describe('delete current entry', () => {
      beforeEach(() => {
        Transmitter.emitMessageReceived(MESSAGE_TYPE.DELETE_TIME_ENTRY, {
          id: currentEntry.id,
        });
      });

      it('should call api.deleteTimeEntry with entry id', () => {
        expect(api.deleteTimeEntry).toHaveBeenCalledTimes(1);

        expect(api.deleteTimeEntry).toHaveBeenLastCalledWith(expect.objectContaining({
          id: currentEntry.id,
        }));
      });

      assertRefreshesCurrentEntry();

      describe('when id from message does not match current', () => {
        beforeEach(async () => {
          api.deleteTimeEntry.mockClear();

          Transmitter.emitMessageReceived(MESSAGE_TYPE.DELETE_TIME_ENTRY, {
            id: faker.random.number(),
          });

          await flushPromises();
        });

        it('should not call api.deleteTimeEntry', () => {
          expect(api.deleteTimeEntry).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('.initialize', () => {
    it('should fetch current user', async () => {
      expect(api.fetchUserInfo).not.toHaveBeenCalled();

      await tracking.initialize();

      expect(api.fetchUserInfo).toHaveBeenCalledTimes(1);
    });

    describe('when all api requests pass', () => {
      let currentEntry;
      let currentEntryProject;
      let projects;
      let lastTimeEntry;

      beforeEach(async () => {
        projects = _.times(10, projectBody);
        currentEntryProject = _.sample(projects);
        currentEntry = timeEntryBody({
          description: 'Short description',
          pid: currentEntryProject.id,
        });
        lastTimeEntry = timeEntryBody({
          description: _.times(OPTIMAL_TEXTS_LENGTH, () => 'BumBada').join(''),
          isPlaying: false,
          pid: currentEntryProject.id,
        });

        api.fetchTimeEntries.mockResolvedValue([
          lastTimeEntry,
        ]);
        api.fetchUserInfo.mockResolvedValue({id: 20});
        api.fetchCurrentEntry.mockResolvedValue(currentEntry);
        api.fetchProjects.mockResolvedValue(projects);

        Transmitter.instanceSendMessage.mockClear();

        await tracking.initialize();
      });

      it('should fetch current time entry', async () => {
        expect(api.fetchCurrentEntry).toHaveBeenCalledTimes(1);
      });

      it('should transmit current entry basic info', async () => {
        const expectedData = expect.objectContaining({
          id: currentEntry.id,
          desc: currentEntry.description,
          start: Date.parse(currentEntry.start),
          isPlaying: true,
          bil: currentEntry.billable,
        });

        expect(Transmitter.instanceSendMessage).toHaveBeenCalledWith({
          type: MESSAGE_TYPE.TIME_ENTRY_DETAILS,
          data: expectedData,
        });
      });

      it('should transmit entries log with ids', () => {
        expect(Transmitter.instanceSendMessage).toHaveBeenCalledWith({
          type: MESSAGE_TYPE.ENTRIES_LOG_UPDATE,
          data: [lastTimeEntry.id],
        });
      });

      it('should transmit project name and color', async () => {
        expect(Transmitter.instanceSendMessage).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({
            color: currentEntryProject.color,
            projectName: currentEntryProject.name,
          }),
        }));
      });

      it('should send entries updates in intervals', async () => {
        jest.advanceTimersByTime(ENTRIES_REFRESH_INTERVAL*2);

        await flushPromises();

        currentEntry = timeEntryBody({description: faker.lorem.word()});

        api.fetchCurrentEntry.mockResolvedValueOnce(currentEntry);

        jest.advanceTimersByTime(ENTRIES_REFRESH_INTERVAL);

        await flushPromises();

        const expectedData = expect.objectContaining({
          id: currentEntry.id,
          cur: true,
          desc: currentEntry.description,
          start: Date.parse(currentEntry.start),
          bil: currentEntry.billable,
        });

        expect(Transmitter.instanceSendMessage).toHaveBeenCalledWith({
          type: MESSAGE_TYPE.TIME_ENTRY_DETAILS,
          data: expectedData,
        });
      });

      describe('when project is not present', () => {
        beforeEach(async () => {
          currentEntry = _.without(timeEntryBody(), 'pid', 'description');

          api.fetchCurrentEntry.mockResolvedValue(currentEntry);

          Transmitter.instanceSendMessage.mockClear();
          await tracking.initialize();
        });

        it('should set project name to "no project" and color to gray', async () => {
          expect(Transmitter.instanceSendMessage).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
              desc: gettext('no_description'),
              color: NO_PROJECT_COLOR,
              projectName: gettext('no_project'),
            }),
          }));
        });
      });

      describe('when entry is null', () => {
        beforeEach(async () => {
          api.fetchCurrentEntry.mockResolvedValue(null);
          Transmitter.instanceSendMessage.mockClear();
          await tracking.initialize();
        });

        describe('when entries present', () => {
          it('should send the first of them', async () => {
            expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
              data: expect.objectContaining({isPlaying: false, start: Date.parse(lastTimeEntry.start)}),
            }));

            expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith({
              type: MESSAGE_TYPE.TIME_ENTRY_DETAILS,
              data: expect.objectContaining({
                id: lastTimeEntry.id,
                cur: true,
                desc: expect.stringContaining(lastTimeEntry.description.slice(0, 50)),
                bil: lastTimeEntry.billable,
              }),
            });
          });
        });

        describe('and there is no last entry', () => {
          beforeEach(async () => {
            api.fetchTimeEntries.mockResolvedValue([]);

            Transmitter.instanceSendMessage.mockClear();
            await tracking.initialize();
          });

          it('should transmit empty time entries log', () => {
            expect(Transmitter.instanceSendMessage).toHaveBeenCalledWith({
              type: MESSAGE_TYPE.ENTRIES_LOG_UPDATE,
              data: [],
            });
          });

          it('should send update with default current entry', async () => {
            expect(Transmitter.instanceSendMessage).toHaveBeenCalledWith({
              type: MESSAGE_TYPE.TIME_ENTRY_DETAILS,
              data: {
                desc: gettext('no_description'),
                cur: true,
                bil: false,
                ...NO_PROJECT_INFO,
              },
            });
          });
        });
      });
    });
  });
});
