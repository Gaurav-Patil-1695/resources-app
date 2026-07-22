'use strict';

const { Client } = require('@elastic/elasticsearch');
const config = require('./index');

const clientConfig = {
  node: config.elasticsearch.node,
};

if (config.elasticsearch.username && config.elasticsearch.password) {
  clientConfig.auth = {
    username: config.elasticsearch.username,
    password: config.elasticsearch.password,
  };
}

const esClient = new Client(clientConfig);

module.exports = esClient;
