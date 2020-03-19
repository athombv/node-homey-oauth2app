# Homey OAuth2

This module does the heavy lifting for a [Homey App](https://developer.athom.com) that talks to any OAuth2 Web API.

## Installation

Run 

```
$ homey app plugin add
```

Then select `oauth2`.

## Usage

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

Then create a file `/lib/MyBrandOAuth2Client` and make it extend `OAuth2Client`:

```javascript
const { OAuth2Client, OAuth2Error } = require('homey-oauth2app');

module.exports = class MyBrandOAuth2Client extends OAuth2Client {

  // Overload what needs to be overloaded here

  async onHandleNotOK({ body }) {
      throw new OAuth2Error(body.error);
  }

  async getMyThings({ color }) {
    return this.get({
      path: '/things',
      query: { color },
    });
  }

  async updateMyThing({ id, thing }) {
    return this.put({
      path: `/thing/${id}`,
      json: { thing },
    });
  }

}
```

By default, `OAuth2Client` will work with any API that follows [RFC 6749](https://tools.ietf.org/html/rfc6749). In case your API differs, there are many methods you can overload to change the behavior.

All methods starting with `on` (for example `onRequestError`) are meant to be overloaded. Overloading any other method might break in the future, so be careful.