
document.addEventListener("DOMContentLoaded", () => {

    const roomsContainer = document.getElementById("roomsContainer");
    const loadingSpinner = document.getElementById("loadingSpinner");
    const noRoomsMessage = document.getElementById("noRoomsMessage");
    const roomsAlert = document.getElementById("roomsAlert");

    // Room images (local images)
    function getRoomImage(roomType) {

        const type = (roomType || "").toLowerCase().trim();

        if (type.includes("single")) {
            return "images/single.jpg";
        }

        if (type.includes("double")) {
            return "images/double.jpg";
        }

        if (type.includes("deluxe")) {
            return "images/deluxe.jpg";
        }

        if (type.includes("family")) {
            return "images/family.jpg";
        }

        if (type.includes("luxury")) {
            return "images/luxury.jpg";
        }

        return "images/deluxe.jpg";
    }


    // Load rooms from backend
    async function loadRooms() {

        loadingSpinner.classList.remove("d-none");
        roomsContainer.innerHTML = "";
        noRoomsMessage.classList.add("d-none");
        roomsAlert.classList.add("d-none");

        try {

            const response = await fetch("/api/rooms");

            if (!response.ok) {
                throw new Error("Unable to fetch rooms");
            }

            const rooms = await response.json();

            loadingSpinner.classList.add("d-none");

            if (!Array.isArray(rooms) || rooms.length === 0) {
                noRoomsMessage.classList.remove("d-none");
                return;
            }

            // Filter available rooms
            const availableRooms = rooms.filter(room =>
                Number(room.availability) === 1
            );

            if (availableRooms.length === 0) {
                noRoomsMessage.classList.remove("d-none");
                return;
            }

            // Display rooms
            availableRooms.forEach(room => {

                const roomCard = document.createElement("div");
                roomCard.className = "col-lg-4 col-md-6";

                const imagePath = getRoomImage(room.room_type);

                roomCard.innerHTML = `
                    <div class="card room-card shadow-sm">

                        <img src="${imagePath}"
                             alt="${room.room_type}"
                             class="card-img-top"
                             onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80';">

                        <div class="card-body">

                            <h4 class="fw-bold">${room.room_type}</h4>

                            <p class="text-muted">
                                ${room.description || "Experience comfort and relaxation at Grand Stay."}
                            </p>

                            <p class="room-capacity">
                                <i class="bi bi-people"></i>
                                Capacity: ${room.capacity} Guests
                            </p>

                            <h5 class="room-price">
                                ₹${room.price}
                                <small class="text-muted fs-6">/ night</small>
                            </h5>

                            <a href="booking.html?room_id=${room.id}"
                               class="btn book-btn w-100 mt-3">

                                <i class="bi bi-calendar-check"></i>
                                Book Now

                            </a>

                        </div>

                    </div>
                `;

                roomsContainer.appendChild(roomCard);

            });

        } catch (error) {

            loadingSpinner.classList.add("d-none");

            roomsAlert.classList.remove("d-none");
            roomsAlert.classList.add("alert-danger");

            roomsAlert.innerHTML = `
                <strong>Error!</strong> Unable to load rooms.
                Please check your server connection.
            `;

            console.error("Rooms Error:", error);

        }

    }

    loadRooms();

});
