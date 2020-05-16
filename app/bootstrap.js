import {initIncomingMessagesHandler} from './transmission';
import {enableLoader} from './ui';
import {memory} from 'system';

const displayMemoryStatus = () => {
  const memoryInfo = {
    used: memory.js.used,
    total: memory.js.total,
    peak: memory.js.peak,
  };

  console.log(`Memory: ${JSON.stringify(memoryInfo)}`);
};

export const bootstrap = () => {
  enableLoader();
  initIncomingMessagesHandler();
  memory.monitor.onmemorypressurechange = displayMemoryStatus;
  console.log('App init');
  displayMemoryStatus();
};
