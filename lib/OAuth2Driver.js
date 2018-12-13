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
    let OAuth2SessionId;
    
    let client = Homey.app.createOAuth2Client({
      sessionId: uuid.v4(),
      configId: OAuth2ConfigId,
    });
    const authorizationUrl = client.getAuthorizationUrl();
    
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
    
    socket.on('showView', viewId => {
      if( viewId === 'login_oauth2' ) {
        url.then(url => {
          socket.emit('url', url);
        }).catch(err => {
					socket.emit('error', err.message || err.toString());
        });
        
        code.then(() => {
					socket.emit('authorized');
        }).catch(err => {
					socket.emit('error', err.message || err.toString());
        });
      }
    });
    
    socket.on('list_devices', ( data, callback ) => {
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
    })
    
    socket.on('add_device', () => {
      this.log('At least one device has been added, saving the client...');
      client.save();
    });
    
    new Homey.CloudOAuth2Callback(authorizationUrl)
			.on('url', urlResolve)
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
    		  })
  			  .then(codeResolve)
  			  .catch(codeReject);
			})
			.generate()
			.catch(urlReject)  
    
  }
  
  async onPairListDevices() {
    // Extend me
    return [];
  }
  
}