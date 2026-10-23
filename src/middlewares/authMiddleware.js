// middleware to authenticate JWT tokens

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : header;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user exists and check if account is banned
    const user = await User.findById(decoded.id).select("isBanned role");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Account suspended" });
    }

    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized" });
  }
};

module.exports = authMiddleware;
