/**
 * Mock implements used functions of settings SDK https://dev.fitbit.com/build/reference/companion-api/live-storage/
 */
class SettingsMock {
  /**
   * Set initial settings state
   */
  constructor() {
    this._onchangeHandler = null;
    this._state = new Map();
  }

  /**
   * Removes all key-value pairs from the state Map.
   */
  clear() {
    this._state.clear();
  }

  /**
   * Sets the value for the key in the state object. Returns the state object.
   * @param {any} key
   * @param {any} value
   */
  setItem(key, value) {
    this._state.set(key, value);
  }

  /**
   * Returns value from state by provided key
   * @param {any} key
   * @return {any} item
   */
  getItem(key) {
    return this._state.get(key);
  }

  /**
   * Removes value from state by provided key
   * @param {any} key
   */
  removeItem(key) {
    this._state.delete(key);
  }

  /**
   * Sets a handler for settings change event
   * @param {function} callback
   */
  set onchange(callback) {
    this._onchangeHandler = callback;
  }
}

let settingsStorage;

const _resetSettings = () => {
  settingsStorage = new SettingsMock();
};

_resetSettings();


export {
  settingsStorage,
  _resetSettings,
};
