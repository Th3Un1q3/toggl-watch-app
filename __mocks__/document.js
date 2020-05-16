/**
 This is mock for https://dev.fitbit.com/build/reference/device-api/document/
 It should represent structure similar to /resources/index.gui
 */

import {JSDOM} from 'jsdom';

const ASSUMED_BODY = `
<div id="current-entry" style="display: none">
    <div id="current-entry-project" style="fill: white"></div>
    <div id="current-entry-description"></div>
    <div>
        <div id="current-entry-timer-hours"></div>
        <div id="current-entry-timer-minutes"></div>
        <div class="some" id="current-entry-timer-seconds"></div>
    </div>
</div>
<div id="loader">loader</div>
<div id="configuration-instruction" style="display: none">content</div>
`;

const dom = new JSDOM(`<body>
  ${ASSUMED_BODY}
</body>`);

const {document} = dom.window;

document._reset = () => {
  document.body.innerHTML = ASSUMED_BODY;
};

export default document;
