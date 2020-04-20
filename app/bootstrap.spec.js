import {bootstrap} from './bootstrap';
import {initIncomingMessagesHandler} from './transmission';
import {enableLoader} from './ui';

jest.mock('./ui');

jest.mock('./transmission');

describe('App bootstrap', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  it('should enable loader on start', () => {
    expect(enableLoader).not.toHaveBeenCalled();
    bootstrap();
    expect(enableLoader).toHaveBeenCalledTimes(1);
  });

  it('should subscribe on messages', () => {
    expect(initIncomingMessagesHandler).not.toHaveBeenCalled();
    bootstrap();

    expect(initIncomingMessagesHandler).toHaveBeenCalledTimes(1);
  });

  it('should console log on launch', () => {
    expect(bootstrap).toEqual(expect.any(Function));

    expect(console.log).not.toHaveBeenCalled();

    bootstrap();

    expect(console.log).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('App init');
  });
});
