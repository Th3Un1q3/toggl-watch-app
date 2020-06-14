import _ from 'lodash';
import faker from 'faker';
import {
  disableCurrentEntryDeletion,
  enableCurrentEntryDeletion,
  enableCurrentEntryPausing, enableCurrentEntryResuming, enableLoader,
  showCurrentEntry,
} from './ui';
import {timeEntryBody} from '../utils/factories/time-entries';
import {Tracking, TIMER_UPDATE_INTERVAL_MS} from './tracking';
import {Transmitter} from '../common/transmitter';
import {MESSAGE_TYPE} from '../common/message-types';

jest.mock('./ui');
jest.mock('../common/transmitter');

describe('Tracking on device', () => {
  let tracking;
  let transmitter;
  let currentEntry;
  let now;

  beforeEach(() => {
    now = faker.date.past().getTime();
    transmitter = new Transmitter();
    tracking = new Tracking({transmitter});
    currentEntry = timeEntryBody();
    jest.spyOn(Date, 'now').mockReturnValue(now);
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

    it('should stop refresh of current entry', () => {
      expect(showCurrentEntry).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(TIMER_UPDATE_INTERVAL_MS * 5);

      expect(showCurrentEntry).toHaveBeenCalledTimes(1);
    });

    it('should enableLoader', () => {
      expect(enableLoader).toHaveBeenCalledTimes(1);
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
      expect(showCurrentEntry).toHaveBeenCalledTimes(2);
      expect(showCurrentEntry).toHaveBeenLastCalledWith(expect.objectContaining({
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
      expect(showCurrentEntry).toHaveBeenCalledTimes(2);
      expect(showCurrentEntry).toHaveBeenLastCalledWith(expect.not.objectContaining({
        start: expect.anything(),
      }));
    });
  });

  describe('.currentEntryUpdated', () => {
    it.todo('should emit currentEntryChange');

    it('should call show current entry instantly', () => {
      tracking.currentEntryUpdated(currentEntry);

      expect(showCurrentEntry).toHaveBeenCalledTimes(1);
      expect(showCurrentEntry).toHaveBeenLastCalledWith(currentEntry);
    });

    it('should call show current entry every second since then', () => {
      tracking.currentEntryUpdated(currentEntry);
      jest.advanceTimersByTime(TIMER_UPDATE_INTERVAL_MS);

      expect(showCurrentEntry).toHaveBeenCalledTimes(2);
      expect(showCurrentEntry).toHaveBeenLastCalledWith(currentEntry);

      showCurrentEntry.mockClear();

      const newEntry = timeEntryBody();
      tracking.currentEntryUpdated(newEntry);

      jest.advanceTimersByTime(TIMER_UPDATE_INTERVAL_MS*5);
      expect(showCurrentEntry).toHaveBeenLastCalledWith(newEntry);
      expect(showCurrentEntry).not.toHaveBeenCalledWith(currentEntry);
    });

    test('none of ui functions is called initially', () => {
      expect(enableCurrentEntryPausing).not.toHaveBeenCalled();
      expect(showCurrentEntry).not.toHaveBeenCalled();
      expect(disableCurrentEntryDeletion).not.toHaveBeenCalled();
      expect(enableCurrentEntryResuming).not.toHaveBeenCalled();
    });

    describe('when entry is playing', () => {
      beforeEach(() => {
        tracking.currentEntryUpdated(currentEntry);
      });

      it('should call ui.enableCurrentEntryPausing with tracking instance', () => {
        expect(enableCurrentEntryPausing).toHaveBeenLastCalledWith(tracking);
      });

      it('should call ui.enableCurrentEntryDeletion with tracking instance', () => {
        expect(enableCurrentEntryDeletion).toHaveBeenLastCalledWith(tracking);
      });

      it('should not still call ui.disableCurrentEntryDeletion and ui.enableCurrentEntryResuming', () => {
        expect(disableCurrentEntryDeletion).not.toHaveBeenCalled();
        expect(enableCurrentEntryResuming).not.toHaveBeenCalled();
      });
    });

    describe('when entry is not playing', () => {
      beforeEach(() => {
        tracking.currentEntryUpdated(_.without(currentEntry, 'start'));
      });

      it('should call ui.disableCurrentEntryDeletion', () => {
        expect(disableCurrentEntryDeletion).toHaveBeenLastCalledWith(tracking);
      });

      it('should call ui.enableCurrentEntryResuming with tracking instance', () => {
        expect(enableCurrentEntryResuming).toHaveBeenLastCalledWith(tracking);
      });

      it('should not still call ui.enableCurrentEntryDeletion and ui.enableCurrentEntryPausing', () => {
        expect(enableCurrentEntryDeletion).not.toHaveBeenCalled();
        expect(enableCurrentEntryPausing).not.toHaveBeenCalled();
      });
    });
  });
});
