'use strict';

const Homey = require('homey');
const OAuth2Util = require('./OAuth2Util');

const sOAuth2ConfigId = Symbol();

module.exports = class OAuth2Driver extends Homey.Driver {

  onInit() {
    this.setOAuth2ConfigId('default');
    return this.onOAuth2Init();
  }

  getOAuth2ConfigId() {
    return this[sOAuth2ConfigId];
  }

  setOAuth2ConfigId(id) {
    if( typeof id !== 'string' )
      throw new OAuth2Error('Invalid Config ID');

    this[sOAuth2ConfigId] = id;
  }

  onOAuth2Init() {
    // Extend me
  }

  onPair( socket ) {
    const OAuth2ConfigId = this.getOAuth2ConfigId();
    let OAuth2SessionId = '$new';
    let currentViewId = 'list_sessions';
    let client = Homey.app.createOAuth2Client({
      sessionId: OAuth2Util.getRandomId(),
      configId: OAuth2ConfigId,
    });

    const OAuth2Config = Homey.app.getConfig({
      configId: OAuth2ConfigId,
    });
    const { allowMultiSession } = OAuth2Config;
    if( !allowMultiSession ) {
      const savedSessions = Homey.app.getSavedOAuth2Sessions();
      if( Object.keys(savedSessions).length ) {
        OAuth2SessionId = Object.keys(savedSessions)[0];
        try {
          client = Homey.app.getOAuth2Client({
            configId: OAuth2ConfigId,
            sessionId: OAuth2SessionId,
          });
          this.log(`Multi-Session disabled. Selected ${OAuth2SessionId} as active session.`);
        } catch( err ) {
          this.error(err);
        }
      }
    }

    const onShowView = ( viewId, callback ) => {
      currentViewId = viewId;
      callback();

      if( viewId === 'login_oauth2' ) {
        onShowViewLoginOAuth2();
      } else if( viewId === 'login_credentuals' ) {
        onShowViewLoginOAuth2();
      }
    }

    const onShowViewLoginPassword = () => {
      if( OAuth2SessionId !== '$new' )
        return socket.emit('authorized');

    }

    const onLogin = (data, callback) => {
      const {
        username,
        password,
      } = data;

      client
        .getTokenByCredentials({ username, password })
        .then(async () => {
  			  const session = await client.onGetOAuth2SessionInformation();
   			  OAuth2SessionId = session.id;
          const token = client.getToken();
  			  const title = session.title;
  			  client.destroy();

  			  // replace the temporary client by the final one and save it
  			  client = Homey.app.createOAuth2Client({
            sessionId: session.id,
            configId: OAuth2ConfigId,
          });
          client.setTitle({ title });
          client.setToken({ token });

          callback(null, true);
        })
        .catch(err => {
          this.error(err);
          callback(err);
        });
    }

    const onShowViewLoginOAuth2 = () => {
      if( OAuth2SessionId !== '$new' )
        return socket.emit('authorized');

      new Homey.CloudOAuth2Callback(client.getAuthorizationUrl())
  			.on('url', url => {
          socket.emit('url', url);
  			})
  			.on('code', code => {
    			client.getTokenByCode({ code })
    			  .then(async () => {
      			  // get the client's session info
      			  const session = await client.onGetOAuth2SessionInformation();
      			  OAuth2SessionId = session.id;
      			  const token = client.getToken();
      			  const title = session.title;
      			  client.destroy();

      			  // replace the temporary client by the final one and save it
      			  client = Homey.app.createOAuth2Client({
                sessionId: session.id,
                configId: OAuth2ConfigId,
              });
              client.setTitle({ title });
              client.setToken({ token });

              socket.emit('authorized');
      		  })
      			.catch(err => {
      				socket.emit('error', err.message || err.toString());
      			})
  			})
  			.generate()
  			.catch(err => {
  				socket.emit('error', err.message || err.toString());
  			})
		}

    const onListSessions = ( data, callback ) => {
      if( !allowMultiSession )
        return callback( new Error('Multi-Session is disabled.\nPlease remove the list_devices from your App\'s manifest or allow Multi-Session support.') );

      const savedSessions = Homey.app.getSavedOAuth2Sessions();
      const result = Object.keys(savedSessions).map((sessionId, i) => {
        const session = savedSessions[sessionId];
        return {
          name: session.title || `Saved User ${i + 1}`,
          data: { id: sessionId },
        }
      });

      result.push({
        name: 'New User',
        data: {
          id: '$new',
        },
      });

      callback( null, result );
    }

    const onListSessionsSelection = ( data, callback ) => {
      if( !allowMultiSession )
        return callback( new Error('Multi-Session is disabled.') );

      const [ selection ] = data;
      const { id } = selection.data;

      OAuth2SessionId = id;
      this.log(`Selected session ${OAuth2SessionId}`);

      if( OAuth2SessionId !== '$new' ) {
        try {
          client = Homey.app.getOAuth2Client({
            configId: OAuth2ConfigId,
            sessionId: OAuth2SessionId,
          });
        } catch( err ) {
          return callback(err);
        }
      }

      callback();
    }

    const onListDevices = ( data, callback ) => {
      if( currentViewId === 'list_sessions' )
        return onListSessions( data, callback );

      this.onPairListDevices({
        oAuth2Client: client,
      }).then(devices => {
        devices = devices.map(device => {
          return {
            ...device,
            store: {
              ...device.store,
              OAuth2SessionId,
              OAuth2ConfigId,
            },
          }
        });
        callback( null, devices );
      }).catch(err => {
        callback(err);
      })
    }

    const onAddDevice = ( data, callback ) => {
      callback();
      this.log('At least one device has been added, saving the client...');
      client.save();
    }

    const onDisconnect = () => {
      this.log('Pair Session Disconnected');
    }

    socket
      .on('showView', onShowView)
      .on('login', onLogin)
      .on('list_sessions', onListSessions)
      .on('list_sessions_selection', onListSessionsSelection)
      .on('list_devices', onListDevices)
      .on('add_device', onAddDevice)
      .on('disconnect', onDisconnect)

  }

  async onPairListDevices() {
    // Extend me
    return [];
  }

}