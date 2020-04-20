/**
 This is mock for https://dev.fitbit.com/build/reference/device-api/document/
 It should represent structure similar to /resources/index.gui
 */

import {JSDOM} from 'jsdom';

const ASSUMED_BODY = `
<div id="auth_token_info" style="display: none">content</div>
<div id="loader">loader</div>
`;

const dom = new JSDOM(`<body>
  ${ASSUMED_BODY}
</body>`);

const {document} = dom.window;

document._reset = () => {
  document.body.innerHTML = ASSUMED_BODY;
};

export default document;
