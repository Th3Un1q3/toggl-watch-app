let afterDebugCb = () => {};

const afterDebug = (cb) => {
  afterDebugCb = cb;
};

const debug = (...messages) => {
  console.log(JSON.stringify(messages));
  afterDebugCb();
};

export {
  debug,
  afterDebug,
};
