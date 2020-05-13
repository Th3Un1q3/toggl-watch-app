import _ from 'lodash';

import {Tracking} from './tracking';
import {API} from './api';
import {Transmitter, sendMessage} from '../common/transmitter';
import {MESSAGE_TYPE} from '../common/message-types';
import {timeEntryBody} from '../utils/factories/time-entries';
import {projectBody} from '../utils/factories/projects';
import {gettext} from '../__mocks__/i18n';

jest.mock('../common/transmitter');
jest.mock('./api');

describe('Tracking', () => {
  let tracking;
  let api;

  beforeEach(() => {
    api = new API();
    tracking = new Tracking({api, transmitter: new Transmitter()});
  });

  describe('.initialize', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch current user', async () => {
      expect(api.fetchUserInfo).not.toHaveBeenCalled();

      await tracking.initialize();

      expect(api.fetchUserInfo).toHaveBeenCalledTimes(1);
    });

    describe('when all api requests pass', () => {
      let currentEntry;
      let currentEntryProject;
      let projects;
      beforeEach(() => {
        projects = _.times(10, projectBody);
        currentEntryProject = _.sample(projects);
        currentEntry = timeEntryBody({pid: currentEntryProject.id});

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

      describe('when project is not present', () => {
        beforeEach(() => {
          currentEntry = _.without(timeEntryBody(), 'pid');

          api.fetchCurrentEntry.mockResolvedValue(currentEntry);
        });

        it('should set project name to "no project" and color to gray', async () => {
          await tracking.initialize();

          expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
              color: '#aaaaaa',
              projectName: gettext('no_project'),
            }),
          }));
        });
      });

      describe('when entry is null', () => {
        beforeEach(() => {
          api.fetchCurrentEntry.mockResolvedValue(null);
        });

        it('should send update with null', async () => {
          await tracking.initialize();

          expect(sendMessage).toHaveBeenCalledTimes(1);
          expect(sendMessage).toHaveBeenCalledWith({
            type: MESSAGE_TYPE.CURRENT_ENTRY_UPDATE,
            data: null,
          });
        });
      });
    });
  });
});
