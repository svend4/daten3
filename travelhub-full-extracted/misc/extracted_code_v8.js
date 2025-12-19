const Joi = require('joi');

/**
 * Валидация поиска авиабилетов
 */
exports.validateFlightSearch = (data) => {
  const schema = Joi.object({
    origin: Joi.string()
      .length(3)
      .uppercase()
      .required()
      .messages({
        'string.length': 'Origin must be a 3-letter IATA code',
        'string.uppercase': 'Origin must be uppercase',
        'any.required': 'Origin is required'
      }),
    
    destination: Joi.string()
      .length(3)
      .uppercase()
      .required()
      .messages({
        'string.length': 'Destination must be a 3-letter IATA code'
      }),
    
    departDate: Joi.date()
      .iso()
      .min('now')
      .required()
      .messages({
        'date.min': 'Departure date must be in the future',
        'date.format': 'Date must be in ISO format (YYYY-MM-DD)'
      }),
    
    returnDate: Joi.date()
      .iso()
      .min(Joi.ref('departDate'))
      .optional()
      .messages({
        'date.min': 'Return date must be after departure date'
      }),
    
    adults: Joi.number()
      .integer()
      .min(1)
      .max(9)
      .default(1),
    
    children: Joi.number()
      .integer()
      .min(0)
      .max(9)
      .default(0),
    
    infants: Joi.number()
      .integer()
      .min(0)
      .max(9)
      .default(0),
    
    cabinClass: Joi.string()
      .valid('economy', 'premium_economy', 'business', 'first')
      .default('economy')
  });

  const { error, value } = schema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  return {
    isValid: !error,
    errors: error?.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    })),
    data: value
  };
};

/**
 * Валидация поиска отелей
 */
exports.validateHotelSearch = (data) => {
  const schema = Joi.object({
    destination: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Destination must be at least 2 characters',
        'any.required': 'Destination is required'
      }),
    
    checkIn: Joi.date()
      .iso()
      .min('now')
      .required()
      .messages({
        'date.min': 'Check-in date must be in the future'
      }),
    
    checkOut: Joi.date()
      .iso()
      .min(Joi.ref('checkIn'))
      .required()
      .messages({
        'date.min': 'Check-out date must be after check-in date'
      }),
    
    adults: Joi.number()
      .integer()
      .min(1)
      .max(30)
      .default(2),
    
    children: Joi.number()
      .integer()
      .min(0)
      .max(10)
      .default(0),
    
    rooms: Joi.number()
      .integer()
      .min(1)
      .max(30)
      .default(1),
    
    currency: Joi.string()
      .length(3)
      .uppercase()
      .default('USD'),
    
    stars: Joi.array()
      .items(Joi.number().integer().min(1).max(5))
      .optional()
  });

  const { error, value } = schema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  return {
    isValid: !error,
    errors: error?.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    })),
    data: value
  };
};

/**
 * Валидация поиска авто
 */
exports.validateCarSearch = (data) => {
  const schema = Joi.object({
    location: Joi.string()
      .min(2)
      .required(),
    
    pickupDate: Joi.date()
      .iso()
      .min('now')
      .required(),
    
    dropoffDate: Joi.date()
      .iso()
      .min(Joi.ref('pickupDate'))
      .required(),
    
    pickupTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .default('10:00'),
    
    dropoffTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .default('10:00'),
    
    driverAge: Joi.number()
      .integer()
      .min(18)
      .max(99)
      .default(30)
  });

  const { error, value } = schema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  return {
    isValid: !error,
    errors: error?.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    })),
    data: value
  };
};
