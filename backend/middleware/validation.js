const { check } = require('express-validator');
const validate = require('./validate');

const signupRules = [
  check('name', 'Name is required').notEmpty().trim(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  check('role', 'Role must be User, Admin, Owner or Employee').optional().isIn(['User', 'Admin', 'Owner', 'Employee']),
];

const loginRules = [
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password is required').notEmpty(),
];

const validateSignup = validate(signupRules);
const validateLogin = validate(loginRules);

module.exports = {
  validateSignup,
  validateLogin,
};
