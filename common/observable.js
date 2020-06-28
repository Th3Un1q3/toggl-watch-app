// TODO: fix linter here
class Subscription {
  constructor({observable}) {
    this.observable = observable;
  }

  unsubscribe() {
    this.observable.unbind(this);
  }
}

class Subject {
  constructor(value) {
    this.value = value;
    this._subscriptions = [];
  }

  next(newValue) {
    this.value = newValue;
    this.handlers.forEach((handler) => handler(this.value));
  }

  // TODO: test for non handler
  subscribe(handler = () => {}) {
    const subscription = new Subscription({observable: this});
    this._subscriptions.push([subscription, handler]);
    return subscription;
  }

  unbind(subscription) {
    this._subscriptions = this._subscriptions.filter(([s]) => s !== subscription);
  }

  get hasSubscriptions() {
    return !!this._subscriptions.length;
  }

  get handlers() {
    return this._subscriptions.map(([_subscription, handler]) => handler);
  }
}

export {
  Subject,
};
