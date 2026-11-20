const API_URL = "http://localhost:5000/api";

const searchForm = document.getElementById("searchForm");
const bookingsContainer = document.getElementById("bookingsContainer");
const bookingAlert = document.getElementById("bookingAlert");

let allBookings = [];

// Display alert
function showAlert(message, type) {
    bookingAlert.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show">
            ${message}
            <button type="button" class="btn-close"
                data-bs-dismiss="alert"></button>
        </div>
    `;
}

// Calculate number of nights
function calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN");
}

// Display bookings
function displayBookings(bookings) {

    bookingsContainer.innerHTML = "";

    if (bookings.length === 0) {
        bookingsContainer.innerHTML = `
            <div class="col-12 text-center">
                <h5>No bookings found.</h5>
            </div>
        `;
        return;
    }

    bookings.forEach(booking => {

        const nights = calculateNights(
            booking.check_in,
            booking.check_out
        );

        const totalPrice =
            Number(booking.price) *
            nights *
            Number(booking.number_of_rooms);

        const status = booking.booking_status;

        const statusClass =
            status === "Confirmed" ? "success" : "danger";

        bookingsContainer.innerHTML += `
            <div class="col-md-6 mb-4">

                <div class="card shadow h-100">

                    <div class="card-body">

                        <h4 class="card-title">
                            ${booking.room_type}
                        </h4>

                        <hr>

                        <p><strong>Booking ID:</strong>
                            ${booking.id}
                        </p>

                        <p><strong>Customer:</strong>
                            ${booking.name}
                        </p>

                        <p><strong>Email:</strong>
                            ${booking.gmail}
                        </p>

                        <p><strong>Check-in:</strong>
                            ${formatDate(booking.check_in)}
                        </p>

                        <p><strong>Check-out:</strong>
                            ${formatDate(booking.check_out)}
                        </p>

                        <p><strong>Guests:</strong>
                            ${booking.guests}
                        </p>

                        <p><strong>Rooms:</strong>
                            ${booking.number_of_rooms}
                        </p>

                        <p><strong>Total Price:</strong>
                            ₹${totalPrice.toLocaleString("en-IN")}
                        </p>

                        <p>
                            <strong>Status:</strong>
                            <span class="badge bg-${statusClass}">
                                ${status}
                            </span>
                        </p>

                        ${
                            status !== "Cancelled"
                            ? `
                                <button
                                    class="btn btn-danger w-100"
                                    onclick="cancelBooking(${booking.id})">
                                    Cancel Booking
                                </button>
                            `
                            : ""
                        }

                    </div>

                </div>

            </div>
        `;
    });
}


// Search bookings by email
searchForm.addEventListener("submit", async function(e) {

    e.preventDefault();

    const email = document
        .getElementById("customerEmail")
        .value.trim()
        .toLowerCase();

    try {

        bookingsContainer.innerHTML = `
            <div class="col-12 text-center">
                Loading bookings...
            </div>
        `;

        const response = await fetch(`${API_URL}/bookings`);

        if (!response.ok) {
            throw new Error("Unable to retrieve bookings");
        }

        allBookings = await response.json();

        const customerBookings = allBookings.filter(
            booking =>
                booking.gmail.toLowerCase() === email
        );

        displayBookings(customerBookings);

    } catch(error) {

        showAlert(error.message, "danger");

    }

});


// Cancel booking
async function cancelBooking(id) {

    const confirmCancel = confirm(
        "Are you sure you want to cancel this booking?"
    );

    if (!confirmCancel) return;

    try {

        const response = await fetch(
            `${API_URL}/bookings/${id}/cancel`,
            {
                method: "PATCH"
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        showAlert(
            "Booking cancelled successfully!",
            "success"
        );

        // Refresh displayed bookings
        searchForm.dispatchEvent(
            new Event("submit", { cancelable: true })
        );

    } catch(error) {

        showAlert(error.message, "danger");

    }

}