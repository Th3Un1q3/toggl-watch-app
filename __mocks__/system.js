/**
 * Implementation of mock for System API https://dev.fitbit.com/build/reference/device-api/system/
 */

/**
 * Class is responsible for monitoring
 * https://dev.fitbit.com/build/reference/device-api/system/#interface-memorypressuremonitor
 */
class MemoryMonitorMock {
  /**
   * Monitor constructor
   */
  constructor() {
    this._onmemorypressurechangeHandler = null;
    this._pressure = 'normal';
  }

  /**
   * Attach a handler for memory pressure change event.
   * @param {function} callback
   */
  set onmemorypressurechange(callback) {
    this._onmemorypressurechangeHandler = callback;
  }

  /**
   * Returns current memory pressure
   * @return {string}
   */
  get pressure() {
    return this._pressure;
  }
}

/**
 * Memory object mock
 */
class MemoryMock {
  /**
   * constructor
   */
  constructor() {
    this._jsInfo = {
      used: 2,
      total: 1,
      peak: 5,
    };
    this.monitor = new MemoryMonitorMock();
  }


  /**
   * Returns memory consumption stats
   * @return {{total: number, used: number, peak: number}} stats
   */
  get js() {
    return this._jsInfo;
  }
}

let memory;

const _resetSystem = () => {
  memory = new MemoryMock();
};

_resetSystem();

export {
  memory,
  _resetSystem,
};
