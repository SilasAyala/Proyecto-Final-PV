const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    const error = new HttpError(
      'No se pudo encontrar al usuario solicitado.',
      500
    );
    return next(error);
  }
  res.json({ users: users.map(user => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  console.log(req.body);
  console.log(errors);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Datos invalidos, intenta de nuevo.', 422)
    );
  }
  const { name, email, password } = req.body;
  console.log(`Datos: ${name}, ${email}, ${password}`);
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Falló en SignUp, intenta de nuevo.',
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'El usuario ya existe, has login.',
      422
    );
    return next(error);
  }

  //creamos hashde contraseña
  let hashedPassword;
  try{
    hashedPassword = await bcrypt.hash(password, 12);
  } catch(err){
    const error = 
      HttpError('No se pudo crear el usuario, intenta de nuevo.', 500);
    return next(error);  
  }

  const createdUser = new User({
    name,
    email,
    image: 'https://st2.depositphotos.com/2931363/6511/i/600/depositphotos_65116237-stock-photo-happy-young-man-in-shirt.jpg',
    password: hashedPassword, 
    places: []
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      'Fallo en Signup, por favor intenta de nuevo.',
      500
    );
    return next(error);
  }

  //Auth
  let token;
  try{
    token = jwt.sign(
      {userId: createdUser.id, email: createdUser.email},
      'supersecreto_no_compartir_por_nada_de_nada',
      {expiresIn: '1h'}
    )
  } catch(err) {
    console.log(err);
    const error = new HttpError(
      'Fallo en Signup, por favor intenta de nuevo.',
      500
    );
    return next(error);
  }

  res
  .status(201)
  .json(
      { userId: createdUser.id,
        email: createdUser.email,
        token: token 
      }
      ); // createdUser includes the PW
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Fallo en Loggin, por favor intenta de nuevo.',
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      'Credenciales invalidas, revisalas e intenta de nuevo.',
      401
    );
    return next(error);
  }

  //validación de contraseña
  let isValidPassword = false;
  try{
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch(err){
    console.log(err);
    const error =
      new HttpError('No se pudieron validad los datos, intente de nuevo.', 500);
    return next(error);
  }

  if(!isValidPassword){
    const error = 
      new HttpError('Credenciales invalidad, revisalas e intanta de nuevo', 401);
    return next(error);
  }

  //lógica de manejo de toknes.
  let token;
  try{
    token = jwt.sign(
      {userId: existingUser.id, email: existingUser.email},
      'supersecreto_no_compartir_por_nada_de_nada',
      {expiresIn: '1h'}
    );
    console.log(token);
    console.log('----------');
  } catch(err){
    const error = 
      new HttpError('Falló el Login, intenta de nuevo.', 500);
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
