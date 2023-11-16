var jwt = require('jsonwebtoken');
const JWT_SECRET = 'armoni@Yu';

const fetchuser = (req, res, next) => {
  const token = req.headers['auth-token'];

  if (!token) {
    return res.status(401).send({ error: "Please authenticate using a valid token" });
  }

  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user;
    next();
  } catch (error) {
    return res.status(401).send({ error: "Please authenticate using a valid token" });
  }
};

module.exports = fetchuser;
