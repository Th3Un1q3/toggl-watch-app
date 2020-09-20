const CLASS_SEPARATOR = ' ';

export const addClass = (el, classToAdd) => {
  const classList = (el.class || '').split(CLASS_SEPARATOR);
  if (classList.includes(classToAdd)) {
    return;
  }
  el.class = classList.concat(classToAdd).join(CLASS_SEPARATOR);
};
