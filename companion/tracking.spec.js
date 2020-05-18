import _ from 'lodash';
import faker from 'faker';
import {
  CURRENT_ENTRY_REFRESH_INTERVAL_MS,
  NO_PROJECT_COLOR,
  OPTIMAL_TEXTS_LENGTH,
  Tracking,
} from './tracking';
import {API} from './api';
import {Transmitter, sendMessage} from '../common/transmitter';
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

        expect(sendMessage).toHaveBeenCalledTimes(1);
        const expectedData = expect.objectContaining({
          id: currentEntry.id,
          desc: currentEntry.description,
          start: Date.parse(currentEntry.start),
          billable: currentEntry.billable,
        });

        expect(sendMessage).toHaveBeenCalledWith({
          type: MESSAGE_TYPE.CURRENT_ENTRY_UPDATE,
          data: expectedData,
        });
      });

      it('should transmit project name and color', async () => {
        await tracking.initialize();

        expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({
            color: currentEntryProject.color,
            projectName: currentEntryProject.name,
          }),
        }));
      });

      it('should send entries updates in intervals', async () => {
        sendMessage.mockClear();
        await tracking.initialize();

        jest.advanceTimersByTime(CURRENT_ENTRY_REFRESH_INTERVAL_MS*2);

        await flushPromises();

        expect(sendMessage).toHaveBeenCalledTimes(1);

        currentEntry = timeEntryBody({description: faker.lorem.word()});

        api.fetchCurrentEntry.mockResolvedValueOnce(currentEntry);

        jest.advanceTimersByTime(CURRENT_ENTRY_REFRESH_INTERVAL_MS);

        await flushPromises();

        expect(sendMessage).toHaveBeenCalledTimes(2);

        const expectedData = expect.objectContaining({
          id: currentEntry.id,
          desc: currentEntry.description,
          start: Date.parse(currentEntry.start),
          billable: currentEntry.billable,
        });

        expect(sendMessage).toHaveBeenLastCalledWith({
          type: MESSAGE_TYPE.CURRENT_ENTRY_UPDATE,
          data: expectedData,
        });
      });

      describe('when project is not present', () => {
        beforeEach(() => {
          currentEntry = _.without(timeEntryBody(), 'pid');

          api.fetchCurrentEntry.mockResolvedValue(currentEntry);
        });

        it('should set project name to "no project" and color to gray', async () => {
          await tracking.initialize();

          expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
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

            expect(sendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
              data: expect.not.objectContaining({start: expect.anything()}),
            }));

            expect(sendMessage).toHaveBeenLastCalledWith({
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

          it('should send update with null', async () => {
            await tracking.initialize();

            expect(sendMessage).toHaveBeenCalledTimes(1);
            expect(sendMessage).toHaveBeenLastCalledWith({
              type: MESSAGE_TYPE.CURRENT_ENTRY_UPDATE,
              data: null,
            });
          });
        });
      });
    });
  });
});
