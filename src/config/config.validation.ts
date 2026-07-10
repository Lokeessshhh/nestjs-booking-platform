import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required().messages({
    'any.required': 'DATABASE_URL is required to connect to the database.',
  }),
  JWT_ACCESS_SECRET: Joi.string().required().messages({
    'any.required': 'JWT_ACCESS_SECRET is required for security.',
  }),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required().messages({
    'any.required': 'JWT_REFRESH_SECRET is required for refresh token security.',
  }),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
});
