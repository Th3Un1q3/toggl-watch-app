import document from 'document';

const $ = (elementOrId) => {
  if (typeof elementOrId === 'string') {
    return document.getElementById(elementOrId);
  }
  return elementOrId;
};

const $do = (el, action, ...args) => {
  if (!$(el)) {
    return;
  }
  return action($(el), ...args);
};

export {
  $,
  $do,
};
