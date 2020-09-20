import _ from 'lodash';
import faker from 'faker';

import {
  PERSISTENCE_ENCODING,
  timeEntryInfoPath,
  TimeEntryRepository,
} from './time-entry.repository';
import {MESSAGE_TYPE} from '../common/constants/message-types';
import {Transmitter} from '../common/transmitter';
import fs from 'fs';
import {timeEntryBody} from '../utils/factories/time-entries';
import {timeEntryDetails} from '../companion/tracking';
import {EMPTY_TIME_ENTRY} from '../common/constants/default-time-entry';

const messageTypeForValue = (type) => _.findKey(MESSAGE_TYPE, (v) => v===type);

jest.mock('../common/transmitter');
jest.mock('fs');

describe(TimeEntryRepository, () => {
  let repo;
  let transmitter;
  const onEntriesLogUpdate = jest.fn();
  const onEntryInfoUpdated = jest.fn();
  const onCurrentEntryUpdated = jest.fn();

  beforeEach(() => {
    fs._resetFS();
    transmitter = new Transmitter();
    repo = new TimeEntryRepository({transmitter});
    repo.entriesLogContentsUpdate.subscribe(onEntriesLogUpdate);
    repo.entryInfoUpdated.subscribe(onEntryInfoUpdated);
    repo.currentEntryUpdated.subscribe(onCurrentEntryUpdated);
  });

  describe('Processing messages', () => {
    describe(messageTypeForValue(MESSAGE_TYPE.ENTRIES_LOG_UPDATE), () => {
      let presentEntries;
      let initialSavedIds;
      let toBeRemainIds;
      let thresholdIds;
      let receivedList;

      const triggerMessageReceived = (data) => {
        Transmitter.emitMessageReceived(MESSAGE_TYPE.ENTRIES_LOG_UPDATE, data);
      };

      beforeEach(() => {
        presentEntries = _.times(10, () => timeEntryDetails(timeEntryBody({isPlaying: false})));
        presentEntries.forEach((entry) => {
          fs.writeFileSync(timeEntryInfoPath({id: entry.id}), entry, PERSISTENCE_ENCODING);
        });
        initialSavedIds = presentEntries.map((e) => e.id);
        toBeRemainIds = _.sampleSize(initialSavedIds, 5);
        thresholdIds = _.times(5, () => faker.random.number());
        receivedList = toBeRemainIds.concat(thresholdIds);
      });

      it('should remove out of received range entries', () => {
        expect(repo.storedEntriesIndex).toEqual(expect.arrayContaining(initialSavedIds));
        expect(repo.entriesLogContents).toEqual(expect.arrayContaining(initialSavedIds));

        triggerMessageReceived(receivedList);

        expect(repo.entriesLogContents).toEqual(receivedList);
        expect(repo.storedEntriesIndex).toEqual(expect.arrayContaining(toBeRemainIds));
        expect(repo.storedEntriesIndex).toHaveLength(toBeRemainIds.length);
      });

      it('should emit list updated only when list changed', () => {
        expect(onEntriesLogUpdate).not.toHaveBeenCalled();

        triggerMessageReceived(receivedList);

        expect(onEntriesLogUpdate).toHaveBeenCalledTimes(1);
      });
    });

    describe(messageTypeForValue(MESSAGE_TYPE.TIME_ENTRY_DETAILS), () => {
      let receivedEntry;

      const emitEntryReceived = () => {
        Transmitter.emitMessageReceived(MESSAGE_TYPE.TIME_ENTRY_DETAILS, receivedEntry);
      };

      beforeEach(() => {
        receivedEntry = timeEntryDetails(timeEntryBody({isPlaying: false}));
        emitEntryReceived();
      });

      it('should emit entryInfoUpdated with entry id', () => {
        expect(onEntryInfoUpdated).toHaveBeenCalledTimes(1);
        expect(onEntryInfoUpdated).toHaveBeenCalledWith(receivedEntry.id);
      });

      it('can .find received entry', () => {
        expect(repo.find({id: receivedEntry.id})).toEqual(receivedEntry);
      });

      describe('when entry .cur', () => {
        beforeEach(() => {
          receivedEntry = {...receivedEntry, cur: true};
        });

        it('should emit currentEntryUpdated', () => {
          expect(onCurrentEntryUpdated).not.toHaveBeenCalled();
          emitEntryReceived();
          expect(onCurrentEntryUpdated).toHaveBeenCalledTimes(1);
        });

        it('should return it from current', () => {
          emitEntryReceived();
          expect(repo.currentEntry).toEqual(receivedEntry);
        });
      });
    });
  });

  describe('.currentEntry', () => {
    describe('when there is no entry assigned', () => {
      it('should return default entry', () => {
        expect(repo.currentEntry).toEqual(expect.objectContaining(EMPTY_TIME_ENTRY));
      });
    });
  });

  describe('.start', () => {
    let timeEntry;
    let callParams;
    const executeStart = () => repo.start(callParams);

    beforeEach(() => {
      timeEntry = timeEntryDetails(timeEntryBody({isPlaying: false}));
      callParams = {id: timeEntry.id, start: Date.now()};
      Transmitter.emitMessageReceived(MESSAGE_TYPE.TIME_ENTRY_DETAILS, timeEntry);
    });

    it(`should send ${messageTypeForValue(MESSAGE_TYPE.START_TIME_ENTRY)} command`, () => {
      executeStart();
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        data: {
          id: callParams.id,
          start: callParams.start,
        },
      }));

      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        type: MESSAGE_TYPE.START_TIME_ENTRY,
      }));
    });


    it('should set entry data to current entry and mark it as started', () => {
      executeStart();
      expect(repo.currentEntry).toEqual(expect.objectContaining({
        ...timeEntry,
        id: 0,
        start: callParams.start,
        isPlaying: true,
      }));
    });

    describe('when there is a currently playing entry', () => {
      let currentEntry;
      beforeEach(() => {
        repo.entriesLogContents;
        currentEntry = timeEntryDetails(timeEntryBody({isPlaying: true}));
        Transmitter.emitMessageReceived(MESSAGE_TYPE.TIME_ENTRY_DETAILS, {...currentEntry, cur: true});
      });

      it('should stop previously played entry', () => {
        executeStart();

        expect(repo.find({id: currentEntry.id})).toEqual(expect.objectContaining({
          stop: callParams.start,
          isPlaying: false,
        }));
      });

      it('should add previous entry to entries log contents', () => {
        expect(repo.entriesLogContents).toEqual(expect.not.arrayContaining([
          currentEntry.id,
        ]));

        executeStart();

        expect(repo.entriesLogContents).toEqual(expect.arrayContaining([
          currentEntry.id,
        ]));
      });
    });

    describe('when entry is not present', () => {
      beforeEach(() => {
        callParams = {id: faker.random.number(), start: Date.now()};
      });
      it('should set current entry as default and playing', () => {
        executeStart();
        expect(repo.currentEntry).toEqual(expect.objectContaining({
          ...EMPTY_TIME_ENTRY,
          id: 0,
          start: callParams.start,
          isPlaying: true,
        }));
      });
    });
  });

  describe('.stop', () => {
    let timeEntry;
    let callParams;

    const executeStop = () => repo.stop(callParams);

    beforeEach(() => {
      timeEntry = timeEntryDetails(timeEntryBody({isPlaying: true}));
      callParams = {id: timeEntry.id, stop: Date.now()};
      Transmitter.emitMessageReceived(MESSAGE_TYPE.TIME_ENTRY_DETAILS, timeEntry);
    });

    it('should send a command to stop entry', () => {
      executeStop();
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        type: MESSAGE_TYPE.STOP_TIME_ENTRY,
      }));

      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        data: {
          id: callParams.id,
          stop: callParams.stop,
        },
      }));
    });

    it('should mark entry as not playing and assign stop time', () => {
      expect(repo.find({id: timeEntry.id})).toEqual(expect.objectContaining({
        id: timeEntry.id,
        isPlaying: true,
      }));

      executeStop();

      expect(repo.find({id: timeEntry.id})).toEqual(expect.objectContaining({
        id: timeEntry.id,
        stop: callParams.stop,
        isPlaying: false,
      }));
    });

    it('should emit entry update', () => {
      executeStop();

      expect(onEntryInfoUpdated).toHaveBeenCalledTimes(2);
      expect(onEntryInfoUpdated).toHaveBeenLastCalledWith(callParams.id);
    });

    describe('when it is current entry ', () => {
      beforeEach(() => {
        Transmitter.emitMessageReceived(MESSAGE_TYPE.TIME_ENTRY_DETAILS, {...timeEntry, cur: true});
      });

      it('should emit current entry update', () => {
        expect(onCurrentEntryUpdated).toHaveBeenCalledTimes(1);

        executeStop();

        expect(onCurrentEntryUpdated).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('.delete', () => {
    let storedEntry;
    const executeDelete = () => repo.delete({id: storedEntry.id});

    beforeEach(() => {
      storedEntry = timeEntryDetails(timeEntryBody());
      fs.writeFileSync(timeEntryInfoPath({id: storedEntry.id}), storedEntry, PERSISTENCE_ENCODING);
    });

    it('should remove entry from storage', () => {
      expect(repo.find({id: storedEntry.id})).toBeTruthy();
      executeDelete();
      expect(repo.find({id: storedEntry.id})).toBeFalsy();
    });

    it('should sent delete command', () => {
      executeDelete();
      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        type: MESSAGE_TYPE.DELETE_TIME_ENTRY,
      }));

      expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
        data: {
          id: storedEntry.id,
        },
      }));
    });

    it('should update entries log contents', () => {
      expect(repo.entriesLogContents).toEqual(expect.arrayContaining([storedEntry.id]));
      executeDelete();
      expect(repo.entriesLogContents).toEqual(expect.not.arrayContaining([storedEntry.id]));
    });

    it('should emit contents upgrade event', () => {
      expect(onEntriesLogUpdate).not.toHaveBeenCalled();
      executeDelete();
      expect(onEntriesLogUpdate).toHaveBeenCalledTimes(1);
    });

    describe('when it is current entry deleted', () => {
      let nextToLastEntry;
      beforeEach(() => {
        nextToLastEntry = timeEntryDetails(timeEntryBody({id: storedEntry.id - 1}));
        fs.writeFileSync(timeEntryInfoPath({id: nextToLastEntry.id}), nextToLastEntry, PERSISTENCE_ENCODING);
        Transmitter.emitMessageReceived(MESSAGE_TYPE.TIME_ENTRY_DETAILS, {...storedEntry, cur: true});
        Transmitter.emitMessageReceived(MESSAGE_TYPE.ENTRIES_LOG_UPDATE, [storedEntry.id, nextToLastEntry.id]);
        onCurrentEntryUpdated.mockClear();
      });

      it('should set current entry to last entry', () => {
        expect(repo.currentEntry).toEqual(expect.objectContaining(storedEntry));
        executeDelete();
        expect(repo.currentEntry).toEqual(nextToLastEntry);
        expect(onCurrentEntryUpdated).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('.find', () => {
    let storedEntry;
    beforeEach(() => {
      storedEntry = timeEntryDetails(timeEntryBody({isPlaying: false}));
      fs.writeFileSync(timeEntryInfoPath({id: storedEntry.id}), storedEntry, PERSISTENCE_ENCODING);
    });

    it('should return previously stored time entry info', () => {
      expect(repo.find({id: storedEntry.id})).toEqual(storedEntry);
    });

    describe('when entry is not present', () => {
      let entryId;

      beforeEach(() => {
        entryId = faker.random.number();
        repo.find({id: entryId});
      });

      it('should return null', () => {
        expect(repo.find({id: entryId})).toBeNull();
      });

      it(`should send a message with ${messageTypeForValue(MESSAGE_TYPE.REQUEST_ENTRY_DETAILS)} type`, () => {
        expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
          type: MESSAGE_TYPE.REQUEST_ENTRY_DETAILS,
        }));
      });

      it('should send message with entryId', () => {
        expect(Transmitter.instanceSendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
          data: {
            entryId,
          },
        }));
      });

      it('should request entry', () => {
        expect(Transmitter.sen);
        repo.find({id: faker.random.number()});
      });
    });
  });

  describe('.currentEntry', () => {
    it.todo('should return entry');

    describe('when there is no current entry', () => {
      it.todo('should return null');
    });
  });
});
