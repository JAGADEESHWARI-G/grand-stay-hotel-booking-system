const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE - Add Room
router.post("/", (req, res) => {

    const {
        room_type,
        price,
        capacity,
        availability,
        description
    } = req.body;

    if (!room_type || !price || !capacity) {
        return res.status(400).json({
            message: "Room details are required"
        });
    }

    const sql = `
        INSERT INTO rooms
        (room_type, price, capacity, availability, description)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        room_type,
        price,
        capacity,
        availability ?? 1,
        description || ""
    ], (err, result) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Failed to add room"
            });
        }

        res.status(201).json({
            message: "Room added successfully!",
            roomId: result.insertId
        });

    });

});


// READ - Get All Rooms
router.get("/", (req, res) => {

    const sql = "SELECT * FROM rooms";

    db.query(sql, (err, result) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Failed to retrieve rooms"
            });
        }

        res.json(result);

    });

});


// READ - Get Available Rooms
router.get("/available", (req, res) => {

    const sql = `
        SELECT * FROM rooms
        WHERE availability = 1
    `;

    db.query(sql, (err, result) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Failed to retrieve available rooms"
            });
        }

        res.json(result);

    });

});


// READ - Get Room By ID
router.get("/:id", (req, res) => {

    db.query(
        "SELECT * FROM rooms WHERE id = ?",
        [req.params.id],
        (err, result) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Failed to retrieve room"
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    message: "Room not found"
                });
            }

            res.json(result[0]);

        }
    );

});


// UPDATE - Update Room
router.put("/:id", (req, res) => {

    const {
        room_type,
        price,
        capacity,
        availability,
        description
    } = req.body;

    const sql = `
        UPDATE rooms
        SET room_type = ?,
            price = ?,
            capacity = ?,
            availability = ?,
            description = ?
        WHERE id = ?
    `;

    db.query(sql, [
        room_type,
        price,
        capacity,
        availability,
        description,
        req.params.id
    ], (err, result) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Room update failed"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        res.json({
            message: "Room updated successfully!"
        });

    });

});


// DELETE - Delete Room
router.delete("/:id", (req, res) => {

    db.query(
        "DELETE FROM rooms WHERE id = ?",
        [req.params.id],
        (err, result) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Room deletion failed"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Room not found"
                });
            }

            res.json({
                message: "Room deleted successfully!"
            });

        }
    );

});


// Export Router
module.exports = router;