import {debug} from '../common/debug';

export const HTTP_STATUS = Object.freeze({
  UNAUTHENTICATED: 403,
});

const BASE_API_URL = 'https://www.toggl.com/api/v9';

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
   * @return {Promise<Object>} response body
   */
  async request(uri) {
    const requestUrl = [BASE_API_URL, uri].join('/');

    const response = await fetch(requestUrl, {headers: this._headers});

    if (response.ok) {
      const resp = await response.json();
      debug(resp); // TODO: remove debugger
      return resp;
    }

    debug('request error', {status: response.status});

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
};
