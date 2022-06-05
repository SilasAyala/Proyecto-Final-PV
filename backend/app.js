const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origgin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATH, DELETE');
  next();
});
app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("No se encontró la ruta.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "Ocurrió un error desconosido!" });
});

mongoose
  .connect(
    `mongodb://sayala:PPpsS3KH75y4iMj9@clusterzero-shard-00-00.iw9uc.mongodb.net:27017,clusterzero-shard-00-01.iw9uc.mongodb.net:27017,clusterzero-shard-00-02.iw9uc.mongodb.net:27017/MyPlacesApp?ssl=true&replicaSet=atlas-g5pkc0-shard-0&authSource=admin&retryWrites=true&w=majority`
    ,{useNewUrlParser: true})
  .then(() => {
    app.listen(5001);
  })
  .catch(err => {
    console.log(err);
  });
