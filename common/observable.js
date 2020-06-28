/**
 * Subscription object
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
 * Subject of observation
 */
class Subject {
  /**
   * Makes an subject to observe
   * @param {*} value - initial value
   */
  constructor(value, {changeOnly = false} = {}) {
    this.value = value;
    this._changeOnly = changeOnly;
    this._subscriptions = [];
  }

  /**
   * Emits a change
   * @param {*} newValue
   */
  next(newValue) {
    const changed = this.value !== newValue;
    if (this._changeOnly && !changed) {
      return;
    }

    this.value = newValue;
    this._dispatchHandlers();
  }

  /**
   * Dispatches current value to subscribers
   * @private
   */
  _dispatchHandlers() {
    this.handlers.forEach(this.dispatchHandler.bind(this));
  }

  // TODO: test for non handler
  /**
   * Creates a new subscription
   * @param {function} handler
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
   * indicates if there is any subscriptions to subject
   * @return {boolean}
   */
  get hasSubscriptions() {
    return !!this._subscriptions.length;
  }

  /**
   * Returns a list of helpers
   * @return {*[]}
   */
  get handlers() {
    return this._subscriptions.map(([_subscription, handler]) => handler);
  }
}

export {
  Subject,
};
