'use strict';

const Homey = require('homey');

module.exports = class OAuth2Error extends Error {
  
  constructor(message) {
    super(...arguments);
    
    // Try to translate the message
    const key = `oauth2.error.${message}`;
    const translated = Homey.__(key);
    
    if( key !== translated ) {
      this.messageOriginal = message;
      this.message = translated;
    }
  }
  
  toString() {
    return `[OAuth2Error] ${super.toString()}`;
  }
  
}