import document from 'document';
import {
  UserInterface,
} from './ui';
import _ from 'lodash';
import {TimeEntryRepository} from './time-entry.repository';
import {EID} from './ui/selectors';
import flushPromises from 'flush-promises/index';
import {TEMPLATE, VIEW} from './ui/views';
import {EntriesLog} from './ui/views/entries-log.view';
import {CurrentEntry} from './ui/views/current-entry.view';

jest.mock('./time-entry.repository');
jest.mock('./ui/views/entries-log.view');
jest.mock('./ui/views/current-entry.view');
jest.mock('./ui/views/uncontrolled.view');

describe('UI module', () => {
  let configurationRequired;
  let uiInstance;
  let tracking;

  let entriesRepo;

  const initializeAllElements = () => {
    configurationRequired = document.getElementById(EID.ConfigurationInstruction);
  };

  const initializeUI = () => {

    entriesRepo = new TimeEntryRepository();

    uiInstance = new UserInterface({entriesRepo});
    return uiInstance.initialize();
  };

  beforeEach(async () => {
    document._reset();
  });

  afterEach(async () => {
    await flushPromises();
  });

  describe('on initialize', () => {
    beforeEach(() => {

    });

    it('should navigate to current entry', async () => {
      expect(document.replaceSync).not.toHaveBeenCalled();
      await initializeUI();
      expect(document.replaceSync).toHaveBeenLastCalledWith(TEMPLATE[VIEW.CurrentEntry]);
    });
  });

  describe('.navigate(view)', () => {
    beforeEach(async () => {
      await initializeUI();
    });

    it('should load correct controller and provide dependencies to it', async () => {
      expect(EntriesLog).not.toHaveBeenCalled();
      await uiInstance.navigate(VIEW.EntriesLog);
      expect(EntriesLog).toHaveBeenCalledTimes(1);
      expect(EntriesLog).toHaveBeenLastCalledWith({ui: uiInstance, entriesRepo});
    });

    it('should call mounted of the loaded controller', async () => {
      await uiInstance.navigate(VIEW.EntriesLog);
      expect(_.last(EntriesLog.mock.instances).mounted).toHaveBeenCalledTimes(1);
    });

    it('should destroy previous controller', async () => {
      expect(_.last(CurrentEntry.mock.instances).destroyed).not.toHaveBeenCalled();
      await uiInstance.navigate(VIEW.EntriesLog);
      expect(_.last(CurrentEntry.mock.instances).destroyed).toHaveBeenCalledTimes(1);
    });
  });

  describe('.hideConfigurationRequired', () => {
    beforeEach(async () => {
      await initializeUI();
      await uiInstance.showConfigurationRequired();
      await uiInstance.hideConfigurationRequired();
    });

    it('should show #configuration-instruction', () => {
      expect(document.replaceSync).toHaveBeenLastCalledWith(TEMPLATE[VIEW.CurrentEntry]);
    });
  });

  describe('.configurationRequired', () => {
    beforeEach(async () => {
      await initializeUI();
      await uiInstance.showConfigurationRequired();
    });

    it('should show #configuration-instruction', () => {
      expect(document.replaceSync).toHaveBeenLastCalledWith(TEMPLATE[VIEW.ConfigurationRequired]);
    });
  });
});
