const uuid = require('uuid/v4');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');

const getPlaces = async (req, res, next) => {
  let users;
  try {
    users = await Place.find();
  } catch (err) {
    const error = new HttpError(
      'No se pudo encontrar al usuario solicitado.',
      500
    );
    return next(error);
  }
  res.json({ users: users.map(user => user.toObject({ getters: true })) });
};


const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      'Algo sucedió, intenta de nuevo.',
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      'No se encontró el Place para el pid solicitado.',
      404
    );
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
  //res.json({ places: place.places.map(placel => placel.toObject({ getters: true })) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // let places;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (err) {
    const error = new HttpError(
      'Error al leer el Place, intenta de nuevo.',
      500
    );
    return next(error);
  }

  // if (!places || places.length === 0) {
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError('No se encontraron Places para el usuario especificado.', 404)
    );
  }

  res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Datos invalidos, intenta de nuevo.', 422)
    );
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Semuc_Champey%2C_Guatemala.jpg/1200px-Semuc_Champey%2C_Guatemala.jpg',
    creator
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      'Falló la creación del place, intenta de nuevo.',
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError('No se encontró usuario con el uid especificado.', 404);
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess }); 
    user.places.push(createdPlace); 
    await user.save({ session: sess }); 
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Falló la creación del Place, por favor intenta de nuevo.',
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Datos invalidos, revisalos e intanta de nuevo.', 422)
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      'Algo Sucedio al actualizar el Place, intenta de nuevo.',
      500
    );
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      'Algo salió mal, intenta de nuevo.',
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Algo salió mal al eliminar el Place, intenta de nuevo.',
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError('No se encontró el Place con el pid especificado.', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({session: sess});
    place.creator.places.pull(place);
    await place.creator.save({session: sess});
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Algo salió mal al eliminar el Place.',
      500
    );
    return next(error);
  }
  
  res.status(200).json({ message: 'Place Borrado.' });
};

exports.getPlaces = getPlaces;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
