'use strict';

const Homey = require('homey');
const OAuth2Error = require('./OAuth2Error');

module.exports = class OAuth2Device extends Homey.Device {

  onInit() {
    if (typeof this.onOAuth2Migrate === 'function') {
      try {
        const {
          OAuth2SessionId,
          OAuth2ConfigId,
        } = this.getStore();

        if (!OAuth2SessionId || !OAuth2ConfigId) {
          this.log('Starting migration...');
          const result = this.onOAuth2Migrate();
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
          const hasClient = Homey.app.hasOAuth2Client({
            sessionId,
            configId,
          });
          if (!hasClient) {
            client = Homey.app.createOAuth2Client({
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
            this.onOAuth2MigrateSuccess();
          }

          this.log('Migration success!');
        }
      } catch (err) {
        this.setUnavailable('Migration failed. Please re-authorize.');
        this.error(err);
        return;
      }
    }

    try {
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

      this.oAuth2Client = Homey.app.getOAuth2Client({
        sessionId: OAuth2SessionId,
        configId: OAuth2ConfigId,
      });

      Promise.resolve(this.onOAuth2Init()).catch(err => {
        this.error(err);
        this.setUnavailable(err);
      });
    } catch (err) {
      this.error(err);
      this.setUnavailable('Please re-authorize.');
    }
  }

  async onOAuth2Init() {
    // Extend me
  }

  async onOAuth2Uninit() {
    await this.onOAuth2Deleted();
  }

  onDeleted() {
    const {
      OAuth2SessionId,
      OAuth2ConfigId,
    } = this.getStore();

    if (OAuth2SessionId && OAuth2ConfigId) {
      Homey.app.tryCleanSession({
        sessionId: OAuth2SessionId,
        configId: OAuth2ConfigId,
      });
    }

    Promise.resolve(this.onOAuth2Deleted())
      .catch(this.error);
  }

  async onOAuth2Deleted() {
    // Extend me
  }

};
