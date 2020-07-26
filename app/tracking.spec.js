import faker from 'faker';
import _ from 'lodash';

import {timeEntryBody} from '../utils/factories/time-entries';
import {Tracking} from './tracking';
import {Transmitter} from '../common/transmitter';
import {MESSAGE_TYPE} from '../common/message-types';
import {timeEntryDetails} from '../companion/tracking';

jest.mock('../common/transmitter');

describe('Tracking on device', () => {
  let tracking;
  let transmitter;
  let currentEntry;
  let now;
  const subscriptions = [];
  const entriesLogUpdated = jest.fn();
  const entryUpdated = jest.fn();

  beforeEach(() => {
    now = faker.date.past().getTime();
    transmitter = new Transmitter();
    tracking = new Tracking({transmitter});
    subscriptions.push(tracking.currentEntrySubject.subscribe(entryUpdated));
    subscriptions.push(tracking.entriesLogSubject.subscribe(entriesLogUpdated));
    currentEntry = timeEntryBody();
    jest.spyOn(Date, 'now').mockReturnValue(now);
  });

  afterEach(() => {
    (subscriptions || []).map((s) => s.unsubscribe());
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

    it('should call transmitter.sendMessage with message.type:DELETE_TIME_ENTRY', () => {
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        type: MESSAGE_TYPE.DELETE_TIME_ENTRY,
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

    it('should call transmitter.sendMessage with message.type:START_TIME_ENTRY', () => {
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        type: MESSAGE_TYPE.START_TIME_ENTRY,
      }));
    });

    it('should make refresh immediately with start time', () => {
      expect(entryUpdated).toHaveBeenCalledTimes(2);
      expect(tracking.currentEntry).toEqual(expect.objectContaining({
        start: now,
        isPlaying: true,
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

    it('should call transmitter.sendMessage with message.type:STOP_TIME_ENTRY', () => {
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        type: MESSAGE_TYPE.STOP_TIME_ENTRY,
      }));
    });

    it('should make refresh immediately without start time', () => {
      expect(entryUpdated).toHaveBeenCalledTimes(2);
      expect(tracking.currentEntry).toEqual(expect.objectContaining({
        isPlaying: false,
      }));
    });
  });

  describe('when message with type ENTRIES_LOG_UPDATE received', () => {
    let logOverview;

    const triggerMessageReceived = (data) => {
      Transmitter.emitMessageReceived(MESSAGE_TYPE.ENTRIES_LOG_UPDATE, data);
    };

    beforeEach(() => {
      logOverview = _.times(10, faker.random.number);
    });

    it('should emit log update', () => {
      expect(entriesLogUpdated).not.toHaveBeenCalled();
      triggerMessageReceived(logOverview);

      expect(entriesLogUpdated).toHaveBeenCalledWith(logOverview);
      expect(entriesLogUpdated).toHaveBeenCalledTimes(1);
    });
  });

  describe('when message with type TIME_ENTRY_DETAILS received', () => {
    let currentEntry;

    const triggerMessageReceived = (data) => {
      Transmitter.emitMessageReceived(MESSAGE_TYPE.TIME_ENTRY_DETAILS, data);
    };

    beforeEach(() => {
      currentEntry = {...timeEntryDetails(timeEntryBody()), cur: true};
    });

    it('should emit currentEntryChange', () => {
      triggerMessageReceived(currentEntry);

      expect(entryUpdated).toHaveBeenCalledTimes(1);
      expect(entryUpdated).toHaveBeenLastCalledWith(currentEntry);
    });

    describe('when it\'s not current entry received', () => {
      beforeEach(() => {
        currentEntry = {...timeEntryDetails(timeEntryBody()), cur: false};
      });

      it('should not update current entry', () => {
        triggerMessageReceived(currentEntry);

        expect(entryUpdated).not.toHaveBeenCalled();
      });
    });
  });
});
