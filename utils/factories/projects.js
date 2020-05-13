import faker from 'faker';
import _ from 'lodash';

const projectBody = () => ({
  'id': faker.random.number(),
  'workspace_id': faker.random.number(),
  'client_id': faker.random.number(),
  'name': faker.commerce.productName(),
  'is_private': true,
  'active': true,
  'at': '2017-10-05T08:23:54+00:00',
  'created_at': '2017-08-29T14:07:04+00:00',
  'server_deleted_at': null,
  'color': `#${_.pad(_.random(0, 16777215).toString(16), 6, '0')}`,
  'billable': true,
  'template': false,
  'auto_estimates': false,
  'estimated_hours': null,
  'rate': 33,
  'currency': null,
  'actual_hours': faker.random.number(),
  'wid': faker.random.number(),
  'cid': faker.random.number(),
});

export {
  projectBody,
};
