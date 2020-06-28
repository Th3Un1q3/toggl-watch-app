/**
 This is mock for https://dev.fitbit.com/build/reference/device-api/document/
 It should represent structure similar to /resources/index.gui
 */

import {JSDOM} from 'jsdom';

const ASSUMED_BODY = `
<div id="current-entry">
    <div id="current-entry-project" style="fill: white"></div>
    <div id="current-entry-description"></div>
    <div>
        <div class="current-entry__time--active" id="current-entry-timer-hours"></div>
        <div class="some" id="current-entry-timer-minutes"></div>
        <div class="some" id="current-entry-timer-seconds"></div>
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
<div id="loader-container" style="display: none">
    <div id="loader">loader</div>
</div>
<div id="configuration-instruction" style="display: none">content</div>
`;

const dom = new JSDOM(`<body>
  ${ASSUMED_BODY}
</body>`);

const {document: fakeDocument} = dom.window;

const attachDeviceButtonHandlers = (button) => {
  Object.assign(button, {
    enabled: true,
    onclick() {
      if (button.enabled && button.onactivate) {
        button.onactivate();
      }
    },
    getElementById(id) {
      return button.querySelector(`#${id}`);
    },
  });
};

fakeDocument._reset = () => {
  fakeDocument.body.innerHTML = ASSUMED_BODY;
  Array.from(fakeDocument.getElementsByTagName('button')).forEach(attachDeviceButtonHandlers);
};

export default fakeDocument;
