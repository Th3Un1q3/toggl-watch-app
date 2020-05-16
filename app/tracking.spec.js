import {showCurrentEntry} from './ui';
import {timeEntryBody} from '../utils/factories/time-entries';
import {Tracking, TIMER_UPDATE_INTERVAL_MS} from './tracking';

jest.mock('./ui');

describe('Tracking on device', () => {
  let tracking;

  beforeEach(() => {
    tracking = new Tracking();
  });

  describe('.currentEntryUpdated', () => {
    let currentEntry;

    beforeEach(() => {
      currentEntry = timeEntryBody();
    });

    it('should call show current entry instantly', () => {
      expect(showCurrentEntry).not.toHaveBeenCalled();

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
  });
});
