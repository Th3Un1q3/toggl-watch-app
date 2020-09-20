import {EventSource} from './event-source';

const defaultCompare = (value1, value2) => {
  return value1 && (value1 === value2 || JSON.stringify(value1) === JSON.stringify(value2));
};

/**
 * Subject of the observation
 */
class Subject {
  /**
   * Makes an subject to observe
   * @param {*} value - initial value
   * @param {boolean|function} changeOnly - Defines if only dispatch a change if the value is changed
   */
  constructor(value, {changeOnly = false} = {}) {
    this._eventSource = new EventSource();
    this.value = value;
    this.isMatch = (changeOnly && defaultCompare) || (() => false);
    if (typeof changeOnly === 'function') {
      this.isMatch = changeOnly;
    }
  }

  /**
   * Returns current subject value
   * @return {*}
   */
  get value() {
    return this._value;
  }

  /**
   * Updates current value
   * @param {*} newValue
   */
  set value(newValue) {
    this._value = newValue;
  }

  /**
   * Emits a change
   * @param {*} newValue
   */
  next(newValue) {
    if (this.isMatch(this.value, newValue)) {
      return;
    }

    this.value = newValue;
    this._eventSource.next(this.value);
  }

  /**
   * Creates a new subscription
   * @param {function} handler
   * @param {boolean} immediate
   * @return {Subscription}
   */
  subscribe(handler = null, {immediate = false} = {}) {
    if (!handler) {
      throw new Error('Provide handler function to .subscribe()');
    }
    const subscription = this._eventSource.subscribe(handler);

    if (immediate) {
      this._eventSource.dispatchHandler(handler, this.value);
    }

    return subscription;
  }
}

export {Subject};
