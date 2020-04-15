import { bootstrap } from './bootstrap';

describe('App bootstrap', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  it('should console log on launch', () => {
    expect(bootstrap).toEqual(expect.any(Function));

    expect(console.log).not.toHaveBeenCalled();

    bootstrap();

    expect(console.log).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('App init')
  })
});
