const { validationResult, body, query } = require('express-validator');

const validateGeneration = [
  body('prompt')
    .trim()
    .notEmpty()
    .withMessage('Prompt is required')
    .isLength({ max: 1000 })
    .withMessage('Prompt must be less than 1000 characters')
    .escape(),
  
  body('model')
    .optional()
    .isIn(['stable-diffusion', 'realistic-vision', 'dreamlike-diffusion', 'openjourney', 'anything-v3'])
    .withMessage('Invalid model selection'),
  
  body('width')
    .optional()
    .isInt({ min: 256, max: 1024 })
    .withMessage('Width must be between 256 and 1024')
    .toInt(),
  
  body('height')
    .optional()
    .isInt({ min: 256, max: 1024 })
    .withMessage('Height must be between 256 and 1024')
    .toInt(),
  
  body('steps')
    .optional()
    .isInt({ min: 10, max: 100 })
    .withMessage('Steps must be between 10 and 100')
    .toInt(),
  
  body('guidanceScale')
    .optional()
    .isFloat({ min: 1, max: 20 })
    .withMessage('Guidance scale must be between 1 and 20')
    .toFloat(),
  
  body('style')
    .optional()
    .isString()
    .trim()
    .escape(),
  
  body('stylePreset')
    .optional()
    .isString()
    .trim()
    .escape(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

const validateImg2Img = [
  body('prompt')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .escape(),
  
  body('strength')
    .optional()
    .isFloat({ min: 0.1, max: 1.0 })
    .withMessage('Strength must be between 0.1 and 1.0')
    .toFloat(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

module.exports = { validateGeneration, validateImg2Img };
