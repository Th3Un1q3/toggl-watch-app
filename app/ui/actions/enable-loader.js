import {$, $do} from '../lib/ui-action';
import {EID} from '../selectors';
import {setState} from './set-state';
import {show} from './show';

const SPINNER_ENABLED = 'enabled';

export const enableLoader = (loaderId) => {
  $do(loaderId, show);
  $do($(loaderId).getElementById(EID.LoaderRotation), setState, SPINNER_ENABLED);
};
