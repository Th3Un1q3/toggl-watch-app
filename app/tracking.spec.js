import _ from 'lodash';
import {
  disableCurrentEntryDeletion,
  enableCurrentEntryDeletion,
  enableCurrentEntryPausing, enableCurrentEntryResuming,
  showCurrentEntry,
} from './ui';
import {timeEntryBody} from '../utils/factories/time-entries';
import {Tracking, TIMER_UPDATE_INTERVAL_MS} from './tracking';

jest.mock('./ui');

describe('Tracking on device', () => {
  let tracking;

  beforeEach(() => {
    tracking = new Tracking();
  });

  describe('.deleteCurrentEntry', () => {
    it.todo('should call transmitter.sendMessage with {id: currentEntry.id}');
    it.todo('should call transmitter.sendMessage with message.type:DELETE_CURRENT_ENTRY')
  });
  describe('.resumeCurrentEntry', () => {
    it.todo('should call transmitter.sendMessage with {id: currentEntry.id}');
    it.todo('should call transmitter.sendMessage with message.type:RESUME_LAST_ENTRY')
  });
  describe('.stopCurrentEntry', () => {
    it.todo('should call transmitter.sendMessage with {id: currentEntry.id}');
    it.todo('should call transmitter.sendMessage with message.type:STOP_CURRENT_ENTRY')
  });

  describe('.currentEntryUpdated', () => {
    let currentEntry;

    beforeEach(() => {
      currentEntry = timeEntryBody();
    });

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
