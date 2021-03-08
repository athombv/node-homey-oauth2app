'use strict';

module.exports = class OAuth2Util {

  static getRandomId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0; const
        // eslint-disable-next-line no-mixed-operators
        v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static async wait(delay = 1000) {
    await new Promise(resolve => {
      setTimeout(() => resolve(), delay);
    });
  }

};
