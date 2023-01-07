const logErrors = (err, req, res, next) => {
  console.error(err.stack);
  next(err);
};

const validationError = (err, req, res, next) => {
  if (res.statusCode === 200) {
    // validation error
    res.status(400);
  }
  next(err);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode ? res.statusCode : 500;
  res.status(statusCode);

  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null,
  });
};

export { logErrors, validationError, errorHandler };
