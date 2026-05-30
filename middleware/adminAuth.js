const jwt = require("jsonwebtoken");
const AdminUser = require("../models/AdminUser");

const adminAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  const token = authorization.split(" ")[1];

  try {
    const { admin_id } = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await AdminUser.findById(admin_id).select("-password -__v");
    if (!req.admin) {
      return res.status(401).json({ error: "Admin not found" });
    }
    if (!req.admin.isActive) {
      return res.status(403).json({ error: "Admin account is inactive" });
    }
    next();
  } catch (err) {
    res.status(401).json({ error: "Request is not authorized" });
  }
};

module.exports = adminAuth;
