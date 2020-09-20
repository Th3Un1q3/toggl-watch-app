import faker from 'faker';

import {Subject} from './subject';

describe('Subject', () => {
  const handler = jest.fn();
  let initialValue;

  beforeEach(() => {
    initialValue = {id: faker.random.number()};
  });

  it('should not be possible to subscribe without handler', () => {
    expect(() => new Subject(initialValue).subscribe()).toThrow(new Error('Provide handler function to .subscribe()'));
  });

  it('should only emit when value changed', () => {
    const subject = new Subject(initialValue, {changeOnly: true});
    subject.subscribe(handler);
    subject.next(initialValue);
    expect(handler).not.toHaveBeenCalled();
    subject.next({...initialValue, ch: 1});
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should support {immediate: true} as option for subscription', () => {
    const subject = new Subject(initialValue);
    const handler = jest.fn();
    expect(handler).not.toHaveBeenCalled();
    subject.subscribe(handler, {immediate: true});
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(initialValue);
  });
});
