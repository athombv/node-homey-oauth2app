'use strict';

/**
 * @class OAuth2Error
 * @extends Error
 * @type {module.OAuth2Error}
 */
module.exports = class OAuth2Error extends Error {

  toString() {
    return `[OAuth2Error] ${super.toString()}`;
  }

};
