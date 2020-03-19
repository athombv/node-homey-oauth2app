# Homey OAuth2

This module does the heavy lifting for a [Homey App](https://developer.athom.com) that talks to any OAuth2 Web API.

## Installation

Run 

```
$ homey app plugin add
```

Then select `oauth2`.

## Usage

### App

In your `/app.js`, make your `Homey.App` extend `OAuth2App`:

```javascript
const { OAuth2App } = require('homey-oauth2app');
const MyBrandOAuth2Client = require('./lib/MyBrandOAuth2Client');

module.exports = class MyBrandApp extends OAuth2App {
  
  onOAuth2Init() {
    this.enableOAuth2Debug();
    this.setOAuth2Config({
      client: MyBrandOAuth2Client,
      apiUrl: 'https://api.mybrand.com/v1',
      tokenUrl: 'https://api.mybrand.com/oauth2/token',
      authorizationUrl: 'https://auth.mybrand.com',
      scopes: [ 'my_scope' ],
    });    
  }
  
}
```

### API Client

Then create a file `/lib/MyBrandOAuth2Client` and make it extend `OAuth2Client`:

```javascript
const { OAuth2Client, OAuth2Error } = require('homey-oauth2app');

module.exports = class MyBrandOAuth2Client extends OAuth2Client {

  // Overload what needs to be overloaded here

  async onHandleNotOK({ body }) {
      throw new OAuth2Error(body.error);
  }

  async getThings({ color }) {
    return this.get({
      path: '/things',
      query: { color },
    });
  }

  async updateThing({ id, thing }) {
    return this.put({
      path: `/thing/${id}`,
      json: { thing },
    });
  }

}
```

By default, `OAuth2Client` will work with any API that follows [RFC 6749](https://tools.ietf.org/html/rfc6749). In case your API differs, there are many methods you can overload to change the behavior.

All methods starting with `on` (for example `onRequestError`) are meant to be overloaded. Overloading any other method might break in the future, so be careful.

### Driver

Add this to your `/drivers/<driver_id>/driver.compose.json`:

```json
{
  "id": "my_driver",
  "pair": [
    {
      "id": "login_oauth2",
      "template": "login_oauth2"
    },
    {
      "id": "list_devices",
      "template": "list_devices",
      "navigation": {
        "next": "add_devices"
      }
    },
    {
      "id": "add_devices",
      "template": "add_devices"
    }
  ],
  "repair": [ 
    {
      "id": "login_oauth2",
      "template": "login_oauth2"
    }
  ]
}
```

Your `/drivers/<driver_id>/driver.js` should look like this:

```javascript
const { OAuth2Driver } = require('homey-oauth2app');

module.exports = class MyBrandDriver extends OAuth2Driver {
  
  onOAuth2Init() {
    // Register Flow Cards etc.
  }
  
  async onPairListDevices({ oAuth2Client }) {
    const things = await oAuth2Client.getThings();
    return things.map(thing => {
      return {
        name: thing.name,
        data: {
          id: thing.id,
        },
      }
    });
  }
	
}
```

### Device

Finally, your `/drivers/<driver_id>/device.js` should look like this:

```javascript
const { OAuth2Device } = require('homey-oauth2app');

module.exports = class MyBrandDevice extends OAuth2Device {
  
  async onOAuth2Init() {
    await this.oAuth2Client.getThingState()
      .then(async state => {
        await this.setCapabilityValue('onoff', !!state.on);
      });
  }

  async onOAuth2Deleted() {
    // Clean up here
  }
	
}
```