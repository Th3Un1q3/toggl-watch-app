import _ from 'lodash';

expect.extend({
  toBeVisible(element) {
    const display = _.get(element, 'style.display');

    if (display === 'none') {
      return {
        message: () =>
          `expected ${element && element.outerHTML} to be visible but it is not.`,
        pass: false,
      };
    } else if (display === 'inline') {
      return {
        message: () =>
          `expected ${element && element.outerHTML} not to be visible but it is.`,
        pass: true,
      };
    }

    return {
      message: () => `expected ${element && element.outerHTML} to have display property`,
      pass: this.isNot,
    };
  },
});
