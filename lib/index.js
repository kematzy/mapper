/**
 * Module dependencies.
 */
'use strict';

var Client = require('./client');
var Dao = require('./dao');

/**
 * Mapper.
 */
var Mapper = function() {
  this.version = '0.2.0';
  return this;
};


/**
 * Connects to the database.
 *
 * @see Client
 */
Mapper.prototype.connect = function(config, options) {
  options = options || {};
  if (!options.strict) options.strict = false;
  var client = new Client(config, options);
  client.connect()
  this.client = client;
  this.options = options;
  return this;
};


/**
 * Map a table to a data access object.
 *
 * @see Dao
 */
Mapper.prototype.map = function(tableName, table_options) {
  table_options = table_options || { primaryKey: 'id', timestamps: false };
  return new Dao({client: this.client, tableName: tableName, primaryKey: table_options.primaryKey, strict: this.options.strict, table_options: table_options });
};


module.exports = new Mapper();
