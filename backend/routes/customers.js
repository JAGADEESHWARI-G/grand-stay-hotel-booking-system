const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE - Register Customer
router.post("/", (req, res) => {

    const {
        name,
        gmail,
        phone,
        address,
        city,
        state,
        pincode
    } = req.body;

    if (!name || !gmail || !phone || !address ||
        !city || !state || !pincode) {

        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const sql = `
        INSERT INTO customers
        (name, gmail, phone, address, city, state, pincode)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [name, gmail, phone, address, city, state, pincode],
        (err, result) => {

            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        message: "Email already registered"
                    });
                }

                return res.status(500).json({
                    message: "Registration failed"
                });
            }

            res.status(201).json({
                message: "Customer registered successfully!",
                customerId: result.insertId
            });

        }
    );

});


// READ - Get All Customers
router.get("/", (req, res) => {

    const sql = "SELECT * FROM customers";

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Error retrieving customers"
            });
        }

        res.json(result);

    });

});


// READ - Get Customer By ID
router.get("/:id", (req, res) => {

    db.query(
        "SELECT * FROM customers WHERE id = ?",
        [req.params.id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: "Error retrieving customer"
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    message: "Customer not found"
                });
            }

            res.json(result[0]);

        }
    );

});


// UPDATE - Update Customer
router.put("/:id", (req, res) => {

    const {
        name,
        gmail,
        phone,
        address,
        city,
        state,
        pincode
    } = req.body;

    const sql = `
        UPDATE customers
        SET name=?, gmail=?, phone=?, address=?,
            city=?, state=?, pincode=?
        WHERE id=?
    `;

    db.query(
        sql,
        [name, gmail, phone, address, city, state, pincode, req.params.id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: "Update failed"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Customer not found"
                });
            }

            res.json({
                message: "Customer updated successfully!"
            });

        }
    );

});


// DELETE - Delete Customer
router.delete("/:id", (req, res) => {

    db.query(
        "DELETE FROM customers WHERE id = ?",
        [req.params.id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: "Delete failed"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Customer not found"
                });
            }

            res.json({
                message: "Customer deleted successfully!"
            });

        }
    );

});

module.exports = router;