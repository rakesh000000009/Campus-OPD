const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const UserModel = require('../models/userModel');
const DoctorModel = require('../models/doctorModel');

class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      let doctorProfile = null;
      if (user.role === 'DOCTOR') {
        doctorProfile = await DoctorModel.findByUserId(user.id);
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          student_id: user.student_id,
          doctorId: doctorProfile ? doctorProfile.id : null,
          doctorRoom: doctorProfile ? doctorProfile.room_number : null,
          specialization: doctorProfile ? doctorProfile.specialization : null
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async register(req, res, next) {
    try {
      const { name, email, password, student_id } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const newUser = await UserModel.create({
        name,
        email,
        password_hash,
        role: 'STUDENT',
        student_id: student_id || `STU${Date.now().toString().slice(-6)}`
      });

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return res.status(201).json({
        message: 'Registration successful',
        token,
        user: newUser
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      const user = req.user;
      let doctorProfile = null;
      if (user.role === 'DOCTOR') {
        doctorProfile = await DoctorModel.findByUserId(user.id);
      }

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          student_id: user.student_id,
          doctorId: doctorProfile ? doctorProfile.id : null,
          doctorRoom: doctorProfile ? doctorProfile.room_number : null,
          specialization: doctorProfile ? doctorProfile.specialization : null
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
