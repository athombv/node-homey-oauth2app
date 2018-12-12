'use strict';

const Homey = require('homey');
const OAuth2Error = require('./OAuth2Error');
const OAuth2Client = require('./OAuth2Client');

const sDebug = Symbol();
const sConfigs = Symbol();
const sClients = Symbol();

module.exports = class OAuth2App extends Homey.App {
  
  constructor(...props) {
    super(...props);
    
    this[sDebug] = false;
    this[sConfigs] = {};
    this[sClients] = {};    
  }
  
  enableOAuth2Debug() {
    this[sDebug] = true;
  }
  
  disableOAuth2Debug() {
    this[sDebug] = false;
  }
  
  /*
   * Set the app's config.
   * Most apps will only use one config, `default`.
   * All methods default to this config.
   * For apps using multiple clients, a configId can be provided.
   */
  setOAuth2Config({
    configId = 'default',
    client = OAuth2Client,
    clientId = Homey.env.CLIENT_ID,
    clientSecret = Homey.env.CLIENT_SECRET,
    apiUrl,
    tokenUrl,
    authorizationUrl,
    redirectUrl = 'https://callback.athom.com/oauth2/callback',
  }) {
    if(typeof configId !== 'string')
      throw new OAuth2Error('Invalid Config ID');
      
    if(this.hasConfig(configId))
      throw new OAuth2Error('Duplicate Config ID');
      
    if(!client || (client !== OAuth2Client && (client.prototype instanceof OAuth2Client) !== true))
      throw new OAuth2Error('Invalid Client, must extend OAuth2Client');
      
    if(typeof clientId !== 'string')
      throw new OAuth2Error('Invalid Client ID');
      
    if(typeof clientSecret !== 'string')
      throw new OAuth2Error('Invalid Client Secret');
      
    if(typeof apiUrl !== 'string')
      throw new OAuth2Error('Invalid API URL');
      
    if(typeof tokenUrl !== 'string')
      throw new OAuth2Error('Invalid Token URL');
      
    if(typeof authorizationUrl !== 'string')
      throw new OAuth2Error('Invalid Authorization URL');
      
    if(typeof redirectUrl !== 'string')
      throw new OAuth2Error('Invalid Redirect URL');
    
    this[sConfigs][configId] = {
      client,
      clientId,
      clientSecret,
      apiUrl,
      tokenUrl,
      authorizationUrl,
      redirectUrl,
    }
    this[sClients][configId] = {}; 
  }
   
  
  /*
   * OAuth2 Config Management
   */
  hasConfig({
    configId = 'default',
  } = {}) {
    return !!this[sConfigs][configId];
  }
  
  checkHasConfig({
    configId = 'default',
  } = {}) {
    const hasConfig = this.hasConfig({ configId });
    if( !hasConfig )
      throw new OAuth2Error('Invalid OAuth2 Config');    
  }
  
  getConfig({
    configId = 'default',
  } = {}) {
    this.checkHasConfig({ configId });
    return this[sConfigs][configId];
  }
  
  /*
   * OAuth2 Client Management
   */
  hasOAuth2Client({
    configId = 'default',
    id = 'default',
  } = {}) {
    this.checkHasConfig({ configId });
    return !!this[sClients][configId][id];
  }
  
  checkHasOAuth2Client({
    configId = 'default',
    id = 'default',
  } = {}) {
    const hasClient = this.hasOAuth2Client({ configId, id });
    if( !hasClient )
      throw new OAuth2Error('Invalid OAuth2 Client');
  }
  
  createOAuth2Client({
    configId = 'default',
    id = 'default',
  } = {}) {
    if(this.hasOAuth2Client({ configId, id }))
      throw new OAuth2Error('OAuth2 Client already exists');  
      
    const {
      client,
      clientId,
      clientSecret,
      apiUrl,
      tokenUrl,
      authorizationUrl,
    } = this.getConfig({ configId });
      
    const clientInstance = new client({
      clientId,
      clientSecret,
      apiUrl,
      tokenUrl,
      authorizationUrl,
    });
    this[sClients][configId][id] = clientInstance;
    clientInstance.on('log', (...args) => this.log(`[${client.name}] [${configId}] [${id}]`, ...args));
    clientInstance.on('error', (...args) => this.error(`[${client.name}] [${configId}] [${id}]`, ...args));
    clientInstance.on('debug', (...args) => this[sDebug] && this.log(`[debug] [${client.name}] [config:${configId}] [id:${id}]`, ...args));
    clientInstance.init();
    return clientInstance;
  }
  
  deleteOAuth2Client({
    configId = 'default',
    id = 'default',
  } = {}) {
    this.checkHasOAuth2Client({ configId, id });
    delete this[sClients][configId][id];
  }
  
  getOAuth2Client({
    configId = 'default',
    id = 'default',
  } = {}) {
    this.checkHasOAuth2Client({ configId, id });      
    return this[sClients][configId][id];
  }
  
}