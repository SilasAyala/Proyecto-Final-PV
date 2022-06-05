const express = require('express');
const { check } = require('express-validator');

const usersController = require('../controllers/users-controllers');
const placesController = require('../controllers/places-controllers')

const router = express.Router();

router.get('/', placesController.getPlaces);

router.post(
  '/signup',
  [
    check('name')
      .not()
      .isEmpty(),
    check('email')
      .normalizeEmail()
      .isEmail(),
    check('password').isLength({ min: 6 })
  ],
  usersController.signup
);

router.post('/login', usersController.login);

module.exports = router;
