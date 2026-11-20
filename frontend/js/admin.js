// =====================================
// ADMIN AUTHENTICATION CHECK
// Require a fresh login whenever admin.html is refreshed.
// =====================================

const adminNavigation = performance.getEntriesByType("navigation")[0];
const isPageRefresh = adminNavigation?.type === "reload";

if (isPageRefresh) {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminData");
}

const adminToken = sessionStorage.getItem("adminToken");

if (!adminToken) {
    window.location.replace("admin-login.html");
}

const adminData = JSON.parse(
    sessionStorage.getItem("adminData") || "{}"
);

const API_URL = "http://localhost:5000/api";

let allCustomers = [];
let allBookings = [];
let allRooms = [];
let revenueChart = null;


// =====================================
// COMMON HELPER FUNCTIONS
// =====================================

function getElement(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatCurrency(value) {
    return "₹" + (Number(value) || 0).toLocaleString("en-IN");
}

function formatDate(dateValue) {
    if (!dateValue) return "-";

    const value = String(dateValue).slice(0, 10);
    const parts = value.split("-");

    if (parts.length === 3) {
        const date = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    const date = new Date(dateValue);

    return Number.isNaN(date.getTime())
        ? "-"
        : date.toLocaleDateString("en-IN");
}

function calculateNights(checkIn, checkOut) {
    const start = new Date(
        String(checkIn).slice(0, 10) + "T00:00:00"
    );

    const end = new Date(
        String(checkOut).slice(0, 10) + "T00:00:00"
    );

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        return 0;
    }

    return Math.max(
        0,
        Math.round((end - start) / 86400000)
    );
}

function calculateBookingAmount(booking) {
    const nights = calculateNights(
        booking.check_in,
        booking.check_out
    );

    const price = Number(booking.price) || 0;

    const roomCount =
        Number(booking.number_of_rooms) || 1;

    return nights * price * roomCount;
}

async function readResponse(response) {
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            "Request failed"
        );
    }

    return result;
}

function showMessage(message, type = "success") {
    const alertBox =
        getElement("adminAlert") ||
        getElement("bookingAlert") ||
        getElement("alertMessage");

    if (!alertBox) {
        window.alert(message);
        return;
    }

    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");

    setTimeout(() => {
        alertBox.classList.add("d-none");
    }, 4000);
}


// =====================================
// LOAD ADMIN DASHBOARD
// =====================================

async function loadDashboard() {

    try {

        const [
            customersResponse,
            roomsResponse,
            bookingsResponse
        ] = await Promise.all([

            fetch(`${API_URL}/customers`),

            fetch(`${API_URL}/rooms`),

            fetch(`${API_URL}/bookings`)

        ]);

        const [
            customers,
            rooms,
            bookings
        ] = await Promise.all([

            readResponse(customersResponse),

            readResponse(roomsResponse),

            readResponse(bookingsResponse)

        ]);

        if (
            !Array.isArray(customers) ||
            !Array.isArray(rooms) ||
            !Array.isArray(bookings)
        ) {
            throw new Error("Invalid dashboard data received.");
        }

        allCustomers = customers;

        allRooms = rooms;

        allBookings = bookings;

        updateDashboardStatistics();

        displayRooms(allRooms);

        filterBookings();

        filterCustomers();

        renderMonthlyRevenueChart();

    } catch (error) {

        console.error("Dashboard Error:", error);

        showMessage(
            error.message +
            ". Check whether backend is running.",
            "danger"
        );

    }

}


// =====================================
// DASHBOARD STATISTICS
// =====================================

function updateDashboardStatistics() {

    const confirmed = allBookings.filter(
        booking =>
            booking.booking_status === "Confirmed"
    );

    const cancelled = allBookings.filter(
        booking =>
            booking.booking_status === "Cancelled"
    );

    const totalRevenue = confirmed.reduce(
        (sum, booking) => {
            return sum + calculateBookingAmount(booking);
        },
        0
    );

    if (getElement("totalCustomers")) {
        getElement("totalCustomers").textContent =
            allCustomers.length;
    }

    if (getElement("totalRooms")) {
        getElement("totalRooms").textContent =
            allRooms.length;
    }

    if (getElement("totalBookings")) {
        getElement("totalBookings").textContent =
            allBookings.length;
    }

    if (getElement("confirmedBookings")) {
        getElement("confirmedBookings").textContent =
            confirmed.length;
    }

    if (getElement("cancelledBookings")) {
        getElement("cancelledBookings").textContent =
            cancelled.length;
    }

    if (getElement("totalRevenue")) {
        getElement("totalRevenue").textContent =
            formatCurrency(totalRevenue);
    }

}


// =====================================
// ROOM MANAGEMENT
// =====================================

// DISPLAY ROOMS

function displayRooms(rooms) {

    const table = getElement("roomsTable");

    if (!table) return;

    if (rooms.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    No rooms found
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = rooms.map(room => `

        <tr>

            <td>${Number(room.id)}</td>

            <td>${escapeHTML(room.room_type)}</td>

            <td>${formatCurrency(room.price)}</td>

            <td>${Number(room.capacity) || 0}</td>

            <td>

                <span class="badge ${
                    Number(room.availability) === 1
                        ? "bg-success"
                        : "bg-secondary"
                }">

                    ${
                        Number(room.availability) === 1
                            ? "Available"
                            : "Unavailable"
                    }

                </span>

            </td>

            <td>

                <button
                    class="btn btn-warning btn-sm"
                    onclick="editRoom(${Number(room.id)})">

                    Edit

                </button>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="deleteRoom(${Number(room.id)})">

                    Delete

                </button>

            </td>

        </tr>

    `).join("");

}


// ADD ROOM FORM

function showAddRoomForm() {

    const container = getElement("roomFormContainer");

    if (!container) return;

    container.innerHTML = `

        <div class="card shadow-sm p-3 mb-4">

            <h5 class="mb-3">Add New Room</h5>

            <form id="roomForm">

                <label class="form-label">
                    Room Type
                </label>

                <input
                    type="text"
                    id="roomType"
                    class="form-control mb-2"
                    placeholder="Example: Deluxe Room"
                    required>

                <label class="form-label">
                    Price per Night
                </label>

                <input
                    type="number"
                    id="roomPrice"
                    class="form-control mb-2"
                    min="1"
                    step="0.01"
                    required>

                <label class="form-label">
                    Guest Capacity
                </label>

                <input
                    type="number"
                    id="roomCapacity"
                    class="form-control mb-2"
                    min="1"
                    required>

                <label class="form-label">
                    Description
                </label>

                <textarea
                    id="roomDescription"
                    class="form-control mb-3"
                    rows="3"
                    placeholder="Room details">
                </textarea>

                <button
                    type="submit"
                    class="btn btn-success">
                    Save Room
                </button>

                <button
                    type="button"
                    class="btn btn-secondary"
                    onclick="closeRoomForm()">
                    Cancel
                </button>

            </form>

        </div>

    `;

    getElement("roomForm").addEventListener(
        "submit",
        addRoom
    );

}


// ADD ROOM

async function addRoom(event) {

    event.preventDefault();

    const roomData = {

        room_type:
            getElement("roomType").value.trim(),

        price:
            Number(getElement("roomPrice").value),

        capacity:
            Number(getElement("roomCapacity").value),

        availability: 1,

        description:
            getElement("roomDescription").value.trim()

    };

    if (
        !roomData.room_type ||
        roomData.price <= 0 ||
        roomData.capacity <= 0
    ) {

        showMessage(
            "Enter valid room details.",
            "warning"
        );

        return;

    }

    try {

        const response = await fetch(
            `${API_URL}/rooms`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(roomData)
            }
        );

        await readResponse(response);

        closeRoomForm();

        showMessage("Room added successfully!");

        await loadDashboard();

    } catch (error) {

        console.error(error);

        showMessage(
            error.message || "Unable to add room.",
            "danger"
        );

    }

}


// EDIT ROOM

async function editRoom(id) {

    try {

        const response = await fetch(
            `${API_URL}/rooms/${id}`
        );

        const room = await readResponse(response);

        const container =
            getElement("roomFormContainer");

        if (!container) return;

        container.innerHTML = `

            <div class="card shadow-sm p-3 mb-4">

                <h5 class="mb-3">Update Room</h5>

                <form id="updateRoomForm">

                    <label class="form-label">
                        Room Type
                    </label>

                    <input
                        type="text"
                        id="roomType"
                        class="form-control mb-2"
                        value="${escapeHTML(room.room_type)}"
                        required>

                    <label class="form-label">
                        Price per Night
                    </label>

                    <input
                        type="number"
                        id="roomPrice"
                        class="form-control mb-2"
                        min="1"
                        step="0.01"
                        value="${room.price}"
                        required>

                    <label class="form-label">
                        Guest Capacity
                    </label>

                    <input
                        type="number"
                        id="roomCapacity"
                        class="form-control mb-2"
                        min="1"
                        value="${room.capacity}"
                        required>

                    <label class="form-label">
                        Description
                    </label>

                    <textarea
                        id="roomDescription"
                        class="form-control mb-3"
                        rows="3">${escapeHTML(room.description || "")}</textarea>

                    <button
                        type="submit"
                        class="btn btn-primary">
                        Update Room
                    </button>

                    <button
                        type="button"
                        class="btn btn-secondary"
                        onclick="closeRoomForm()">
                        Cancel
                    </button>

                </form>

            </div>

        `;

        getElement("updateRoomForm").addEventListener(
            "submit",
            function(event) {
                updateRoom(event, id);
            }
        );

    } catch (error) {

        console.error(error);

        showMessage(
            error.message || "Unable to load room details.",
            "danger"
        );

    }

}


// UPDATE ROOM

async function updateRoom(event, id) {

    event.preventDefault();

    const roomData = {

        room_type:
            getElement("roomType").value.trim(),

        price:
            Number(getElement("roomPrice").value),

        capacity:
            Number(getElement("roomCapacity").value),

        description:
            getElement("roomDescription").value.trim()

    };

    if (
        !roomData.room_type ||
        roomData.price <= 0 ||
        roomData.capacity <= 0
    ) {

        showMessage(
            "Enter valid room details.",
            "warning"
        );

        return;

    }

    try {

        const response = await fetch(
            `${API_URL}/rooms/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(roomData)
            }
        );

        await readResponse(response);

        closeRoomForm();

        showMessage("Room updated successfully!");

        await loadDashboard();

    } catch (error) {

        console.error(error);

        showMessage(
            error.message || "Unable to update room.",
            "danger"
        );

    }

}


// DELETE ROOM

async function deleteRoom(id) {

    if (!confirm("Are you sure you want to delete this room?")) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/rooms/${id}`,
            {
                method: "DELETE"
            }
        );

        await readResponse(response);

        showMessage("Room deleted successfully!");

        await loadDashboard();

    } catch (error) {

        console.error(error);

        showMessage(
            error.message || "Unable to delete room.",
            "danger"
        );

    }

}


// CLOSE ROOM FORM

function closeRoomForm() {

    const container = getElement("roomFormContainer");

    if (container) {
        container.innerHTML = "";
    }

}


// ROOM AVAILABILITY TOGGLE

async function toggleRoomAvailability(id, availability) {

    try {

        const response = await fetch(
            `${API_URL}/rooms/${id}/availability`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    availability
                })
            }
        );

        await readResponse(response);

        showMessage("Room availability updated!");

        await loadDashboard();

    } catch (error) {

        console.error(error);

        showMessage(
            error.message || "Unable to change availability.",
            "danger"
        );

    }

}
// =====================================
// BOOKING MANAGEMENT
// =====================================

// FILTER BOOKINGS
function filterBookings() {

    const searchInput = getElement("bookingSearch");
    const statusFilter = getElement("bookingStatusFilter");

    const search = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const status = statusFilter
        ? statusFilter.value
        : "All";

    const filteredBookings = allBookings.filter(booking => {

        const customerName = String(
            booking.customer_name || booking.name || ""
        ).toLowerCase();

        const email = String(
            booking.gmail || booking.email || ""
        ).toLowerCase();

        const bookingId = String(booking.id || "");

        const roomType = String(
            booking.room_type || ""
        ).toLowerCase();

        const matchesSearch =
            customerName.includes(search) ||
            email.includes(search) ||
            bookingId.includes(search) ||
            roomType.includes(search);

        const matchesStatus =
            status === "All" ||
            !status ||
            booking.booking_status === status;

        return matchesSearch && matchesStatus;

    });

    displayBookings(filteredBookings);
}


// DISPLAY BOOKINGS
function displayBookings(bookings) {

    const table = getElement("bookingsTable");

    if (!table) return;

    if (!Array.isArray(bookings) || bookings.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4 text-muted">
                    <i class="bi bi-calendar-x fs-4 d-block mb-2"></i>
                    No bookings found
                </td>
            </tr>
        `;

        return;

    }

    table.innerHTML = bookings.map(booking => {

        const customerName =
            booking.customer_name || booking.name || "Unknown";

        const email =
            booking.gmail || booking.email || "N/A";

        const roomType =
            booking.room_type || "N/A";

        const checkIn =
            booking.check_in || booking.checkin || "";

        const checkOut =
            booking.check_out || booking.checkout || "";

        const guests =
            booking.guests || booking.number_of_guests || 1;

        const status =
            booking.booking_status || "Confirmed";

        const statusBadge =
            status === "Confirmed"
                ? "bg-success"
                : status === "Cancelled"
                    ? "bg-danger"
                    : "bg-warning text-dark";

        return `
            <tr>

                <td>${escapeHTML(booking.id)}</td>

                <td>${escapeHTML(customerName)}</td>

                <td>${escapeHTML(email)}</td>

                <td>${escapeHTML(roomType)}</td>

                <td>${formatDate(checkIn)}</td>

                <td>${formatDate(checkOut)}</td>

                <td>${escapeHTML(guests)}</td>

                <td>
                    <span class="badge ${statusBadge}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>
                    <select
                        class="form-select form-select-sm"
                        onchange="updateBookingStatus(${Number(booking.id)}, this.value)"
                        ${status === "Cancelled" ? "disabled" : ""}
                    >

                        <option value="Confirmed"
                            ${status === "Confirmed" ? "selected" : ""}>
                            Confirmed
                        </option>

                        <option value="Cancelled"
                            ${status === "Cancelled" ? "selected" : ""}>
                            Cancelled
                        </option>

                    </select>
                </td>

            </tr>
        `;

    }).join("");

}

// UPDATE BOOKING STATUS

async function updateBookingStatus(id, status) {

    try {

        const response = await fetch(
            `${API_URL}/bookings/${id}/status`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    booking_status: status
                })
            }
        );

        await readResponse(response);

        showMessage(
            "Booking status updated successfully!"
        );

        await loadDashboard();

    } catch (error) {

        console.error(error);

        showMessage(
            error.message || "Unable to update booking.",
            "danger"
        );

        await loadDashboard();

    }

}


// =====================================
// CUSTOMER MANAGEMENT
// =====================================

function filterCustomers() {

    const searchInput = getElement("customerSearch");

    const search = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const filteredCustomers = allCustomers.filter(customer => {

        const name =
            String(customer.name || "")
                .toLowerCase();

        const email =
            String(customer.email || customer.gmail || "")
                .toLowerCase();

        const phone =
            String(customer.phone || customer.mobile || "");

        return (
            name.includes(search) ||
            email.includes(search) ||
            phone.includes(search)
        );

    });

    displayCustomers(filteredCustomers);

}


// DISPLAY CUSTOMERS
// DISPLAY CUSTOMERS
function displayCustomers(customers) {

    const table = getElement("customersTable");

    if (!table) return;

    if (!customers || customers.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    No customers found
                </td>
            </tr>
        `;

        return;

    }

    table.innerHTML = customers.map(customer => `

        <tr>

            <td>${Number(customer.id)}</td>

            <td>${escapeHTML(customer.name || "-")}</td>

            <td>${escapeHTML(customer.email || customer.gmail || "-")}</td>

            <td>${escapeHTML(customer.phone || customer.mobile || "-")}</td>

            <td>${escapeHTML(customer.city || "-")}</td>

            <td>${escapeHTML(customer.state || customer.state_name || "-")}</td>

        </tr>

    `).join("");

}


// =====================================
// REVENUE CHART
// =====================================

function renderMonthlyRevenueChart() {

    const canvas = getElement("revenueChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    const monthlyRevenue = {};

    allBookings.forEach(booking => {

        if (booking.booking_status !== "Confirmed") {
            return;
        }

        const date = new Date(booking.check_in);

        if (Number.isNaN(date.getTime())) {
            return;
        }

        const month = date.toLocaleString("en-US", {
            month: "short"
        });

        const year = date.getFullYear();

        const label = `${month} ${year}`;

        monthlyRevenue[label] =
            (monthlyRevenue[label] || 0) +
            calculateBookingAmount(booking);

    });

    const labels = Object.keys(monthlyRevenue);

    const values = Object.values(monthlyRevenue);

    if (revenueChart) {

        revenueChart.destroy();

    }

    revenueChart = new Chart(canvas, {

        type: "bar",

        data: {

            labels,

            datasets: [{

                label: "Revenue",

                data: values,

                backgroundColor: "rgba(111, 66, 193, 0.7)",

                borderColor: "rgba(111, 66, 193, 1)",

                borderWidth: 1,

                borderRadius: 6

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: true
                },

                tooltip: {

                    callbacks: {

                        label: function(context) {

                            return formatCurrency(
                                context.raw
                            );

                        }

                    }

                }

            },

            scales: {

                y: {

                    beginAtZero: true,

                    ticks: {

                        callback: function(value) {

                            return "₹" +
                                Number(value).toLocaleString("en-IN");

                        }

                    }

                }

            }

        }

    });

}


// =====================================
// CSV EXPORT
// =====================================

function exportBookingsCSV() {

    if (allBookings.length === 0) {

        showMessage(
            "No booking data available to export.",
            "warning"
        );

        return;

    }

    const headers = [

        "Booking ID",

        "Customer Name",

        "Room Type",

        "Check In",

        "Check Out",

        "Rooms",

        "Status",

        "Total Amount"

    ];

    const rows = allBookings.map(booking => [

        booking.id,

        booking.customer_name || booking.name || "",

        booking.room_type || "",

        booking.check_in || "",

        booking.check_out || "",

        booking.number_of_rooms || 1,

        booking.booking_status || "",

        calculateBookingAmount(booking)

    ]);

    const csvContent = [

        headers,

        ...rows

    ].map(row =>

        row.map(value => {

            return `"${String(value ?? "").replace(/"/g, '""')}"`;

        }).join(",")

    ).join("\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        {
            type: "text/csv;charset=utf-8;"
        }
    );

    const link = document.createElement("a");

    const url = URL.createObjectURL(blob);

    link.href = url;

    link.download = "grand_stay_bookings.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showMessage("CSV exported successfully!");

}


// =====================================
// LOGOUT
// =====================================

function adminLogout() {

    sessionStorage.removeItem("adminToken");

    sessionStorage.removeItem("adminData");

    window.location.replace("admin-login.html");

}


// =====================================
// ADMIN EVENTS
// =====================================

function setupAdminEvents() {

    const bookingSearch =
        getElement("bookingSearch");

    if (bookingSearch) {

        bookingSearch.addEventListener(
            "input",
            filterBookings
        );

    }

    const bookingStatusFilter =
        getElement("bookingStatusFilter");

    if (bookingStatusFilter) {

        bookingStatusFilter.addEventListener(
            "change",
            filterBookings
        );

    }

    const customerSearch =
        getElement("customerSearch");

    if (customerSearch) {

        customerSearch.addEventListener(
            "input",
            filterCustomers
        );

    }

    const addRoomButton =
        getElement("addRoomButton");

    if (addRoomButton) {

        addRoomButton.addEventListener(
            "click",
            showAddRoomForm
        );

    }

    const exportButton =
        getElement("exportBookingsButton");

    if (exportButton) {

        exportButton.addEventListener(
            "click",
            exportBookingsCSV
        );

    }

    const logoutButton =
        getElement("logoutButton");

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            adminLogout
        );

    }

}


// =====================================
// INITIALIZE ADMIN DASHBOARD
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    setupAdminEvents();

    loadDashboard();

});
