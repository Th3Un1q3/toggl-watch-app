import faker from 'faker';
import document from 'document';
import {
  enableLoader,
  hideConfigurationRequired,
  LOADER_STATE,
  showConfigurationRequired, showCurrentEntry,
} from './ui';

describe('User Interface module', () => {
  let configurationRequired;
  let loader;
  let currentEntry;
  let project;
  let description;
  let hours;
  let minutes;
  let seconds;

  beforeEach(() => {
    document._reset();
    configurationRequired = document.getElementById('auth_token_info');
    loader = document.getElementById('loader');
    currentEntry = document.getElementById('current_entry');
    project = document.getElementById('current_entry_project');
    description = document.getElementById('current_entry_description');
    hours = document.getElementById('current_entry_time_hours');
    minutes = document.getElementById('current_entry_time_minutes');
    seconds = document.getElementById('current_entry_time_seconds');
  });

  test('ui elements present and have correct defaults', () => {
    expect(loader).toBeTruthy();
    expect(configurationRequired).toBeTruthy();
    expect(currentEntry).toBeTruthy();
    expect(project).toBeTruthy();
    expect(description).toBeTruthy();
    expect(hours).toBeTruthy();
    expect(minutes).toBeTruthy();
    expect(seconds).toBeTruthy();

    expect(configurationRequired.style.display).toEqual('none');
    expect(currentEntry.style.display).toEqual('none');
  });

  describe('showCurrentEntry', () => {
    beforeEach(() => {
      enableLoader();
    });

    describe('when there is entry', () => {
      let currentEntryBody;

      beforeEach(() => {
        currentEntryBody = {
          id: faker.random.number(),
          desc: faker.lorem.sentence(),
          start: 1589285423000,
          end: 1589285463000,
          billable: true,
          color: '#a0a0a0',
          projectName: faker.hacker.adjective(),
        };
        showCurrentEntry(currentEntryBody);
      });

      it('should disable loader', () => {
        expect(loader.state).toEqual(LOADER_STATE.DISABLED);
      });

      it('should make #current_entry visible', () => {
        expect(currentEntry.style.display).toEqual('inline');
      });

      it('should change fill color of project', () => {
        expect(project.style.fill).toEqual(currentEntryBody.color);
      });

      it('should set project name', () => {
        expect(project.text).toEqual(currentEntryBody.projectName);
      });

      it('should set entry description', () => {
        expect(description.text).toEqual(currentEntryBody.desc);
      });

      it('should set time to empty values', () => {
        expect(hours.text).toEqual('--');
        expect(minutes.text).toEqual('--');
        expect(seconds.text).toEqual('--');
      });

      it.todo('should set active class to seconds');

      it.todo('should start time updating');
    });
  });

  describe('enableLoader', () => {
    it('should make loader state enabled', () => {
      enableLoader();
      expect(loader.state).toEqual(LOADER_STATE.ENABLED);
    });
  });

  describe('hideConfigurationRequired', () => {
    beforeEach(showConfigurationRequired);

    it('should hide #auth_token_info', () => {
      hideConfigurationRequired();
      expect(configurationRequired.style.display).toEqual('none');
    });
  });

  describe('showConfigurationRequired', () => {
    beforeEach(() => {
      showCurrentEntry();
      showConfigurationRequired();
    });

    it('should show #auth_token_info', () => {
      expect(configurationRequired.style.display).toEqual('inline');
    });

    it('should hide current entry', () => {
      expect(currentEntry.style.display).toEqual('none');
    });

    it('should disable #loader', () => {
      expect(loader.state).toEqual(LOADER_STATE.DISABLED);
    });
  });
});
