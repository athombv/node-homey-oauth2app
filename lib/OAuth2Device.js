'use strict';

const Homey = require('homey');
const OAuth2Error = require('./OAuth2Error');

module.exports = class OAuth2Device extends Homey.Device {

  async onInit() {
    // Migrate
    if (typeof this.onOAuth2Migrate === 'function') {
      try {
        const {
          OAuth2SessionId,
          OAuth2ConfigId,
        } = this.getStore();

        if (!OAuth2SessionId || !OAuth2ConfigId) {
          this.log('Starting migration...');
          const result = await this.onOAuth2Migrate();
          if (!result) {
            throw new OAuth2Error('Migration Failed');
          }

          const {
            sessionId,
            configId,
            token,
            title = null,
          } = result;

          let client;
          const hasClient = this.homey.app.hasOAuth2Client({
            sessionId,
            configId,
          });
          if (!hasClient) {
            client = this.homey.app.createOAuth2Client({
              sessionId,
              configId,
            });
            client.setToken({ token });
            client.setTitle({ title });
            client.save();
          }

          this.setStoreValue('OAuth2SessionId', sessionId);
          this.setStoreValue('OAuth2ConfigId', configId);

          if (typeof this.onOAuth2MigrateSuccess === 'function') {
            await this.onOAuth2MigrateSuccess();
          }

          this.log('Migration success!');
        }
      } catch (err) {
        await this.setUnavailable('Migration failed. Please re-authorize.');
        this.error(err);
        return;
      }
    }

    // Init
    const {
      OAuth2SessionId,
      OAuth2ConfigId,
    } = this.getStore();

    if (!OAuth2ConfigId) {
      throw new OAuth2Error('Missing OAuth2ConfigId');
    }

    if (!OAuth2SessionId) {
      throw new OAuth2Error('Missing OAuth2SessionId');
    }

    this.oAuth2Client = this.homey.app.getOAuth2Client({
      sessionId: OAuth2SessionId,
      configId: OAuth2ConfigId,
    });

    await this.onOAuth2Init();
  }

  async onOAuth2Init() {
    // Extend me
  }

  async onUninit() {
    await this.onOAuth2Uninit();
  }

  async onOAuth2Uninit() {
    // Extend me
  }

  async onAdded() {
    await this.onOAuth2Added();
  }

  async onOAuth2Added() {
    // Extend me
  }

  async onDeleted() {
    const {
      OAuth2SessionId,
      OAuth2ConfigId,
    } = this.getStore();

    if (OAuth2SessionId && OAuth2ConfigId) {
      this.homey.app.tryCleanSession({
        sessionId: OAuth2SessionId,
        configId: OAuth2ConfigId,
      });
    }

    await this.onOAuth2Deleted();
  }

  async onOAuth2Deleted() {
    // Extend me
  }

};
