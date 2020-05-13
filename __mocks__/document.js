/**
 This is mock for https://dev.fitbit.com/build/reference/device-api/document/
 It should represent structure similar to /resources/index.gui
 */

import {JSDOM} from 'jsdom';

const ASSUMED_BODY = `
<div id="current_entry" style="display: none">
    <div id="current_entry_project" style="fill: white"></div>
    <div id="current_entry_description"></div>
    <div>
        <div id="current_entry_time_hours"></div>
        <div id="current_entry_time_minutes"></div>
        <div id="current_entry_time_seconds"></div>
    </div>
</div>
<div id="loader">loader</div>
<div id="auth_token_info" style="display: none">content</div>
`;

const dom = new JSDOM(`<body>
  ${ASSUMED_BODY}
</body>`);

const {document} = dom.window;

document._reset = () => {
  document.body.innerHTML = ASSUMED_BODY;
};

export default document;
