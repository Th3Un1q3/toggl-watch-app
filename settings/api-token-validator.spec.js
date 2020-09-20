import {validateToken} from './api-token-validator';

const invalidTokenExamples = [
  undefined,
  'asdfasd',
  '4f52b26f4c232d16fb0d0c095ade2f5350',
  '4f52b26f4c232d16fb0d0cz95ade2f50',
  5325,
  {},
  [1, 3, 4],
];

const validTokenExamples = [
  '4f52b26f4c232d16fb0d0c095ade2f50',
  '4f87566f4c232d16fb0d0c095ade2f50',
  '4f52b26f4c239846fb0d0c095ade2f50',
];

describe('validateToken', () => {
  it('should be a function', () => {
    expect(validateToken).toEqual(expect.any(Function));
  });

  describe('for invalid token', () => {
    invalidTokenExamples.forEach((invalidToken) => {
      it(`"${invalidToken}" must return false`, () => {
        expect(validateToken(invalidToken)).toBeFalsy();
      });
    });
  });

  describe('for valid token', () => {
    validTokenExamples.forEach((invalidToken) => {
      it(`"${invalidToken}" must return true`, () => {
        expect(validateToken(invalidToken)).toBeTruthy();
      });
    });
  });
});
