import _ from 'lodash';
import {API, HTTP_STATUS} from './api';
import {timeEntryBody} from '../utils/factories/time-entries';
import {projectBody} from '../utils/factories/projects';

describe('API', () => {
  let api;

  const mockSuccessResponse = (body) => {
    const response = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(body),
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
    });

    afterEach(() => {
      request.mockRestore();
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
