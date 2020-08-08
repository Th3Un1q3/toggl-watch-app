const defaultCompare = (value1, value2) => {
  return value1 && (value1 === value2 || JSON.stringify(value1) === JSON.stringify(value2));
};

/**
 * Subscription object, helps to manage subscription
 */
class Subscription {
  /**
   * Initializes a subscription dependencies
   * @param {Subject} observable
   */
  constructor({observable}) {
    this.observable = observable;
  }

  /**
   * Detaches subscription from subject
   */
  unsubscribe() {
    this.observable.unbind(this);
  }
}

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
    this.value = value;
    this.isMatch = (changeOnly && defaultCompare) || (() => false);
    if (typeof changeOnly === 'function') {
      this.isMatch = changeOnly;
    }
    this._subscriptions = [];
  }

  /**
   * Returns a list of helpers
   * @return {*[]}
   */
  get handlers() {
    return this._subscriptions.map(([_subscription, handler]) => handler);
  }

  /**
   * indicates if there is any subscriptions to subject
   * @return {boolean}
   */
  get hasSubscriptions() {
    return !!this._subscriptions.length;
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
    this._dispatchAllHandlers();
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

    const subscription = new Subscription({observable: this});
    this._subscriptions.push([subscription, handler]);

    if (immediate) {
      this.dispatchHandler(handler);
    }

    return subscription;
  }

  /**
   * Dispatches current value to handler
   * @param {function} handler
   */
  dispatchHandler(handler) {
    handler(this.value);
  }

  /**
   * Removes subscription from a subject
   * @param {Subscription} subscription - to be removed subscription
   */
  unbind(subscription) {
    this._subscriptions = this._subscriptions.filter(([s]) => s !== subscription);
  }

  /**
   * Dispatches current value to subscribers
   * @private
   */
  _dispatchAllHandlers() {
    this.handlers.forEach(this.dispatchHandler.bind(this));
  }
}

export {
  Subject,
};
