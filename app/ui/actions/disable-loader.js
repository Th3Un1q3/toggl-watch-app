import {$do} from '../lib/ui-action';
import {hide} from './hide';

export const disableLoader = (loaderId) => {
  $do(loaderId, hide);
};
