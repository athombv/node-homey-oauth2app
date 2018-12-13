'use strict';

const Homey = require('homey');
const uuid = require('uuid');

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
    let client;
    let currentViewId = 'list_sessions';
        
    const OAuth2Config = Homey.app.getConfig({
      configId: OAuth2ConfigId,
    });
    
    const { allowMultiSession } = OAuth2Config;
    console.log('allowMultiSession', allowMultiSession)
    
    /*
    if( allowMultiSession ) {
      client = Homey.app.createOAuth2Client({
        sessionId: uuid.v4(),
        configId: OAuth2ConfigId,
      });
    } else {
      
    }
    */
      
    /*  
    let urlResolve;
    let urlReject;
    const url = new Promise((resolve, reject) => {
      urlResolve = resolve;
      urlReject = reject;
    }).catch(this.error);
    
    let codeResolve;
    let codeReject;
    const code = new Promise((resolve, reject) => {
      codeResolve = resolve;
      codeReject = reject;
    }).catch(this.error);
    */
    
    const onShowView = ( viewId, callback ) => {
      currentViewId = viewId;
      callback();
      
      if( viewId === 'login_oauth2' ) {
        onShowViewLoginOAuth2();
      }
    }
    
    const onShowViewLoginOAuth2 = () => {
      if( OAuth2SessionId !== '$new' )
        return socket.emit('authorized');
        
      client = Homey.app.createOAuth2Client({
        sessionId: uuid.v4(),
        configId: OAuth2ConfigId,
      });
      
      new Homey.CloudOAuth2Callback(client.getAuthorizationUrl())
  			.on('url', url => {
          socket.emit('url', url);    			
  			})
  			.on('code', code => {
    			client.onGetTokenByCode({ code })
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
      const savedClients = Homey.app.getSavedOAuth2Clients();      
      const sessions = Object.keys(savedClients).map((id, i) => {
        const client = savedClients[id];
        return {
          name: client.title || `Saved User ${i + 1}`,
          data: { id },
        }
      });
      
      sessions.push({
        name: 'New User',
        data: {
          id: '$new',
        },
      });
      
      callback( null, sessions );
    }
    
    const onListSessionsSelection = ( data, callback ) => {
      
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
                  
      this.onPairListDevices({ client }).then(devices => {
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