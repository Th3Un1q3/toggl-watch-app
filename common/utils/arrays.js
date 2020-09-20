const without = (...arrays) => {
  return arrays.slice(1).reduce((result, array) => result.filter((item) => array.indexOf(item) === -1), arrays[0]);
};

const intersection = (...arrays) => {
  return arrays.slice(1).reduce((result, array) => result.filter((item) => array.indexOf(item) !== -1), arrays[0]);
};

export {without, intersection};
