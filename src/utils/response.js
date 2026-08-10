const success = (res, data = {}, message = "Success", statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const created = (res, data = {}, message = "Created successfully") =>
  res.status(201).json({ success: true, message, data });

const paginated = (res, data, pagination, message = "Success") =>
  res.status(200).json({ success: true, message, data, pagination });

const error = (res, message = "An error occurred", statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

const notFound = (res, message = "Resource not found") =>
  res.status(404).json({ success: false, message });

const unauthorized = (res, message = "Unauthorized") =>
  res.status(401).json({ success: false, message });

const forbidden = (res, message = "Forbidden") =>
  res.status(403).json({ success: false, message });

const badRequest = (res, message = "Bad request", errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(400).json(body);
};

module.exports = { success, created, paginated, error, notFound, unauthorized, forbidden, badRequest };
