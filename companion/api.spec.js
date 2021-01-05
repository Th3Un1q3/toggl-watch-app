import _ from 'lodash';
import faker from 'faker';
import {API, API_APP_REFERENCE, HTTP_STATUS} from './api';
import {timeEntryBody} from '../utils/factories/time-entries';
import {projectBody} from '../utils/factories/projects';

describe('API', () => {
  let api;

  const mockSuccessResponse = (body) => {
    const response = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(body),
      text: jest.fn().mockResolvedValue('text'),
    };

    fetch.mockResolvedValue(response);
  };

  beforeEach(() => {
    api = new API({token: 'asf'});
  });

  it('should be able to initialize without token', () => {
    expect(() => new API()).not.toThrow();
  });

  describe('.updateToken', () => {
    it('should actualize headers', () => {
      const newToken = 'token';

      const expectedAuthHeader = 'Basic dG9rZW46YXBpX3Rva2Vu';

      api.updateToken(newToken);

      expect(api._headers.get('Authorization')).toEqual(expectedAuthHeader);
    });
  });

  describe('.request', () => {
    const successResponse = {data: 'response'};
    const authErrorHandler = jest.fn();

    beforeEach(() => {
      mockSuccessResponse(successResponse);
    });

    it('should apply headers to request', async () => {
      await api.request('asfasf');

      expect(fetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({headers: api._headers}));
    });

    it('should pass url to request', async () => {
      const url = 'me';

      await api.request(url);

      expect(fetch).toHaveBeenLastCalledWith('https://www.toggl.com/api/v9/' + url, expect.any(Object));
    });

    it('should return json response', async () => {
      const response = await api.request('asgdasg');

      expect(response).toEqual(successResponse);
    });

    describe('when response is not authorized', () => {
      beforeEach(() => {
        const response = {
          ok: false,
          status: HTTP_STATUS.UNAUTHENTICATED,
          json: jest.fn().mockResolvedValue({}),
          text: jest.fn().mockResolvedValue(''),
        };

        fetch.mockResolvedValue(response);
      });

      it('should not fail if there is no handler', () => {
        expect(api.request('asf')).resolves.toBeNull();
      });

      it('should call handleUnauthorizedWith', async () => {
        api.handleUnauthorizedWith(authErrorHandler);

        expect(authErrorHandler).not.toHaveBeenCalled();

        await api.request('asf');

        expect(authErrorHandler).toHaveBeenCalled();
      });
    });
  });

  describe('specific request', () => {
    let request;

    beforeEach(() => {
      request = jest.spyOn(api, 'request');
      request.mockResolvedValue();
    });

    afterEach(() => {
      request.mockRestore();
    });

    describe('.updateTimeEntry', () => {
      let entry;
      beforeEach(async () => {
        entry = timeEntryBody({
          start: faker.date.past().toISOString(),
          stop: faker.date.future().toISOString(),
        });

        await api.updateTimeEntry(entry);
      });

      it('should make a put request to resource "time_entries/{id}"', () => {
        expect(request).toHaveBeenLastCalledWith(`time_entries/${entry.id}`, expect.objectContaining({method: 'PUT'}));
      });

      it('should entry with calculated duration to the body', () => {
        const secondsBetweenStartAndStop = parseInt((Date.parse(entry.stop) - Date.parse(entry.start)) / 1000, 10);

        expect(request).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({
          body: expect.objectContaining({
            duration: secondsBetweenStartAndStop,
            id: entry.id,
            description: entry.description,
          }),
        }));
      });
    });

    describe('.createTimeEntry', () => {
      let entry;
      beforeEach(async () => {
        entry = timeEntryBody({
          start: faker.date.past().toISOString(),
        });

        await api.createTimeEntry(entry);
      });

      it('should make a post request to resource "time_entries"', () => {
        expect(request).toHaveBeenLastCalledWith('time_entries', expect.any(Object));
      });

      it('should pass entry to the body with live duration from start time and created_with', () => {
        const liveDuration = parseInt(Date.parse(entry.start) / -1000, 10);

        expect(request).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({
            duration: liveDuration,
            id: entry.id,
            created_with: API_APP_REFERENCE,
          }),
        }));
      });
    });
    describe('.deleteTimeEntry', () => {
      it('should make a delete request to resource "time_entries/{id}"', async () => {
        const timeEntry = timeEntryBody();

        await api.deleteTimeEntry(timeEntry);

        expect(request).toHaveBeenCalledTimes(1);
        expect(request).toHaveBeenLastCalledWith(`time_entries/${timeEntry.id}`, {method: 'DELETE'});
      });
    });

    describe('.fetchProjects', () => {
      let projects;

      beforeEach(() => {
        projects = _.times(5, projectBody);
        request.mockResolvedValue(projects);
      });

      it('should make request to "me/projects" resource', async () => {
        await api.fetchProjects();

        expect(request).toHaveBeenCalledTimes(1);
        expect(request).toHaveBeenCalledWith('me/projects');
      });

      it('should return project list', async () => {
        expect(await api.fetchProjects()).toEqual(projects);
      });
    });

    describe('.fetchTimeEntries', () => {
      let entriesHistory;

      beforeEach(() => {
        entriesHistory = _.times(5, timeEntryBody);

        request.mockResolvedValue(entriesHistory);
      });

      it('should call request with me/time_entries', async () => {
        await api.fetchTimeEntries();

        expect(request).toHaveBeenLastCalledWith('me/time_entries');
      });

      it('should return entries history list', async () => {
        expect(await api.fetchTimeEntries()).toEqual(entriesHistory);
      });
    });

    describe('.fetchCurrentEntry', () => {
      let currentEntry;

      beforeEach(() => {
        currentEntry = timeEntryBody();

        request.mockReturnValueOnce(currentEntry);
      });

      it('should make request of resource "me/time_entries/current"', async () => {
        await api.fetchCurrentEntry();

        expect(request).toHaveBeenCalledTimes(1);
        expect(request).toHaveBeenCalledWith('me/time_entries/current');
      });

      it('should return entry', async () => {
        expect(await api.fetchCurrentEntry()).toEqual(currentEntry);
      });
    });

    describe('.fetchUserInfo', () => {
      let userInfo;

      beforeEach(() => {
        userInfo = {id: 14};

        request.mockReturnValueOnce(userInfo);
      });

      it('should return userInfo', async () => {
        expect(await api.fetchUserInfo()).toEqual(userInfo);
      });

      it('should make request to "me" resource', async () => {
        await api.fetchUserInfo();

        expect(request).toHaveBeenLastCalledWith('me');
      });
    });
  });
});
