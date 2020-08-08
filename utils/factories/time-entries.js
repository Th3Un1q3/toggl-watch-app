import faker from 'faker';

const timeEntryBody = ({isPlaying = true, ...overrides} = {}) => ({
  id: faker.random.number(),
  workspace_id: faker.random.number(),
  project_id: faker.random.number(),
  task_id: faker.random.number(),
  billable: true,
  start: '2020-05-03T10:43:29+00:00',
  stop: '2020-05-03T10:43:29+00:00',
  duration: -1588502609,
  description: faker.hacker.phrase(),
  tags: null,
  tag_ids: null,
  duronly: false,
  at: '2020-05-03T10:43:29+00:00',
  server_deleted_at: null,
  user_id: faker.random.number(),
  uid: faker.random.number(),
  wid: faker.random.number(),
  pid: faker.random.number(),
  tid: faker.random.number(),
  ...(isPlaying && {stop: null}),
  ...overrides,
});

export {
  timeEntryBody,
};
