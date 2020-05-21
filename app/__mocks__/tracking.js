const _ = jest.requireActual('lodash');

const {Tracking} = jest.genMockFromModule('../tracking');

Tracking.lastInstance = () => _.last(Tracking.instances);

export {
  Tracking,
};
