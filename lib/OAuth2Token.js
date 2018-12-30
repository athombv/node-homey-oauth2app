'use strict';

module.exports = class OAuth2Token {
  
  constructor({
    access_token,
    refresh_token,
    token_type,
    expires_in,
  }) {
    this.access_token = access_token || null;
    this.refresh_token = refresh_token || null;
    this.token_type = token_type || null;
    this.expires_in = expires_in || null;
  }
  
  isRefreshable() {
    return !!this.refresh_token;
  }
  
  toJSON() {
    return {
      access_token: this.access_token,
      refresh_token: this.refresh_token,
      token_type: this.token_type,
      expires_in: this.expires_in,
    }
  }
   
}