import {Subscription} from './subscription';

/**
 * Produces events
 */
class EventSource { // TODO: move to its own file
  /**
   * Defines initials
   */
  constructor() {
    this._subscriptions = [];
  }

  /**
   * Creates a new subscription
   * @param {function} handler
   * @return {Subscription}
   */
  subscribe(handler = null) {
    if (!handler) {
      throw new Error('Provide handler function to .subscribe()');
    }

    const subscription = new Subscription({observable: this});
    this._subscriptions.push([subscription, handler]);

    return subscription;
  }

  /**
   * Returns a list of handlers
   * @return {*[]}
   */
  get handlers() {
    return this._subscriptions.map(([_subscription, handler]) => handler);
  }

  /**
   * Emits event with value
   * @param {*} value?
   */
  next(value) {
    this._dispatchAllHandlers(value);
  }

  /**
   * Dispatches current value to handler
   * @param {function} handler
   * @param {*} value
   */
  dispatchHandler(handler, value) {
    handler(value);
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
   * @param {*} value
   * @private
   */
  _dispatchAllHandlers(value) {
    this.handlers.forEach((handler) => this.dispatchHandler(handler, value));
  }
}

export {EventSource};
