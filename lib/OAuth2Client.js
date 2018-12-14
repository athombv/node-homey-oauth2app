'use strict';

const { EventEmitter } = require('events');
const querystring = require('querystring');

const Homey = require('homey');
const fetch = require('node-fetch');
const PromiseQueue = require('promise-queue');
const FormData = require('form-data');

const OAuth2Error = require('./OAuth2Error');
const OAuth2Token = require('./OAuth2Token');
const OAuth2Util = require('./OAuth2Util');

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
    redirectUrl,
    scopes,
  }) {
    super();
    
    this._clientId = clientId;
    this._clientSecret = clientSecret;
    this._apiUrl = apiUrl;
    this._tokenUrl = tokenUrl;
    this._authorizationUrl = authorizationUrl;
    this._redirectUrl = redirectUrl;
    this._scopes = scopes;

    this._token = null;    
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
  
  save() {
    this.emit('save');
  }
  
  destroy() {
    this.emit('destroy');
  }
  
  /*
   * Request Management
   */
  
  async get({
    path,
    query,
    headers,
  }) {
    return this.onRequest({
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
    return this.onRequest({
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
    return this.onRequest({
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
    return this.onRequest({
      method: 'PUT',
      path,
      query,
      json,
      body,
      headers,
    });
  }
  
  async refreshToken() {
    if( this._refreshingToken )
      return this._refreshingToken;
   
    this._refreshingToken = this.onRefreshToken();
   
    try {
      await this._refreshingToken;
      delete this._refreshingToken;
    } catch( err ) {
      delete this._refreshingToken;
      throw err;
    }
  }
  
  async _handleRequest({
    url,
    opts,
    didRefreshToken,
  }) {
    // log request
    this.debug('[req]', opts.method, url);
    for(let key in opts.headers) {
      this.debug('[req]', `${key}: ${opts.headers[key]}`);
    }
    opts.body && this.debug('[req]', opts.body); 
    
    // make request
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
   
  async getTokenByCode({ code }) {
    const token = await this.onGetTokenByCode({ code });
    if(!token instanceof OAuth2Token)
      throw new Error('Invalid Token returned in onGetTokenByCode');
    
    this._token = token;    
    return this.getToken();
  }
  
  getToken() {
    return this._token;
  }
  
  setToken({ token }) {
    this._token = token;
  }
  
  /*
   * Various
   */
  getAuthorizationUrl({
    scopes = this._scopes,
    state = OAuth2Util.getRandomId(),
  } = {}) {
    const url = this.onHandleAuthorizationURL({ scopes, state });
    this.debug('Got authorization URL:', url);
    return url;
  }
  
  getTitle() {
    return this._title;
  }
  
  setTitle({ title }) {
    this._title = title;
  }
  
  /*
   * Methods that can be extended
   */
  
  async onInit() {
    // Extend me
  }
  
  async onRequest({
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
    opts.headers = await this.onRequestHeaders({ headers: opts.headers });
    
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
  
  async onRequestHeaders({ headers }) {
    const token = await this.getToken();
    if(!token)
      throw new OAuth2Error('Missing Token');
      
    const { access_token } = token;
    return {
      ...headers,
      'Authorization': `Bearer ${access_token}`,
    }
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
		this._token = await this.onHandleGetTokenByCodeResponse({ response });
		return this.getToken();
  }
  
  async onHandleGetTokenByCodeResponse({ response }) {
    return this._onHandleGetTokenByResponseGeneric({ response });    
  }
  
  async onRefreshToken() {
    const token = this.getToken();
    if(!token)
			throw new OAuth2Error('Missing Token');
			
    this.debug('Refreshing token...');
			
		if(!token.isRefreshable())
		  throw new OAuth2Error('Token cannot be refreshed');
			
		const form = new FormData();
		form.append('grant_type', 'refresh_token');
		form.append('client_id', this._clientId);
		form.append('client_secret', this._clientSecret);
		form.append('refresh_token', token.refresh_token);
			
		const response = await fetch(this._tokenUrl, {
  		method: 'POST',
  		body: form,
      headers: form.getHeaders()
		});
		this._token = await this.onHandleRefreshTokenResponse({ response });
    
    this.debug('Refreshed token!');
    this.save();
    
		return this.getToken();
  }
  
  async onHandleRefreshTokenResponse({ response }) {
    return this._onHandleGetTokenByResponseGeneric({ response });
  }
  
  async _onHandleGetTokenByResponseGeneric({ response }) {
    const { headers } = response;
    const contentType = headers.get('Content-Type');
    if( typeof contentType === 'string' ) {
      if( contentType.startsWith('application/json') ) {
        return new OAuth2Token(await response.json());
      }
    }
    
    throw new Error('Could not parse Token Response');
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
    
    this.debug('[res]', {
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
        await this.refreshToken();
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

  onHandleAuthorizationURL({ scopes, state } = {}) {
    const query = {
      state,
      client_id: this._clientId,
			response_type: 'code',
			scope: this.onHandleAuthorizationURLScopes({ scopes }),
			redirect_uri: this._redirectUrl,
    }
    
    return this._authorizationUrl + '?' + querystring.stringify(query);
  }
  
  onHandleAuthorizationURLScopes({ scopes }) {
    return scopes.join(',')
  }
  
  /*
   * This method returns data that can identify the session
   */
  async onGetOAuth2SessionInformation() {
    return {
      id: OAuth2Util.getRandomId(),
      title: null,
    }
  }
  
}