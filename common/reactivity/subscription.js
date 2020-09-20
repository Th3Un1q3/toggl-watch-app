/**
 * Subscription object, helps to manage subscription
 */
export class Subscription {
  /**
   * Initializes a subscription dependencies
   * @param {EventSource} observable
   */
  constructor({ observable }) {
    this.observable = observable;
  }

  /**
   * Detaches subscription from subject
   */
  unsubscribe() {
    if (this.observable) {
      this.observable.unbind(this);
    }

    delete this.observable;
  }
}
