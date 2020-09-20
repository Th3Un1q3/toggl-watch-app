import {$do} from '../lib/ui-action';
import {hide} from './hide';

export const disableButton = (el) => {
  el.enabled = false;
  $do(el, hide);
};
