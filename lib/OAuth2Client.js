'use strict';

const { URLSearchParams } = require('url');
const { EventEmitter } = require('events');
const querystring = require('querystring');

const Homey = require('homey');
const fetch = require('node-fetch');
const PromiseQueue = require('promise-queue');

const OAuth2Error = require('./OAuth2Error');
const OAuth2Token = require('./OAuth2Token');
const OAuth2Util = require('./OAuth2Util');

/*
 * This class handles all api and token requests, and should be extended by the app.
 */
module.exports = class OAuth2Client extends EventEmitter {

  constructor({
    token,
    clientId,
    clientSecret,
    apiUrl,
    tokenUrl,
    authorizationUrl,
    redirectUrl,
    scopes,
  }) {
    super();
    
    this._tokenConstructor = token;
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
    this.onUninit().catch(() => {});
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
    return this._queueRequest({
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
    return this._queueRequest({
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
    return this._queueRequest({
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
    return this._queueRequest({
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

    this._refreshingToken = this.onRefreshToken(...arguments);

    try {
      await this._refreshingToken;
      delete this._refreshingToken;
    } catch( err ) {
      delete this._refreshingToken;
      throw err;
    }
  }

  async _queueRequest(req) {
    return this._pq.add(() => {
      return this._executeRequest({ req });
    });
  }

  async _executeRequest({
    req,
    didRefreshToken = false,
  }) {
    const {
      url,
      opts,
    } = await this.onBuildRequest(req);
    
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
        req,
        url,
        opts,
        err,
      });
    }
    return this.onRequestResponse({
      req,
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

  async getTokenByCredentials({ username, password }) {
    const token = await this.onGetTokenByCredentials({ username, password });
    if(!token instanceof OAuth2Token)
      throw new Error('Invalid Token returned in getTokenByCredentials');

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
  
  async onUninit() {
    // Extend me
  }
  
  async onBuildRequest({ method, path, json, body, query, headers = {} }) {
    const opts = {};
    opts.method = method;
    opts.headers = headers;
    opts.headers = await this.onRequestHeaders({ headers: opts.headers });

    let urlAppend = '';
    query = await this.onRequestQuery({
      query: {
        ...query,
      }
    });
    if( typeof query === 'object' && Object.keys(query).length ) {
      urlAppend = '?' + querystring.stringify(query);
    }

    if( json ) {
      if( body )
        throw new OAuth2Error('Both body and json provided');

      opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json';
      opts.body = JSON.stringify(json);
    }

    const url = `${this._apiUrl}${path}${urlAppend}`;
    
    return {
      url,
      opts,
    }
  }
  
  async onRequestQuery({ query }) {
    return query;
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
  
  // https://tools.ietf.org/html/rfc6749#section-4.1.3
  async onGetTokenByCode({ code }) {
    const body = new URLSearchParams();
		body.append('grant_type', 'authorization_code');
		body.append('client_id', this._clientId);
		body.append('client_secret', this._clientSecret);
		body.append('code', code);
		body.append('redirect_uri', this._redirectUrl);
		
		const response = await fetch(this._tokenUrl, {
  		body,
  		method: 'POST',
		});
		if(!response.ok)
		  throw new Error(`Invalid Response (${response.status})`);

		this._token = await this.onHandleGetTokenByCodeResponse({ response });
		return this.getToken();
  }

  // https://tools.ietf.org/html/rfc6749#section-4.3.2
  async onGetTokenByCredentials({ username, password }) {
    const body = new URLSearchParams();
		body.append('grant_type', 'credentials');
		body.append('client_id', this._clientId);
		body.append('client_secret', this._clientSecret);
		body.append('username', username);
		body.append('password', password);

		const response = await fetch(this._tokenUrl, {
  		body,
  		method: 'POST',
		});
		if(!response.ok)
		  throw new Error(`Invalid Response (${response.status})`);

		this._token = await this.onHandleGetTokenByCodeResponse({ response });
		return this.getToken();
  }

  async onHandleGetTokenByCodeResponse({ response }) {
    return this._onHandleGetTokenByResponseGeneric({ response });
  }

  // https://tools.ietf.org/html/rfc6749#section-6
  async onRefreshToken() {
    const token = this.getToken();
    if(!token)
			throw new OAuth2Error('Missing Token');

    this.debug('Refreshing token...');

		if(!token.isRefreshable())
		  throw new OAuth2Error('Token cannot be refreshed');

		const body = new URLSearchParams();
		body.append('grant_type', 'refresh_token');
		body.append('client_id', this._clientId);
		body.append('client_secret', this._clientSecret);
		body.append('refresh_token', token.refresh_token);

		const response = await fetch(this._tokenUrl, {
  		body,
  		method: 'POST',
		});
		if(!response.ok)
		  throw new Error(`Invalid Response (${response.status})`);

		this._token = await this.onHandleRefreshTokenResponse({ response });

    this.debug('Refreshed token!', this._token);
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
        const json = await response.json();
        const token = new this._tokenConstructor({
          ...this._token, // merge with old token for properties such as refresh_token
          ...json,
        });
        return token;
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
    req,
    url,
    opts,
    response,
    didRefreshToken,
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
        await this.refreshToken({
          req,
          url,
          opts,
          response,
        });
        return this._executeRequest({
          req,
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
    if( status === 204 ) return;
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

  // https://tools.ietf.org/html/rfc6749#appendix-A.4
  onHandleAuthorizationURLScopes({ scopes }) {
    return scopes.join(' ')
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