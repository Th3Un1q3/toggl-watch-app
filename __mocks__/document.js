/**
 This is mock for https://dev.fitbit.com/build/reference/device-api/document/
 It should represent structure similar to /resources/index.gui
 */

import {JSDOM} from 'jsdom';
import {TEMPLATE, VIEW} from '../app/ui/views';

const loaderWithId = (id) => `
<div id="${id}" style="display: inline">
    <div id="rotation">loader</div>
</div>
`;

const INDEX = `
${loaderWithId('loader')}
`;

const CONFIGURATION_REQUIRED = `
<div id="configuration-instruction" style="display: none">content</div>
`;

const CURRENT_ENTRY = `
<div id="view-switch">
  <div id="time-entries-list-container">
      Time entries log
  </div>
  <div id="current-entry">
      <div id="current-entry-project" style="fill: white"></div>
      <div id="current-entry-description"></div>
      <div>
          <div id="current-entry-timer-hours"></div>
          <div id="current-entry-timer-minutes"></div>
          <div id="current-entry-timer-seconds"></div>
          <button id="delete-button" style="display: none">
              <image id="combo-button-icon" href="delete.png"></image>
              <image id="combo-button-icon-press" href="delete.png"></image>
          </button>
          <button id="stop-resume-button" style="display: inline">
              <image id="combo-button-icon" href="delete.png"></image>
              <image id="combo-button-icon-press" href="delete.png"></image>
          </button>
      </div>
  </div>
</div>
${loaderWithId('loader')}
`;

const ENTRIES_LOG = `
<div id="view-switch">
  <div id="time-entries-list-container">
      <div id="time-entry[1]" class="time-entry-list__item">
          <div id="wrapper" class="item-wrapper item-wrapper--hidden">
              <div id="background" class="item__background" />
              <span id="description" class="item__description">-----------------------------</span>
              <span id="project" class="item__project">------------------------------------</span>
              <span id="billable" class="item__billing item__billing--billable">$</span>
              <span id="duration" class="item__duration">00:33</span>
          </div>
      </div>
  </div>
  <div id="current-entry">
      Current entry
  </div>
</div>
`;

const VIEW_TEMPLATE = {
  [TEMPLATE._default]: INDEX,
  [TEMPLATE[VIEW.ConfigurationRequired]]: CONFIGURATION_REQUIRED,
  [TEMPLATE[VIEW.EntriesLog]]: ENTRIES_LOG,
  [TEMPLATE[VIEW.CurrentEntry]]: CURRENT_ENTRY,
};

const dom = new JSDOM(`<body>
  ${INDEX}
</body>`);

const {document: fakeDocument} = dom.window;

const attachDeviceDOMNodeCustomBehavior = (node) => {
  Object.defineProperties(node, {
    class: {
      get() {
        return this.getAttribute('class');
      },
      set(v) {
        this.setAttribute('class', v);
      },
      configurable: true,
    },
    getElementById: {
      value: function(id) {
        return this.querySelector(`#${id}`);
      },
      configurable: true,
    },
  });
};

const attachDeviceButtonHandlers = (button) => {
  Object.assign(button, {
    enabled: true,
    onclick() {
      if (button.enabled && button.onactivate) {
        button.onactivate();
      }
    },
  });
};

fakeDocument._window = dom.window;

fakeDocument._reset = (pathName = TEMPLATE._default) => {
  fakeDocument.body.innerHTML = VIEW_TEMPLATE[pathName];
  Object.defineProperty(fakeDocument, 'replaceSync', {
    value: jest.fn(),
    configurable: true,
  });
  Array.from(fakeDocument.querySelectorAll('*')).forEach(attachDeviceDOMNodeCustomBehavior);
  Array.from(fakeDocument.getElementsByTagName('button')).forEach(attachDeviceButtonHandlers);
};

fakeDocument._reset();

export default fakeDocument;
