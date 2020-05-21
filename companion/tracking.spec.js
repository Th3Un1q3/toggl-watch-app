import _ from 'lodash';
import faker from 'faker';
import {
  CURRENT_ENTRY_REFRESH_INTERVAL_MS,
  NO_PROJECT_COLOR, NO_PROJECT_INFO,
  OPTIMAL_TEXTS_LENGTH,
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

  describe('commands handling', () => {
    let currentEntry;

    beforeEach(async () => {
      currentEntry = timeEntryBody({stop: faker.date.past()});
      api.fetchProjects.mockResolvedValue([]);
      api.fetchCurrentEntry.mockResolvedValue(currentEntry);
      await tracking.initialize();
      jest.spyOn(tracking, 'updateCurrentEntry');
      await flushPromises();
    });

    test('api is not called initially', () => {
      expect(api.updateTimeEntry).not.toHaveBeenCalled();
      expect(api.createTimeEntry).not.toHaveBeenCalled();
      expect(api.deleteTimeEntry).not.toHaveBeenCalled();
      expect(tracking.updateCurrentEntry).not.toHaveBeenCalled();
    });

    describe('stop current entry', () => {
      let stop;
      beforeEach(() => {
        stop = Date.now();

        Transmitter.emitMessageReceived(MESSAGE_TYPE.STOP_CURRENT_ENTRY, {
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

      it('should make tracking.updateCurrentEntry', () => {
        expect(tracking.updateCurrentEntry).toHaveBeenCalledTimes(1);
      });

      describe('when id from message does not match current', () => {
        beforeEach(async () => {
          api.updateTimeEntry.mockClear();

          Transmitter.emitMessageReceived(MESSAGE_TYPE.STOP_CURRENT_ENTRY, {
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

      beforeEach(() => {
        start = Date.now();

        Transmitter.emitMessageReceived(MESSAGE_TYPE.RESUME_LAST_ENTRY, {
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

      it('should make tracking.updateCurrentEntry', () => {
        expect(tracking.updateCurrentEntry).toHaveBeenCalledTimes(1);
      });

      describe('when there is no current entry', () => {
        let wid;

        beforeEach(async () => {
          wid = faker.random.number();

          api.createTimeEntry.mockClear();
          api.fetchUserInfo.mockResolvedValue({default_workspace_id: wid});
          api.fetchCurrentEntry.mockResolvedValue(null);
          await tracking.initialize();
          await flushPromises();

          Transmitter.emitMessageReceived(MESSAGE_TYPE.RESUME_LAST_ENTRY, {
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

          Transmitter.emitMessageReceived(MESSAGE_TYPE.RESUME_LAST_ENTRY, {
            id: faker.random.number(),
            start,
          });

          await flushPromises();
        });

        it('should not call api.createTimeEntry', () => {
          expect(api.createTimeEntry).not.toHaveBeenCalled();
        });
      });
    });

    describe('delete current entry', () => {
      beforeEach(() => {
        Transmitter.emitMessageReceived(MESSAGE_TYPE.DELETE_CURRENT_ENTRY, {
          id: currentEntry.id,
        });
      });

      it('should call api.deleteTimeEntry with entry id', () => {
        expect(api.deleteTimeEntry).toHaveBeenCalledTimes(1);

        expect(api.deleteTimeEntry).toHaveBeenLastCalledWith(expect.objectContaining({
          id: currentEntry.id,
        }));
      });

      it('should make tracking.updateCurrentEntry', () => {
        expect(tracking.updateCurrentEntry).toHaveBeenCalledTimes(1);
      });

      describe('when id from message does not match current', () => {
        beforeEach(async () => {
          api.deleteTimeEntry.mockClear();

          Transmitter.emitMessageReceived(MESSAGE_TYPE.DELETE_CURRENT_ENTRY, {
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

      beforeEach(() => {
        projects = _.times(10, projectBody);
        currentEntryProject = _.sample(projects);
        currentEntry = timeEntryBody({
          description: 'Short description',
          pid: currentEntryProject.id,
        });
        lastTimeEntry = timeEntryBody({
          description: _.times(OPTIMAL_TEXTS_LENGTH, () => 'BumBada').join(''),
          stop: '2020-05-08T13:41:09Z',
          pid: currentEntryProject.id,
        });

        api.fetchTimeEntries.mockResolvedValue([
          lastTimeEntry,
        ]);
        api.fetchUserInfo.mockResolvedValue({id: 20});
        api.fetchCurrentEntry.mockResolvedValue(currentEntry);
        api.fetchProjects.mockResolvedValue(projects);
      });

      it('should fetch current time entry', async () => {
        await tracking.initialize();

        expect(api.fetchCurrentEntry).toHaveBeenCalledTimes(1);
      });

      it('should transmit current entry basic info', async () => {
        await tracking.initialize();

        expect(Transmitter.instanceSendMessage).toHaveBeenCalledTimes(1);
        const expectedData = expect.objectContaining({
          id: currentEntry.id,
          desc: currentEntry.description,
          start: Date.parse(currentEntry.start),
          billable: currentEntry.billable,
        });

        expect(Transmitter.instanceSendMessage).toHaveBeenCalledWith({
          type: MESSAGE_TYPE.CURRENT_ENTRY_UPDATE,
          data: expectedData,
        });
      });

      it('should transmit project name and color', async () => {
        await tracking.initialize();

        expect(Transmitter.instanceSendMessage).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({
            color: currentEntryProject.color,
            projectName: currentEntryProject.name,
          }),
        }));
      });

      it('should send entries updates in intervals', async () => {
        Transmitter.instanceSendMessage.mockClear();
        await tracking.initialize();

        jest.advanceTimersByTime(CURRENT_ENTRY_REFRESH_INTERVAL_MS*2);

        await flushPromises();

        expect(Transmitter.instanceSendMessage).toHaveBeenCalledTimes(1);

        currentEntry = timeEntryBody({description: faker.lorem.word()});

        api.fetchCurrentEntry.mockResolvedValueOnce(currentEntry);

        jest.advanceTimersByTime(CURRENT_ENTRY_REFRESH_INTERVAL_MS);

        await flushPromises();

        expect(Transmitter.instanceSendMessage).toHaveBeenCalledTimes(2);

        const expectedData = expect.objectContaining({
          id: currentEntry.id,
          desc: currentEntry.description,
          start: Date.parse(currentEntry.start),
          billable: currentEntry.billable,
        });

        expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith({
          type: MESSAGE_TYPE.CURRENT_ENTRY_UPDATE,
          data: expectedData,
        });
      });

      describe('when project is not present', () => {
        beforeEach(() => {
          currentEntry = _.without(timeEntryBody(), 'pid', 'description');

          api.fetchCurrentEntry.mockResolvedValue(currentEntry);
        });

        it('should set project name to "no project" and color to gray', async () => {
          await tracking.initialize();

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
        beforeEach(() => {
          api.fetchCurrentEntry.mockResolvedValue(null);
        });

        describe('when entries present', () => {
          it('should send the first of them', async () => {
            await tracking.initialize();

            expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
              data: expect.not.objectContaining({start: expect.anything()}),
            }));

            expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith({
              type: MESSAGE_TYPE.CURRENT_ENTRY_UPDATE,
              data: expect.objectContaining({
                id: lastTimeEntry.id,
                desc: expect.stringContaining(lastTimeEntry.description.slice(0, 50)),
                billable: lastTimeEntry.billable,
              }),
            });
          });
        });

        describe('and there is no last entry', () => {
          beforeEach(() => {
            api.fetchTimeEntries.mockResolvedValue([]);
          });

          it('should send update with default current entry', async () => {
            await tracking.initialize();

            expect(Transmitter.instanceSendMessage).toHaveBeenCalledTimes(1);
            expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith({
              type: MESSAGE_TYPE.CURRENT_ENTRY_UPDATE,
              data: {
                desc: gettext('no_description'),
                billable: false,
                ...NO_PROJECT_INFO,
              },
            });
          });
        });
      });
    });
  });
});
