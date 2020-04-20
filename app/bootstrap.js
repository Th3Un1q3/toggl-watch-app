import {initIncomingMessagesHandler} from './transmission';
import {enableLoader} from './ui';

export const bootstrap = () => {
  enableLoader();
  initIncomingMessagesHandler();
  console.log('App init');
};
