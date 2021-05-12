'use strict';

/**
 * @extends Error
 * @type {module.OAuth2Error}
 */
class OAuth2Error extends Error {

  toString() {
    return `[OAuth2Error] ${super.toString()}`;
  }

}

module.exports = OAuth2Error;
