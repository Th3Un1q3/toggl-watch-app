import faker from 'faker';
import {timeEntryBody} from '../utils/factories/time-entries';
import {Tracking} from './tracking';
import {Transmitter} from '../common/transmitter';
import {MESSAGE_TYPE} from '../common/message-types';

jest.mock('../common/transmitter');

describe('Tracking on device', () => {
  let tracking;
  let transmitter;
  let currentEntry;
  let now;
  let changeSubscription;
  const entryUpdated = jest.fn();

  beforeEach(() => {
    now = faker.date.past().getTime();
    transmitter = new Transmitter();
    tracking = new Tracking({transmitter});
    changeSubscription = tracking.currentEntryChange.subscribe(entryUpdated);
    currentEntry = timeEntryBody();
    jest.spyOn(Date, 'now').mockReturnValue(now);
  });

  afterEach(() => {
    changeSubscription.unsubscribe();
  });

  it('should not emit initial update', () => {
    expect(entryUpdated).not.toHaveBeenCalled();
  });

  describe('.deleteCurrentEntry', () => {
    beforeEach(() => {
      tracking.currentEntryUpdated(currentEntry);
      tracking.deleteCurrentEntry();
    });

    it('should call transmitter.sendMessage with {id: currentEntry.id}', () => {
      expect(Transmitter.instanceSendMessage).toHaveBeenCalledTimes(1);
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        data: {
          id: currentEntry.id,
        },
      }));
    });

    it('should call transmitter.sendMessage with message.type:DELETE_CURRENT_ENTRY', () => {
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        type: MESSAGE_TYPE.DELETE_CURRENT_ENTRY,
      }));
    });

    it('should set current entry to null', () => {
      expect(entryUpdated).toHaveBeenCalledTimes(2);
      expect(tracking.currentEntry).toBeNull();
    });
  });

  describe('.resumeCurrentEntry', () => {
    beforeEach(() => {
      tracking.currentEntryUpdated(currentEntry);
      tracking.resumeCurrentEntry();
    });

    it('should call transmitter.sendMessage with currentEntry.id, start time as now', () => {
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        data: {
          id: currentEntry.id,
          start: now,
        },
      }));
    });

    it('should call transmitter.sendMessage with message.type:RESUME_LAST_ENTRY', () => {
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        type: MESSAGE_TYPE.RESUME_LAST_ENTRY,
      }));
    });

    it('should make refresh immediately with start time', () => {
      expect(entryUpdated).toHaveBeenCalledTimes(2);
      expect(tracking.currentEntry).toEqual(expect.objectContaining({
        start: now,
      }));
    });
  });

  describe('.stopCurrentEntry', () => {
    beforeEach(() => {
      tracking.currentEntryUpdated(currentEntry);
      tracking.stopCurrentEntry();
    });

    it('should call transmitter.sendMessage with {id: currentEntry.id, stop: now}', () => {
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        data: {
          id: currentEntry.id,
          stop: now,
        },
      }));
    });

    it('should call transmitter.sendMessage with message.type:STOP_CURRENT_ENTRY', () => {
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        type: MESSAGE_TYPE.STOP_CURRENT_ENTRY,
      }));
    });

    it('should make refresh immediately without start time', () => {
      expect(entryUpdated).toHaveBeenCalledTimes(2);
      expect(tracking.currentEntry).toEqual(expect.not.objectContaining({
        start: expect.anything(),
      }));
    });
  });

  describe('.currentEntryUpdated', () => {
    it('should emit currentEntryChange', () => {
      tracking.currentEntryUpdated(currentEntry);

      expect(entryUpdated).toHaveBeenCalledTimes(1);
      expect(entryUpdated).toHaveBeenLastCalledWith(currentEntry);
    });
  });
});
