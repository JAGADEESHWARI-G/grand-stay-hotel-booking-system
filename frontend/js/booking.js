const API_URL = "http://localhost:5000/api";

const bookingForm = document.getElementById("bookingForm");
const roomSelect = document.getElementById("roomId");
const bookingAlert = document.getElementById("bookingAlert");

let availableRooms = [];

// Display alert messages
function showBookingAlert(message, type) {
    bookingAlert.innerHTML = `
        <div class="alert alert-${type}" role="alert">
            ${message}
        </div>
    `;
}

// Get today's date in local format
function getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Set minimum booking dates
const checkInInput = document.getElementById("checkIn");
const checkOutInput = document.getElementById("checkOut");

checkInInput.min = getToday();
checkOutInput.min = getToday();

checkInInput.addEventListener("change", () => {
    checkOutInput.min = checkInInput.value;

    if (checkOutInput.value && checkOutInput.value <= checkInInput.value) {
        checkOutInput.value = "";
    }
});


// LOAD AVAILABLE ROOMS
async function loadBookingRooms() {
    try {
        const response = await fetch(`${API_URL}/rooms/available`);

        if (!response.ok) {
            throw new Error("Unable to load rooms");
        }

        availableRooms = await response.json();

        roomSelect.innerHTML = `
            <option value="">Select a room</option>
        `;

        availableRooms.forEach(room => {
            const option = document.createElement("option");

            option.value = room.id;
            option.textContent =
                `${room.room_type} - ₹${room.price} per night`;

            roomSelect.appendChild(option);
        });

        // Select room from homepage Book Now button
        const params = new URLSearchParams(window.location.search);
        const selectedRoomId = params.get("roomId");

        if (selectedRoomId) {
            roomSelect.value = selectedRoomId;
        }

    } catch (error) {
        showBookingAlert(error.message, "danger");
    }
}

loadBookingRooms();


// SUBMIT BOOKING FORM
bookingForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const gmail = document.getElementById("gmail").value.trim();

    const roomId = Number(roomSelect.value);

    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;

    const guests = Number(document.getElementById("guests").value);

    const numberOfRooms = Number(
        document.getElementById("numberOfRooms").value
    );

    // Validate room
    const selectedRoom = availableRooms.find(
        room => Number(room.id) === roomId
    );

    if (!selectedRoom) {
        showBookingAlert("Please select a valid room.", "danger");
        return;
    }

    // Validate dates
    if (checkIn < getToday() || checkOut <= checkIn) {
        showBookingAlert(
            "Please select valid check-in and check-out dates.",
            "danger"
        );
        return;
    }

    // Validate guests and rooms
    if (
        guests < 1 ||
        numberOfRooms < 1 ||
        guests > selectedRoom.capacity * numberOfRooms
    ) {
        showBookingAlert(
            "Guest count exceeds the selected room capacity.",
            "danger"
        );
        return;
    }

    const submitButton = bookingForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;
    submitButton.textContent = "Processing...";

    try {

        // Find registered customer using email
        const customerResponse = await fetch(`${API_URL}/customers`);

        if (!customerResponse.ok) {
            throw new Error("Unable to verify customer details.");
        }

        const customers = await customerResponse.json();

        const customer = customers.find(
            item => item.gmail.toLowerCase() === gmail.toLowerCase()
        );

        if (!customer) {
            throw new Error(
                "Customer not registered. Please register first."
            );
        }

        // Prepare booking data
        const bookingData = {
            customer_id: customer.id,
            room_id: roomId,
            check_in: checkIn,
            check_out: checkOut,
            guests: guests,
            number_of_rooms: numberOfRooms
        };

        // Send booking to backend
        const response = await fetch(`${API_URL}/bookings`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Booking failed.");
        }

        showBookingAlert(
            "Booking successful! Your reservation has been saved.",
            "success"
        );

        bookingForm.reset();

        checkInInput.min = getToday();
        checkOutInput.min = getToday();

        roomSelect.value = "";

    } catch (error) {

        showBookingAlert(error.message, "danger");

    } finally {

        submitButton.disabled = false;
        submitButton.textContent = "Confirm Booking";

    }

});