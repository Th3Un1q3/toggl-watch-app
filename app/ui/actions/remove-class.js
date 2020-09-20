const CLASS_SEPARATOR = ' ';
export const removeClass = (el, classToRemove) => {
  const currentClasses = (el.class || '').split(CLASS_SEPARATOR);
  if (currentClasses.includes(classToRemove)) {
    el.class = currentClasses.filter((existing) => existing !== classToRemove).join(CLASS_SEPARATOR);
  }
};
