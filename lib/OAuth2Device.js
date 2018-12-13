'use strict';

const Homey = require('homey');

module.exports = class OAuth2Driver extends Homey.Device {
  
  onInit() {    
    try {
      const {
        OAuth2SessionId,
        OAuth2ConfigId,
      } = this.getStore();
      
      this.oAuth2Client = Homey.app.getOAuth2Client({
        sessionId: OAuth2SessionId,
        configId: OAuth2ConfigId,
      });
      
      return this.onOAuth2Init();
    } catch( err ) {
      this.error(err);
      this.setUnavailable('Please re-authorize.');      
    }
  }
  
  onOAuth2Init() {
    // Extend me
  }
  
  onDeleted() {
    const {
      OAuth2SessionId,
      OAuth2ConfigId,
    } = this.getStore();
    
    if( OAuth2SessionId && OAuth2ConfigId ) {
      Homey.app.tryCleanSession({
        sessionId: OAuth2SessionId,
        configId: OAuth2ConfigId,
      });
    }
    
    return this.onOAuth2Deleted();
  }
  
  onOAuth2Deleted() {
    // Extend me
  }
  
}