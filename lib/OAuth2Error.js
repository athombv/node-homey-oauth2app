'use strict';

module.exports = class OAuth2Error extends Error {
  
  toString() {
    return `[OAuth2Error] ${super.toString()}`;
  }
  
}