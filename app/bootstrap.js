import {initIncomingMessagesHandler} from './transmission';
import {enableLoader} from './ui';
import {memory} from 'system';
import {DEVICE_QUEUE_SIZE, Transmitter} from '../common/transmitter';
import {Tracking} from './tracking';

const displayMemoryStatus = () => {
  const memoryInfo = {
    used: memory.js.used,
    total: memory.js.total,
    peak: memory.js.peak,
  };

  console.log(`Memory: ${JSON.stringify(memoryInfo)}`);
};

export const bootstrap = () => {
  const transmitter = new Transmitter({queueSize: DEVICE_QUEUE_SIZE});
  const tracking = new Tracking({transmitter});
  enableLoader();
  initIncomingMessagesHandler({transmitter, tracking});
  memory.monitor.onmemorypressurechange = displayMemoryStatus;
  console.log('App init');
  displayMemoryStatus();
};
