import {MESSAGE_TYPE} from '../common/constants/message-types';
import fs from 'fs';
import {intersection, without} from '../common/utils/arrays';
import {Transmitter} from '../common/transmitter';
import {EventSource} from '../common/reactivity/event-source';

import {lazyDecorator} from '../common/utils/lazy-decorator';
import {EMPTY_TIME_ENTRY} from '../common/constants/default-time-entry';

const TIME_ENTRY_INFO = 'time-entry';
const PERSISTENCE_ENCODING = 'cbor';
const PRIVATE_DIR = '.';

const SEPARATOR = '_';

/**
 * Makes a storage key of specific type
 * @param {string} type
 * @param {string} id
 * @return {string}
 */
const composeStorageKey = ({type, id}) => [type, id].join(SEPARATOR);

/**
 * Create a storage key based on entry
 * @param {number|string} id
 * @return {string}
 */
const timeEntryInfoPath = ({id}) => composeStorageKey({type: TIME_ENTRY_INFO, id});

/**
 * Returns storage key by type end id
 * @param {string} composedKey
 * @return {{id: *, type: *}}
 */
const decomposeStorageKey = (composedKey) => {
  const [type, id] = composedKey.split(SEPARATOR);
  return {type, id};
};

/**
 * Provides persistence layer for time entries
 */
class TimeEntryRepository {
  /**
   * Inject dependencies
   * @param {Transmitter} transmitter
   */
  constructor({transmitter= new Transmitter({})} = {}) {
    lazyDecorator(this, 'entriesLogContentsUpdate', () => new EventSource());
    lazyDecorator(this, 'entryInfoUpdated', () => new EventSource());
    lazyDecorator(this, 'currentEntryUpdated', () => new EventSource());
    this.transmitter = transmitter;
    this.saveEntryDetails(Object.assign({id: 0}, EMPTY_TIME_ENTRY));
    this._attachDataTransferHandlers();
  }

  /**
   * Updates entries log contents
   * @param {number[]} newLogContents
   */
  set entriesLogContents(newLogContents) {
    this._entriesLogContents = newLogContents;
    this.entriesLogContentsUpdate.next();
  }

  /**
   * Returns the list of ids of recent time entries
   * in order from recent to old
   * @return {number[]}
   */
  get entriesLogContents() {
    return this._entriesLogContents = this._entriesLogContents || this.storedEntriesIndex;
  }

  set currentEntry(newCurrentEntry) {
    this._currentEntryId = newCurrentEntry.id;
    this.currentEntryUpdated.next();
  }

  get currentEntry() {
    return this.find({id: this.currentEntryId});
  }

  get currentEntryId() {
    return this._currentEntryId || 0;
  }

  /**
   * Returns an index of stored entries
   * @return {number[]}
   */
  get storedEntriesIndex() {
    const savedTimeEntries = [];

    this.readFileListWith((fileName) => {
      const decomposed = decomposeStorageKey(fileName);
      const id = parseInt(decomposed.id, 10);
      if (decomposed.type === TIME_ENTRY_INFO && id) {
        savedTimeEntries.push(id);
      }
    });

    return savedTimeEntries
        .sort((a, b) => b-a);
  }

  /**
   * Passes files sequentially to the reader
   * @param {function} reader
   */
  readFileListWith(reader) {
    let read;
    const pointer = fs.listDirSync(PRIVATE_DIR);

    while ((read = pointer.next()) && !read.done) {
      reader(read.value);
    }
  }

  delete({id}) {
    this.transmitter.sendMessage({
      type: MESSAGE_TYPE.DELETE_TIME_ENTRY,
      data: {
        id,
      },
    });
    fs.unlinkSync(timeEntryInfoPath({id}));
    this.entriesLogContents = this.entriesLogContents.filter((entryId) => entryId !== id);
    if (this._lastTimeEntry) {
      this.currentEntry = this._lastTimeEntry;
    }
  }

  get _lastTimeEntry() {
    return this.find({id: this.entriesLogContents[0]});
  }

  start({id, start}) {
    this.stop({id: this.currentEntryId, stop: start});

    this.entriesLogContents = [this.currentEntryId]
        .concat(this.entriesLogContents.filter((oldId) => oldId !== this.currentEntryId));

    this.transmitter.sendMessage({
      type: MESSAGE_TYPE.START_TIME_ENTRY,
      data: {
        id,
        start,
      },
    });

    const entryToStart = this.find({id});
    const startedEntry = Object.assign({}, EMPTY_TIME_ENTRY, entryToStart, {id: 0, isPlaying: true, start, cur: true});
    this.saveEntryDetails(startedEntry);
    this.currentEntry = startedEntry;
  }

  stop({id, stop}) {
    const entryToStop = this.find({id});
    if (entryToStop && !entryToStop.isPlaying) {
      return;
    }

    this.transmitter.sendMessage({
      type: MESSAGE_TYPE.STOP_TIME_ENTRY,
      data: {
        id,
        stop,
      },
    });

    const stoppedEntry = Object.assign({}, EMPTY_TIME_ENTRY, entryToStop, {isPlaying: false, stop});
    this.saveEntryDetails(stoppedEntry);
    if (id === this.currentEntryId) {
      this.currentEntry = stoppedEntry;
    }
  }

  /**
   * Finds entry info in storage
   * @param {number} id
   * @return {Object}
   */
  find({id}) {
    try {
      return fs.readFileSync(timeEntryInfoPath({id}), PERSISTENCE_ENCODING);
    } catch (e) {
      if (id) {
        this.transmitter.sendMessage({
          type: MESSAGE_TYPE.REQUEST_ENTRY_DETAILS,
          data: {entryId: id},
        });
      }

      return null;
    }
  }

  /**
   * Saves time entry details
   * @param {TimeEntryMessage} details
   */
  saveEntryDetails(details) {
    fs.writeFileSync(timeEntryInfoPath(details), details, PERSISTENCE_ENCODING);
    this.entryInfoUpdated.next(details.id);
  }

  /**
   * Attaches required handlers
   * @private
   */
  _attachDataTransferHandlers() {
    this.transmitter.onMessage(MESSAGE_TYPE.TIME_ENTRY_DETAILS, (details) => {
      if (details.cur) {
        this.currentEntry = details;
      }
      this.saveEntryDetails(details);
    });

    this.transmitter.onMessage(MESSAGE_TYPE.ENTRIES_LOG_UPDATE, (newIds) => {
      this._handleEntriesLogUpdate(newIds.filter((id) => !!id));
    });
  }

  /**
   * Actualizes entries log contents
   * @param {number[]} newLogContents
   */
  _handleEntriesLogUpdate(newLogContents) {
    this._cleanOutdatedLogEntries(newLogContents);
    this.entriesLogContents = newLogContents;
  }

  /**
   * Removes stored items that are not in the log anymore
   * @param {number[]} newLogContents
   * @private
   */
  _cleanOutdatedLogEntries(newLogContents) {
    const savedEntriesIds = this.storedEntriesIndex;
    const toBeKeptEntryIds = intersection(newLogContents, savedEntriesIds);
    const outdatedEntryIds = without(savedEntriesIds, toBeKeptEntryIds, [0]);

    const outdatedEntriesFiles = outdatedEntryIds.map((id) => composeStorageKey({
      type: TIME_ENTRY_INFO,
      id,
    }));

    outdatedEntriesFiles.forEach((storageKey) => fs.unlinkSync(storageKey));
  }
}

export {
  TimeEntryRepository,
  PERSISTENCE_ENCODING,
  timeEntryInfoPath,
};
