import {memory} from 'system';

const showMemoryInfo = () => {
  const memoryInfo = {
    used: memory.js.used,
    total: memory.js.total,
    peak: memory.js.peak,
  };

  console.log(`Memory: ${JSON.stringify(memoryInfo)}`);
};
export {showMemoryInfo};
