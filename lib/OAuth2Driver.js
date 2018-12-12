'use strict';

const Homey = require('homey');

module.exports = class OAuth2Driver extends Homey.Driver {
  
  onInit(...args) {
    this.super(...args);
  }
  
}