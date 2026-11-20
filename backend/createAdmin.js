const bcrypt = require("bcryptjs");
const db = require("./db");

// Change these details before running
const adminName = "Jagadeeshwari ";
const adminEmail = "jagadha2007@gmail.com";
const adminPassword = "jaga_1117";

async function createAdmin() {
    try {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const sql = `
            INSERT INTO admins (name, email, password)
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [adminName, adminEmail, hashedPassword],
            (err, result) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        console.log("Admin account already exists!");
                    } else {
                        console.log("Error creating admin:", err);
                    }
                } else {
                    console.log("Admin account created successfully!");
                    console.log("Admin Email:", adminEmail);
                }

                db.end();
            }
        );

    } catch (error) {
        console.log("Error:", error);
        db.end();
    }
}

createAdmin();