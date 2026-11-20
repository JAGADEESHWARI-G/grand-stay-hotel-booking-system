const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE - Add Booking
router.post("/", (req, res) => {

    const {
        customer_id,
        room_id,
        check_in,
        check_out,
        guests,
        number_of_rooms
    } = req.body;

    // Validation
    if (
        !customer_id ||
        !room_id ||
        !check_in ||
        !check_out ||
        !guests ||
        !number_of_rooms
    ) {
        return res.status(400).json({
            message: "All booking fields are required"
        });
    }

    if (new Date(check_in) >= new Date(check_out)) {
        return res.status(400).json({
            message: "Check-out must be after check-in"
        });
    }

    if (guests < 1 || number_of_rooms < 1) {
        return res.status(400).json({
            message: "Invalid number of guests or rooms"
        });
    }

    // Check customer and room
    const checkSql = `
        SELECT r.id, r.capacity, r.availability
        FROM customers c
        JOIN rooms r ON r.id = ?
        WHERE c.id = ?
    `;

    db.query(checkSql, [room_id, customer_id], (err, result) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Customer or room not found"
            });
        }

        const room = result[0];

        // Check room availability
        if (Number(room.availability) !== 1) {
            return res.status(400).json({
                message: "Room is not available"
            });
        }

        // Check guest capacity
        if (
            Number(guests) >
            Number(room.capacity) * Number(number_of_rooms)
        ) {
            return res.status(400).json({
                message: "Guest count exceeds room capacity"
            });
        }

        // Check existing bookings
        const availabilitySql = `
            SELECT id FROM bookings
            WHERE room_id = ?
            AND booking_status != 'Cancelled'
            AND check_in < ?
            AND check_out > ?
        `;

        db.query(
            availabilitySql,
            [room_id, check_out, check_in],
            (err, bookings) => {

                if (err) {
                    console.log(err);

                    return res.status(500).json({
                        message: "Availability check failed"
                    });
                }

                if (bookings.length > 0) {
                    return res.status(409).json({
                        message: "Room is already booked for these dates"
                    });
                }

                // Insert booking
                const insertSql = `
                    INSERT INTO bookings
                    (
                        customer_id,
                        room_id,
                        check_in,
                        check_out,
                        guests,
                        number_of_rooms,
                        booking_status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, 'Confirmed')
                `;

                db.query(
                    insertSql,
                    [
                        customer_id,
                        room_id,
                        check_in,
                        check_out,
                        guests,
                        number_of_rooms
                    ],
                    (err, insertResult) => {

                        if (err) {
                            console.log(err);

                            return res.status(500).json({
                                message: "Booking failed"
                            });
                        }

                        res.status(201).json({
                            message: "Room booked successfully!",
                            bookingId: insertResult.insertId
                        });

                    }
                );

            }
        );

    });

});


// READ - Get All Bookings
router.get("/", (req, res) => {

    const sql = `
        SELECT b.*, c.name, c.gmail, r.room_type, r.price
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN rooms r ON b.room_id = r.id
        ORDER BY b.id DESC
    `;

    db.query(sql, (err, result) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Failed to retrieve bookings"
            });
        }

        res.json(result);

    });

});


// READ - Get Booking By ID
router.get("/:id", (req, res) => {

    const sql = `
        SELECT b.*, c.name, c.gmail, c.phone,
               r.room_type, r.price
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN rooms r ON b.room_id = r.id
        WHERE b.id = ?
    `;

    db.query(sql, [req.params.id], (err, result) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Failed to retrieve booking"
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.json(result[0]);

    });

});


// UPDATE - Update Booking
router.put("/:id", (req, res) => {

    const {
        check_in,
        check_out,
        guests,
        number_of_rooms
    } = req.body;

    if (!check_in || !check_out || !guests || !number_of_rooms) {
        return res.status(400).json({
            message: "All booking fields are required"
        });
    }

    if (new Date(check_in) >= new Date(check_out)) {
        return res.status(400).json({
            message: "Invalid check-in and check-out dates"
        });
    }

    if (guests < 1 || number_of_rooms < 1) {
        return res.status(400).json({
            message: "Invalid number of guests or rooms"
        });
    }

    const sql = `
        UPDATE bookings
        SET check_in = ?,
            check_out = ?,
            guests = ?,
            number_of_rooms = ?
        WHERE id = ?
        AND booking_status != 'Cancelled'
    `;

    db.query(
        sql,
        [
            check_in,
            check_out,
            guests,
            number_of_rooms,
            req.params.id
        ],
        (err, result) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Booking update failed"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Booking not found or already cancelled"
                });
            }

            res.json({
                message: "Booking updated successfully!"
            });

        }
    );

});


// CANCEL - Cancel Booking
router.patch("/:id/cancel", (req, res) => {

    const sql = `
        UPDATE bookings
        SET booking_status = 'Cancelled'
        WHERE id = ?
        AND booking_status != 'Cancelled'
    `;

    db.query(sql, [req.params.id], (err, result) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Cancellation failed"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Booking not found or already cancelled"
            });
        }

        res.json({
            message: "Booking cancelled successfully!"
        });

    });

});


// DELETE - Delete Booking
router.delete("/:id", (req, res) => {

    db.query(
        "DELETE FROM bookings WHERE id = ?",
        [req.params.id],
        (err, result) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Booking deletion failed"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Booking not found"
                });
            }

            res.json({
                message: "Booking deleted successfully!"
            });

        }
    );

});
// UPDATE BOOKING STATUS
router.put("/:id/status", async (req, res) => {
    try {
        const { booking_status } = req.body;
        const bookingId = req.params.id;

        if (!["Confirmed", "Cancelled"].includes(booking_status)) {
            return res.status(400).json({
                message: "Invalid booking status"
            });
        }

        const [result] = await db.query(
            "UPDATE bookings SET booking_status = ? WHERE id = ?",
            [booking_status, bookingId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.json({
            message: "Booking status updated successfully",
            booking_status
        });

    } catch (error) {
        console.error("Booking status update error:", error);

        res.status(500).json({
            message: "Failed to update booking status"
        });
    }
});

// EXPORT ROUTER
module.exports = router;