const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const generateResetToken = () => {
  return jwt.sign({}, process.env.JWT_SECRET, {
    expiresIn: '10m',
  });
};

module.exports = { generateToken, generateResetToken };
