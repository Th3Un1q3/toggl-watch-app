const _ = jest.requireActual('lodash');

const {Tracking} = jest.genMockFromModule('../tracking');

Tracking.lastInstance = () => _.tap(_.last(Tracking.instances) || new Tracking(), (instance) => {
  if (instance.__manuallyPatched) {
    return;
  }

  let currentEntryChangeCallback;

  Object.assign(
      instance,
      {
        __manuallyPatched: true,
        _emitCurrentEntryChange() {
          currentEntryChangeCallback();
        },
        currentEntryChange: {
          subscribe(callback) {
            currentEntryChangeCallback = callback;
          },
        },
      });
});


export {
  Tracking,
};
