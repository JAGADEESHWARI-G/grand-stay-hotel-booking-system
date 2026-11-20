const API_URL = "http://localhost:5000/api";

// Registration Form
const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    // Collect form data
    const formData = new FormData(registerForm);

    const customerData = {
        name: formData.get("name").trim(),
        gmail: formData.get("gmail").trim(),
        phone: formData.get("phone").trim(),
        address: formData.get("address").trim(),
        city: formData.get("city").trim(),
        state: formData.get("state").trim(),
        pincode: formData.get("pincode").trim()
    };

    // Additional validation
    if (!/^[0-9]{10}$/.test(customerData.phone)) {
        showAlert("Enter a valid 10-digit phone number!", "danger");
        return;
    }

    if (!/^[0-9]{6}$/.test(customerData.pincode)) {
        showAlert("Enter a valid 6-digit pincode!", "danger");
        return;
    }

    // Submit button spinner
    const submitBtn = registerForm.querySelector(
        'button[type="submit"]'
    );

    submitBtn.disabled = true;

    submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm"></span>
        Registering...
    `;

    try {

        // Send data to backend
        const response = await fetch(`${API_URL}/customers`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(customerData)

        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Registration failed");
        }

        // Success message
        showAlert(result.message, "success");

        // Reset form
        registerForm.reset();

        // Close modal
        const modalElement = document.getElementById("registerModal");

        const modal = bootstrap.Modal.getInstance(modalElement);

        modal.hide();

    }

    catch (error) {

        showAlert(error.message, "danger");

    }

    finally {

        submitBtn.disabled = false;
        submitBtn.innerHTML = "Register";

    }

});


// Bootstrap Alert Function
function showAlert(message, type) {

    const alertMessage = document.getElementById("alertMessage");

    alertMessage.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show"
             role="alert">

            ${message}

            <button type="button"
                class="btn-close"
                data-bs-dismiss="alert">
            </button>

        </div>
    `;

}
// Display available rooms
const roomsContainer = document.getElementById("roomsContainer");
const loadingSpinner = document.getElementById("loadingSpinner");

async function loadRooms() {
    try {
        const response = await fetch(`${API_URL}/rooms/available`);

        if (!response.ok) {
            throw new Error("Unable to fetch rooms");
        }

        const rooms = await response.json();

        loadingSpinner.style.display = "none";

        if (rooms.length === 0) {
            roomsContainer.innerHTML =
                `<p class="text-center">No rooms available currently.</p>`;
            return;
        }

        roomsContainer.innerHTML = rooms.map(room => `
            <div class="col-md-4 mb-4">
                <div class="card h-100 shadow">
                    <div class="card-body">
                        <h5 class="card-title">${room.room_type}</h5>
                        <p>${room.description || "Comfortable hotel room"}</p>
                        <p><strong>Price:</strong> ₹${room.price} / night</p>
                        <p><strong>Capacity:</strong> ${room.capacity} guests</p>
                        <a href="booking.html?roomId=${room.id}"
                           class="btn btn-primary">
                           Book Now
                        </a>
                    </div>
                </div>
            </div>
        `).join("");

    } catch (error) {
        loadingSpinner.style.display = "none";
        roomsContainer.innerHTML =
            `<p class="text-danger text-center">${error.message}</p>`;
    }
}

loadRooms();