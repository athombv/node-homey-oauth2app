'use strict';

const Homey = require('homey');

module.exports = class OAuth2Driver extends Homey.Driver {
  
  onInit(...args) {
    this.super(...args);
  }
  
  onPair( socket ) {
    
    const client = Homey.app.createOAuth2PairClient();
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
        
        code.then(token => {
          console.log('codeResolve', token)
					socket.emit('authorized');
        }).catch(err => {
					socket.emit('error', err.message || err.toString());
        });
      }
    });
    
    socket.on('list_devices', ( data, callback ) => {
      this.onPairListDevices().then(devices => {
        callback( null, devices );
      }).catch(err => {
        callback(err);
      })
    })
    
    new Homey.CloudOAuth2Callback(authorizationUrl)
			.on('url', urlResolve)
			.on('code', code => {
  			client.onGetTokenByCode({ code })
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