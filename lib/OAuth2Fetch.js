'use strict';

module.exports = Number(process.versions.node.split('.')[0]) >= 18
  ? fetch // Use native fetch on Node 18 and above
  : require('node-fetch');
