const VIEW = Object.freeze({
  EntriesLog: 0,
  CurrentEntry: 1,
  ConfigurationRequired: 2,
});

const TEMPLATE = Object.freeze({
  [VIEW.CurrentEntry]: './resources/views/current-entry.gui',
  [VIEW.EntriesLog]: './resources/views/entries-log.gui',
  [VIEW.ConfigurationRequired]: './resources/views/configuration-required.gui',
  _default: './resources/index.gui',
});

export {VIEW, TEMPLATE};
