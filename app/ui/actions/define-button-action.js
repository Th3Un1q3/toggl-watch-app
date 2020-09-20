import {show} from './show';
import {enableButton} from './enable-button';
import {$do} from '../lib/ui-action';

export const defineButtonAction = (el, action) => {
  el.onactivate = action;
  $do(el, show);
  $do(el, enableButton);
};
