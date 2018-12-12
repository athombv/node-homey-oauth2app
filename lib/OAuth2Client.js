'use strict';

const { EventEmitter } = require('events');
const querystring = require('querystring');
const fetch = require('node-fetch');
const PromiseQueue = require('promise-queue');
const FormData = require('form-data');
const OAuth2Error = require('./OAuth2Error');

/*
 * This class handles all api and token requests, and should be extended by the app.
 */
module.exports = class OAuth2Client extends EventEmitter {
  
  constructor({
    clientId,
    clientSecret,
    apiUrl,
    tokenUrl,
    authorizationUrl,
    scopes,
  }) {
    super();
    
    this._clientId = clientId;
    this._clientSecret = clientSecret;
    this._apiUrl = apiUrl;
    this._tokenUrl = tokenUrl;
    this._authorizationUrl = authorizationUrl;
    this._scopes = scopes;
    
    this._pq = new PromiseQueue(1);
  }
  
  /*
   * Helpers
   */
  
  init() {
    this.debug('Initialized');    
    return this.onInit();
  }
  
  log(...props) {
    this.emit('log', ...props);
  }
  
  error(...props) {
    this.emit('error', ...props);
  }
  
  debug(...props) {
    this.emit('debug', ...props);    
  }
  
  /*
   * Request Management
   */
  
  async get({
    path,
    query,
    headers,
  }) {
    return this.request({
      method: 'GET',
      path,
      query,
      headers,
    });
  }
  
  async delete({
    path,
    query,
    headers,
  }) {
    return this.request({
      method: 'delete',
      path,
      query,
      headers,
    });
  }
  
  async post({
    path,
    query,
    json,
    body,
    headers,
  }) {
    return this.request({
      method: 'POST',
      path,
      query,
      json,
      body,
      headers,
    });
  }
  
  async put({
    path,
    query,
    json,
    body,
    headers,
  }) {
    return this.request({
      method: 'PUT',
      path,
      query,
      json,
      body,
      headers,
    });
  }
  
  async request({
    method,
    path,
    json,
    body,
    query,
    headers = {},
  }) {
    const opts = {};
    opts.method = method;
    opts.headers = headers;
    
    let urlAppend = '';
    if( typeof query === 'object' ) {
      urlAppend = '?' + querystring.stringify(query);
    }
    
    if( json ) {
      if( body )
        throw new OAuth2Error('Both body and json provided');
      
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(json);
    }
    
    const url = `${this._apiUrl}${path}${urlAppend}`;
    
    return this._pq.add(() => {
      return this._handleRequest({ url, opts });
    });
    
  }
  
  async _handleRequest({
    url,
    opts,
    didRefreshToken,
  }) {
    this.debug(url, opts);
    let response;
    try {
      response = await fetch(url, opts)
    } catch( err ) {
      return this.onRequestError({
        url,
        opts,
        err,
      });
    }
    return this.onRequestResponse({
      url,
      opts,
      response,
      didRefreshToken,
    });
  }
  
  /*
   * Token management
   */
  
  getToken() {
    return null; // TODO
  }
  
  setToken({ token }) {
    
  }
  
  /*
   * Various
   */
  getAuthorizationUrl({ scopes = this._scopes } = {}) {
    return this.onHandleAuthorizationURL({ scopes });
  }
  
  /*
   * Methods that can be extended
   */
  
  async onInit() {
    // Extend me
  }
  
  async onGetTokenByCode({ code }) {
    const form = new FormData();
		form.append('grant_type', 'authorization_code');
		form.append('client_id', this._clientId);
		form.append('client_secret', this._clientSecret);
		form.append('code', code);
			
		const response = await fetch(this._tokenUrl, {
  		method: 'POST',
  		body: form,
      headers: form.getHeaders(),
		});
		return this.onHandleGetTokenByCodeResponse({ response });
  }
  
  async onHandleGetTokenByCodeResponse({ response }) {
    return this._onHandleGetTokenByResponseGeneric({ response });    
  }
  
  async onRefreshToken() {
    const token = this.getToken();
    if(!token)
			throw new OAuth2Error('Missing Token');
			
		const refresh_token = token.refresh_token || token.refreshToken || token.refresh;
		if(!refresh_token)
		  throw new OAuth2Error('Missing Refresh Token');
			
		const form = new FormData();
		form.append('grant_type', 'refresh_token');
		form.append('client_id', this._clientId);
		form.append('client_secret', this._clientSecret);
		form.append('refresh_token', refresh_token);
			
		const response = await fetch(this._tokenUrl, {
  		method: 'POST',
  		body: form,
      headers: form.getHeaders()
		});
		return this.onHandleRefreshTokenResponse({ response });
  }
  
  async onHandleRefreshTokenResponse({ response }) {
    return this._onHandleGetTokenByResponseGeneric({ response });
  }
  
  async _onHandleGetTokenByResponseGeneric({ response }) {
    const { headers } = response;
    const contentType = headers.get('Content-Type');
    if( typeof contentType === 'string' ) {
      if( contentType.startsWith('application/json') ) {
        return response.json();
      }
    }
    return response.text();    
  }
  
  async onRequestError({ err }) {
    this.debug('onRequestError', err);
    throw err;
  }
  
  /*
   * This method returns a boolean if the response is rate limited
   */
  async onRequestResponse({
    url,
    opts,
    response,
    didRefreshToken = false,
  }) {    
    const {
      ok,
      status,
      statusText,
      headers,
    } = response;
    
    this.debug('onRequestResponse', {
      ok,
      status,
      statusText,
    });
    
    const shouldRefreshToken = await this.onShouldRefreshToken({
      status,
      headers,
    });
    if( shouldRefreshToken ) {
      if( didRefreshToken ) {
        throw new OAuth2Error('Token refresh failed');
      } else {        
        await this.onRefreshToken();
        return this._handleRequest({
          url,
          opts,
          didRefreshToken: true,
        });
      }
    }
    
    const isRateLimited = await this.onIsRateLimited({
      status,
      headers,
    });
    if( isRateLimited ) {
      this.debug('Request is rate limited');
      // TODO: Implement automatic retrying
      throw new OAuth2Error('Rate Limited');
    }
    
    const result = await this.onHandleResponse({
      response,
      status,
      statusText,
      headers,   
      ok,   
    });
    return this.onHandleResult({
      result,
      status,
      statusText,
      headers,
    })
  }
  
  /*
   * This method returns a boolean if the token should be refreshed
   */
  async onShouldRefreshToken({ status }) {
    return status === 401;
  }
  
  /*
   * This method returns a boolean if the response is rate limited
   */
  async onIsRateLimited({ status, headers }) {
    return status === 429;
  }
  
  /*
   * This method handles a response and downloads the body
   */
  async onHandleResponse({
    response,
    status,
    statusText,
    headers,
    ok,
  }) {
    let body;
    
    const contentType = headers.get('Content-Type');
    if( typeof contentType === 'string' ) {
      if( contentType.startsWith('application/json') ) {
        body = await response.json();
      } else {
        body = await response.text();        
      }
    } else {      
      body = await response.text();
    }
    
    if( ok )
      return body;
      
    const err = await this.onHandleNotOK({
      body,
      status,
      statusText,
      headers,
    });
    
    if(!err instanceof Error)
      throw new OAuth2Error('Invalid onHandleNotOK return value, expected: instanceof Error');
      
    throw err;
  }
  
  /*
   * This method handles a response that is not OK (400 <= statuscode <= 599)
   */
  async onHandleNotOK({
    body,
    status,
    statusText,
    headers,
  }) {
    const message = `${status} ${statusText || 'Unknown Error'}`;
    const err = new Error(message);
    err.status = status;
    err.statusText = statusText;
    return err;
  }  
  
  /*
   * This method handles a response that is OK
   */
  async onHandleResult({
    result,
    status,
    statusText,
    headers,
  }) {
    return result;
  }
  
  onHandleAuthorizationURL({ scopes } = {}) {
    const query = {
      client_id: this._clientId,
			response_type: 'code',
			scope: scopes.join(','),
    }
    
    return this._authorizationUrl + '?' + querystring.stringify(query);
  }
  
}