import {debug} from '../common/debug';

export const HTTP_STATUS = Object.freeze({
  UNAUTHENTICATED: 403,
});

const BASE_API_URL = 'https://www.toggl.com/api/v9';

const API_APP_REFERENCE = 'https://github.com/Th3Un1q3/toggl-watch-app';

const excludeReadOnlyFields = ({tag_ids: _tids, ...entry}) => entry;

/**
 * API client which manages communication with backend
 * https://github.com/toggl/toggl_api_docs/blob/master/toggl_api.md
 */
class API {
  /**
   * API client constructor
   * @param {string} token
   */
  constructor({token} = {}) {
    this.updateToken(token);
  }

  /**
   * Makes auth header required to authorize user
   * @return {string}
   * @private
   */
  get _authorizationHeaderValue() {
    return ['Basic', btoa(`${this._token}:api_token`)].join(' ');
  }

  /**
   * Returns headers for requests to backend
   * @return {Headers}
   * @private
   */
  get _headers() {
    const headers = new Headers({});

    headers.append('Authorization', this._authorizationHeaderValue);

    return headers;
  }

  /**
   * Updates a token used for communication with api
   * @param {string} token
   */
  updateToken(token) {
    this._token = token;
  }

  /**
   * Manages all kind of requests to backend
   * @param {string} uri
   * @param {Object} options
   * @return {Promise<Object>} response body
   */
  async request(uri, {body, method = 'GET'} = {}) {
    const requestUrl = [BASE_API_URL, uri].join('/');

    debug('request started', requestUrl, {headers: this._headers});

    const response = await fetch(requestUrl, {body: JSON.stringify(body), method, headers: this._headers});

    if (response.ok) {
      const resp = await response.json();
      debug('response received', requestUrl, resp);
      return resp;
    }

    debug('request error', requestUrl, {status: response.status, err: await response.text()});

    if (response.status === HTTP_STATUS.UNAUTHENTICATED && this._unauthenticatedHandler) {
      this._unauthenticatedHandler();
    }

    return null;
  }

  /**
   * Assign unauthenticated handler
   * @param {function} handler
   * @return {API}
   */
  handleUnauthorizedWith(handler) {
    this._unauthenticatedHandler = handler;
    return this;
  }

  /**
   * Returns time entries list
   * @return {Promise<Object>}
   */
  async fetchTimeEntries() {
    return await this.request('me/time_entries');
  }

  /**
   * Updates time entry on backend
   * @param {Object} entry
   * @return {Promise<Object>}
   */
  updateTimeEntry(entry) {
    const duration = parseInt((Date.parse(entry.stop) - Date.parse(entry.start)) / 1000, 10);
    const body = excludeReadOnlyFields({
      ...entry,
      duration,
    });

    return this.request(`time_entries/${entry.id}`, {method: 'PUT', body});
  }

  /**
   * Publish a new entry on backend
   * @param {Object} entry
   * @return {Promise<Object>}
   */
  createTimeEntry(entry) {
    const duration = parseInt(Date.parse(entry.start) / -1000, 10);
    const body = excludeReadOnlyFields({
      ...entry,
      duration,
      created_with: API_APP_REFERENCE,
    });

    return this.request(`time_entries`, {method: 'POST', body});
  }

  /**
   * Makes a request to delete provided time entry
   * @param {Object} entry
   * @return {Promise<Object>}
   */
  deleteTimeEntry(entry) {
    return this.request(`time_entries/${entry.id}`, {method: 'DELETE'});
  }

  /**
   * Returns current user info
   * @return {Promise<Object>}
   */
  async fetchUserInfo() {
    return await this.request('me');
  }

  /**
   * Fetches info about currently ran time entry
   * @return {Promise<Object>}
   */
  async fetchCurrentEntry() {
    return await this.request('me/time_entries/current');
  }

  /**
   * Fetches list of projects of current user
   * @return {Promise<Array>}
   */
  async fetchProjects() {
    return await this.request('me/projects');
  }
}

export {
  API,
  API_APP_REFERENCE,
};
