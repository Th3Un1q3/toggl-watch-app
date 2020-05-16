import {initIncomingMessagesHandler} from './transmission';
import {enableLoader} from './ui';
import {memory} from 'system';

export const bootstrap = () => {
  enableLoader();
  initIncomingMessagesHandler();
  memory.monitor.onmemorypressurechange = () => {
    const memoryInfo = {
      used: memory.js.used,
      total: memory.js.total,
      peak: memory.js.peak,
    };

    console.log(`Memory: ${JSON.stringify(memoryInfo)}`);
  };
  console.log('App init');
};
