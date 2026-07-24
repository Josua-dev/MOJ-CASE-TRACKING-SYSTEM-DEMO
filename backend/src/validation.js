/**
 * Request validation schemas using Joi
 */
const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'A valid email address is required.',
    'any.required': 'Email is required.',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters.',
    'any.required': 'Password is required.',
  }),
});

const registerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.min': 'Name is required.',
    'any.required': 'Name is required.',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'A valid email address is required.',
    'any.required': 'Email is required.',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters.',
    'string.max': 'Password must not exceed 128 characters.',
    'any.required': 'Password is required.',
  }),
  role: Joi.string().valid('admin', 'clerk').default('clerk'),
});

const createCaseSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required().messages({
    'string.min': 'Case title is required.',
    'any.required': 'Case title is required.',
  }),
  case_type: Joi.string()
    .valid('Criminal', 'Civil', 'Family', 'Commercial', 'Labour')
    .default('Criminal'),
  status: Joi.string()
    .valid('Open', 'Active', 'Pending', 'Closed')
    .default('Open'),
  priority: Joi.string()
    .valid('Low', 'Medium', 'High')
    .default('Medium'),
  plaintiff: Joi.string().trim().min(1).max(200).required().messages({
    'string.min': 'Plaintiff name is required.',
    'any.required': 'Plaintiff name is required.',
  }),
  defendant: Joi.string().trim().min(1).max(200).required().messages({
    'string.min': 'Defendant name is required.',
    'any.required': 'Defendant name is required.',
  }),
  presiding_officer: Joi.string().trim().max(200).allow('').default(''),
  hearing_date: Joi.date().iso().allow('', null),
  next_action: Joi.string().trim().max(500).allow('').default(''),
  description: Joi.string().trim().max(5000).allow('').default(''),
});

const updateCaseSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  case_type: Joi.string().valid('Criminal', 'Civil', 'Family', 'Commercial', 'Labour'),
  status: Joi.string().valid('Open', 'Active', 'Pending', 'Closed'),
  priority: Joi.string().valid('Low', 'Medium', 'High'),
  plaintiff: Joi.string().trim().min(1).max(200),
  defendant: Joi.string().trim().min(1).max(200),
  presiding_officer: Joi.string().trim().max(200).allow(''),
  hearing_date: Joi.date().iso().allow('', null),
  next_action: Joi.string().trim().max(500).allow(''),
  description: Joi.string().trim().max(5000).allow(''),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

const noteSchema = Joi.object({
  note: Joi.string().trim().min(1).max(2000).required().messages({
    'string.min': 'Note cannot be empty.',
    'any.required': 'Note is required.',
  }),
});

/**
 * Middleware factory: validates req.body against a Joi schema
 */
function validate(schema) {
  return (req, res, next) => {
    const { error: err, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (err) {
      const details = err.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return res.status(400).json({
        success: false,
        error: 'Validation failed.',
        details,
      });
    }
    req.body = value; // use sanitised/coerced values
    next();
  };
}

const createVisSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required().messages({
    'string.min': 'Visualisation name is required.',
    'any.required': 'Visualisation name is required.',
  }),
  description: Joi.string().trim().max(2000).allow('').default(''),
  chart_type: Joi.string().max(50).default('bar'),
  data_source: Joi.string().max(100).default('cases/byType'),
  config: Joi.object().default({}),
  colour_theme: Joi.string().max(50).default('default'),
  chart_size: Joi.string().valid('small', 'medium', 'large', 'full').default('medium'),
  animation_enabled: Joi.boolean().default(true),
  auto_refresh: Joi.boolean().default(false),
  refresh_interval: Joi.number().integer().min(0).default(0),
  category: Joi.string().trim().max(100).allow('').default(''),
  tags: Joi.string().trim().max(500).allow('').default(''),
});

const updateVisSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200),
  description: Joi.string().trim().max(2000).allow(''),
  chart_type: Joi.string().max(50),
  data_source: Joi.string().max(100),
  config: Joi.object(),
  colour_theme: Joi.string().max(50),
  chart_size: Joi.string().valid('small', 'medium', 'large', 'full'),
  animation_enabled: Joi.boolean(),
  auto_refresh: Joi.boolean(),
  refresh_interval: Joi.number().integer().min(0),
  fullscreen_support: Joi.boolean(),
  enabled: Joi.boolean(),
  is_favourite: Joi.boolean(),
  category: Joi.string().trim().max(100).allow(''),
  tags: Joi.string().trim().max(500).allow(''),
  filters: Joi.array().items(Joi.object({
    filter_type: Joi.string().max(100).required(),
    filter_value: Joi.string().max(500).required(),
    enabled: Joi.boolean().default(true),
  })),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

const createPlaylistSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required().messages({
    'string.min': 'Playlist name is required.',
    'any.required': 'Playlist name is required.',
  }),
  description: Joi.string().trim().max(2000).allow('').default(''),
  items: Joi.array().items(Joi.object({
    visualisation_id: Joi.string().uuid().required(),
    duration_seconds: Joi.number().integer().min(5).max(3600).default(30),
  })),
});

module.exports = {
  loginSchema,
  registerSchema,
  createCaseSchema,
  updateCaseSchema,
  noteSchema,
  createVisSchema,
  updateVisSchema,
  createPlaylistSchema,
  validate,
};
