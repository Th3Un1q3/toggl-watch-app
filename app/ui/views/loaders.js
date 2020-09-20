import { VIEW } from './index';

const VIEW_LOADER = {
  [VIEW.CurrentEntry]: async () => (await import('./current-entry.view')).CurrentEntry,
  [VIEW.EntriesLog]: async () => (await import('./entries-log.view')).EntriesLog,
  _default: async () => (await import('./uncontrolled.view')).UncontrolledView,
}

const getControllerForView = (view) => {
  return (VIEW_LOADER[view] || VIEW_LOADER._default)()
}

export {getControllerForView};
