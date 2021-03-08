'use strict';

const Homey = require('homey');
const OAuth2Error = require('./OAuth2Error');
const OAuth2Token = require('./OAuth2Token');
const OAuth2Client = require('./OAuth2Client');
const OAuth2Util = require('./OAuth2Util');

const SETTINGS_KEY = 'OAuth2Sessions';

const sDebug = Symbol('debug');
const sConfigs = Symbol('configs');
const sClients = Symbol('clients');

module.exports = class OAuth2App extends Homey.App {

  static API_URL = null;
  static TOKEN_URL = null;
  static AUTHORIZATION_URL = null;
  static REDIRECT_URL = 'https://callback.athom.com/oauth2/callback';
  static SCOPES = [];
  static OAUTH2_DEBUG = false;

  async onInit() {
    this[sDebug] = false;
    this[sConfigs] = {};
    this[sClients] = {};

    await this.onOAuth2Init();
  }

  async onOAuth2Init() {
    // Overload Me

    if (this.constructor.OAUTH2_DEBUG) {
      this.enableOAuth2Debug();
    }

    this.setOAuth2Config();
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
    token = OAuth2Token,
    grantType = 'authorization_code',
    client = OAuth2Client,
    clientId = Homey.env.CLIENT_ID,
    clientSecret = Homey.env.CLIENT_SECRET,
    apiUrl = client.constructor.API_URL,
    tokenUrl = client.constructor.TOKEN_URL,
    authorizationUrl = client.constructor.AUTHORIZATION_URL,
    redirectUrl = client.constructor.REDIRECT_URL,
    scopes = client.constructor.SCOPES,
    allowMultiSession = false,
  }) {
    if (typeof configId !== 'string') {
      throw new OAuth2Error('Invalid Config ID');
    }

    if (this.hasConfig(configId)) {
      throw new OAuth2Error('Duplicate Config ID');
    }

    if (!client
     || (client !== OAuth2Client && (client.prototype instanceof OAuth2Client) !== true)) {
      throw new OAuth2Error('Invalid Client, must extend OAuth2Client');
    }

    if (!token
     || (token !== OAuth2Token && (token.prototype instanceof OAuth2Token) !== true)) {
      throw new OAuth2Error('Invalid Token, must extend OAuth2Token');
    }

    if (typeof clientId !== 'string') {
      throw new OAuth2Error('Invalid Client ID');
    }

    if (typeof clientSecret !== 'string') {
      throw new OAuth2Error('Invalid Client Secret');
    }

    if (typeof apiUrl !== 'string') {
      throw new OAuth2Error('Invalid API URL');
    }

    if (typeof tokenUrl !== 'string') {
      throw new OAuth2Error('Invalid Token URL');
    }

    if (typeof authorizationUrl !== 'undefined' && typeof authorizationUrl !== 'string') {
      throw new OAuth2Error('Invalid Authorization URL');
    }

    if (typeof redirectUrl !== 'string') {
      throw new OAuth2Error('Invalid Redirect URL');
    }

    if (typeof grantType !== 'string') {
      throw new OAuth2Error('Invalid Redirect URL');
    }

    if (!Array.isArray(scopes)) {
      throw new OAuth2Error('Invalid Scopes Array');
    }

    if (typeof allowMultiSession !== 'boolean') {
      throw new OAuth2Error('Invalid Allow Multi Session');
    }

    this[sConfigs][configId] = {
      token,
      grantType,
      client,
      clientId,
      clientSecret,
      apiUrl,
      tokenUrl,
      authorizationUrl,
      redirectUrl,
      scopes,
      allowMultiSession,
    };
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
    if (!hasConfig) {
      throw new OAuth2Error('Invalid OAuth2 Config');
    }
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
    sessionId,
    configId = 'default',
  } = {}) {
    this.checkHasConfig({ configId });
    return !!this[sClients][configId][sessionId];
  }

  checkHasOAuth2Client({
    sessionId,
    configId = 'default',
  } = {}) {
    const hasClient = this.hasOAuth2Client({ configId, sessionId });
    if (!hasClient) {
      throw new OAuth2Error('Invalid OAuth2 Client');
    }
  }

  createOAuth2Client({
    sessionId,
    configId = 'default',
  } = {}) {
    if (this.hasOAuth2Client({ configId, sessionId })) {
      throw new OAuth2Error('OAuth2 Client already exists');
    }

    const {
      client: Client,
      token,
      clientId,
      clientSecret,
      apiUrl,
      tokenUrl,
      authorizationUrl,
      redirectUrl,
      scopes,
    } = this.getConfig({ configId });

    // eslint-disable-next-line new-cap
    const clientInstance = new Client({
      homey: this.homey,
      token,
      clientId,
      clientSecret,
      apiUrl,
      tokenUrl,
      authorizationUrl,
      redirectUrl,
      scopes,
    });
    this[sClients][configId][sessionId] = clientInstance;
    clientInstance.on('log', (...args) => this.log(`[${clientInstance.constructor.name}] [c:${configId}] [s:${sessionId}]`, ...args));
    clientInstance.on('error', (...args) => this.error(`[${clientInstance.constructor.name}] [c:${configId}] [s:${sessionId}]`, ...args));
    clientInstance.on('debug', (...args) => this[sDebug] && this.log(`[dbg] [${clientInstance.constructor.name}] [c:${configId}] [s:${sessionId}]`, ...args));
    clientInstance.on('save', () => this.saveOAuth2Client({ client: clientInstance, configId, sessionId }));
    clientInstance.on('destroy', () => this.deleteOAuth2Client({ configId, sessionId }));
    clientInstance.init();
    return clientInstance;
  }

  deleteOAuth2Client({
    sessionId,
    configId = 'default',
  } = {}) {
    // remove from storage
    const savedSessions = this.getSavedOAuth2Sessions();
    delete savedSessions[sessionId];
    this.homey.settings.set(SETTINGS_KEY, savedSessions);

    // remove from memory
    delete this[sClients][configId][sessionId];
  }

  getOAuth2Client({
    sessionId,
    configId = 'default',
  } = {}) {
    // if the client for this session has already been initialized, return that
    if (this.hasOAuth2Client({ configId, sessionId })) {
      return this[sClients][configId][sessionId];
    }

    // create a client from storage if available
    const savedSessions = this.getSavedOAuth2Sessions();
    if (savedSessions && savedSessions[sessionId]) {
      const {
        token,
        title,
      } = savedSessions[sessionId];

      const {
        token: Token,
      } = this.getConfig();

      const client = this.createOAuth2Client({
        sessionId,
        configId,
      });
      client.setToken({ token: new Token(token) });
      client.setTitle({ title });

      this.tryCleanSession({
        sessionId,
        configId,
      });

      return client;
    }

    throw new OAuth2Error('Could not get OAuth2Client');
  }

  saveOAuth2Client({ configId, sessionId, client }) {
    const token = client.getToken();
    const title = client.getTitle();

    const savedSessions = this.getSavedOAuth2Sessions();
    savedSessions[sessionId] = {
      configId,
      title,
      token: token.toJSON(),
    };
    this.homey.settings.set(SETTINGS_KEY, savedSessions);
  }

  getSavedOAuth2Sessions() {
    return this.homey.settings.get(SETTINGS_KEY) || {};
  }

  getFirstSavedOAuth2Client() {
    const sessions = this.getSavedOAuth2Sessions();
    if (Object.keys(sessions).length < 1) {
      throw new OAuth2Error('No OAuth2 Client Found');
    }

    const [sessionId] = Object.keys(sessions);
    const { configId } = sessions[sessionId];

    return this.getOAuth2Client({
      configId,
      sessionId,
    });
  }

  tryCleanSession({
    sessionId,
    configId = 'default',
  }) {
    Promise.resolve().then(async () => {
      const shouldDeleteSession = await this.onShouldDeleteSession({ sessionId });
      if (shouldDeleteSession) {
        this.log(`Deleting session ${configId} ${sessionId}...`);
        this.deleteOAuth2Client({
          sessionId,
          configId,
        });
      }
    }).catch(err => {
      this.homey.error('Error deleting session', err);
    });
  }

  async onShouldDeleteSession({
    sessionId,
    configId = 'default',
  }) {
    const foundSession = false;

    const { drivers } = this.homey.manifest;
    for (const driverId of drivers) {
      let driver;
      while (true) {
        try {
          driver = this.homey.drivers.getDriver(driverId);
          break;
        } catch (err) {
          await OAuth2Util.wait(500);
          continue;
        }
      }

      console.log('driver', driver);
      await driver.ready();
      const devices = driver.getDevices();
      console.log('devices', devices);
    }

    // const drivers = this.homey.drivers.getDrivers();
    // for (const driver of Object.values(drivers)) {
    //   const devices = driver.getDevices();
    //   // eslint-disable-next-line no-loop-func
    //   devices.forEach(device => {
    //     const {
    //       OAuth2ConfigId,
    //       OAuth2SessionId,
    //     } = device.getStore();

    //     if (OAuth2SessionId === sessionId && OAuth2ConfigId === configId) {
    //       foundSession = true;
    //     }
    //   });
    // }

    return !foundSession;
  }

};
