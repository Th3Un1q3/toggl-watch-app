export const changeView = (el, newView) => {
  if (el.value === newView) {
    return;
  }
  el.value = newView;
};
