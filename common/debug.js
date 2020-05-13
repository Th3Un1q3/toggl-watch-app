const debug = (...messages) => {
  false && console.log(JSON.stringify(messages));
};

export {
  debug,
};
