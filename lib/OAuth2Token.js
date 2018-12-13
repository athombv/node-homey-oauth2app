'use strict';

module.exports = class OAuth2Token {
  
  constructor({
    access_token,
    refresh_token,
    token_type,
    expires_in,
  }) {
    this._access_token = access_token;
    this._refresh_token = refresh_token;
    this._token_type = token_type;
    this._expires_in = expires_in;
  }
  
  get access_token() {
    return this._access_token || null;;
  }
  
  get refresh_token() {
    return this._refresh_token || null;;
  }
  
  get token_type() {
    return this._token_type || null;
  }
  
  get expires_in() {
    return this._expires_in || null;
  }
  
  isRefreshable() {
    return !!this.refresh_token;
  }
  
  toJSON() {
    return {
      access_token: this._access_token,
      refresh_token: this._refresh_token,
      token_type: this._token_type,
      expires_in: this._expires_in,
    }
  }
   
}