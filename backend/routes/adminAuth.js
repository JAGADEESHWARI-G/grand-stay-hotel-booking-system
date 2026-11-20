const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

// =====================================
// ADMIN LOGIN
// =====================================

router.post("/login", (req, res) => {

    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required."
        });
    }

    // Find admin
    const sql = "SELECT * FROM admins WHERE email = ?";

    db.query(sql, [email.trim()], async (err, results) => {

        if (err) {
            console.error("Login Database Error:", err);

            return res.status(500).json({
                message: "Database error."
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const admin = results[0];

        try {

            // Compare password with hashed password
            const isMatch = await bcrypt.compare(
                password,
                admin.password
            );

            if (!isMatch) {
                return res.status(401).json({
                    message: "Invalid email or password."
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: admin.id,
                    email: admin.email,
                    role: "admin"
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "2h"
                }
            );

            return res.status(200).json({
                message: "Admin login successful!",
                token: token,
                admin: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email
                }
            });

        } catch (error) {

            console.error("Authentication Error:", error);

            return res.status(500).json({
                message: "Authentication failed."
            });

        }

    });

});

module.exports = router;