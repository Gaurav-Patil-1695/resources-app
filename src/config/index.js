'use strict';

const dotenv = require('dotenv');
const Joi = require('joi');

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().integer().positive().default(3000),

  // Database
  DB_CLIENT: Joi.string().default('pg'),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().integer().positive().default(5432),
  DB_USER: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default(''),
  DB_NAME: Joi.string().default('app'),
  DB_POOL_MIN: Joi.number().integer().min(0).default(2),
  DB_POOL_MAX: Joi.number().integer().positive().default(10),

  // Elasticsearch
  ES_NODE: Joi.string().uri().default('http://localhost:9200'),
  ES_USERNAME: Joi.string().allow('').default(''),
  ES_PASSWORD: Joi.string().allow('').default(''),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_RESET_TTL: Joi.string().default('1h'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().positive().default(60000),
  RATE_LIMIT_MAX: Joi.number().integer().positive().default(100),
})
  .unknown(true)
  .options({ abortEarly: false });

const { error, value: env } = schema.validate(process.env);

if (error) {
  const details = error.details.map((d) => d.message).join(', ');
  throw new Error(`Config validation error: ${details}`);
}

module.exports = {
  env: env.NODE_ENV,
  port: env.PORT,

  db: {
    client: env.DB_CLIENT,
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    name: env.DB_NAME,
    pool: {
      min: env.DB_POOL_MIN,
      max: env.DB_POOL_MAX,
    },
  },

  elasticsearch: {
    node: env.ES_NODE,
    username: env.ES_USERNAME,
    password: env.ES_PASSWORD,
  },

  jwt: {
    secret: env.JWT_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    resetTtl: env.JWT_RESET_TTL,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },
};
