const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AdminUser = require("../models/AdminUser");

const createToken = (admin_id) =>
  jwt.sign({ admin_id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/register-admin
module.exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await AdminUser.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const admin = await AdminUser.create({ name, email, password, role });
    const token = createToken(admin._id);

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /api/auth/login
module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await AdminUser.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (!admin.isActive) {
      return res.status(403).json({ error: "Account is inactive" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createToken(admin._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/auth/me
module.exports.me = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      admin: req.admin,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /api/auth/logout
module.exports.logout = async (req, res) => {
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};
