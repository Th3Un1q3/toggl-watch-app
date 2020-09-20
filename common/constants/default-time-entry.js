import {gettext} from 'i18n';

/**
 * Time entry message.
 * @typedef {Object} TimeEntryMessage
 * @property {number} id - Id of time entry
 * @property {boolean} cur - Indicates whether this is a current time entry.
 * @property {boolean} isPlaying - Indicates that transferred entry is now launched.
 * @property {boolean} bil - Indicates if time entry is billable.
 * @property {string} color - The hex-color of the project.
 * @property {number} start - Time stamp of entry start(ms, unix).
 * @property {string} projectName - The name of the project time entry attached to.
 * @property {string} desc - Description of time entry to be displayed(up to 64 char).
 */

const NO_PROJECT_COLOR = '#a0a0a0';

const NO_PROJECT_INFO = {
  color: NO_PROJECT_COLOR,
  projectName: gettext('no_project'),
};

const EMPTY_TIME_ENTRY = Object.assign(
    {
      desc: gettext('no_description'),
      bil: false,
    },
    NO_PROJECT_INFO,
);

export {NO_PROJECT_INFO, NO_PROJECT_COLOR, EMPTY_TIME_ENTRY};
