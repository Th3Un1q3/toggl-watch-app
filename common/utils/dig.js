const pathSeparator = '.';
export const dig = (target, path, defaultValue) => {
  const segments = path.split(pathSeparator);
  return segments.reduce((current, segment) => current && current[segment], target) || defaultValue;
};
