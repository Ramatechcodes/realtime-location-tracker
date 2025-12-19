window.onload = function () {
  const socket = io();
  const phoneInput = document.getElementById("phone");

  // Create map
  const map = L.map("map").setView([0, 0], 16);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  let myMarker;
  let otherMarkers = {};

  // Reverse geocoding function (Nominatim)
  async function getAddress(lat, lng) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      return data.display_name || "Unknown address";
    } catch {
      return "Unknown address";
    }
  }

  // Get GPS location
  if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(
      async position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const address = await getAddress(lat, lng);

        if (!myMarker) {
          myMarker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`You: ${phoneInput.value || "Unknown"}<br>${address}`)
            .openPopup();
          map.setView([lat, lng], 16);
        } else {
          myMarker.setLatLng([lat, lng])
                  .setPopupContent(`You: ${phoneInput.value || "Unknown"}<br>${address}`);
        }

        // Send location + phone number + address to server
        socket.emit("location", {
          id: socket.id,
          lat,
          lng,
          phone: phoneInput.value || "Unknown",
          address
        });
      },
      error => {
        alert("Please allow location access!");
      },
      { enableHighAccuracy: true }
    );
  } else {
    alert("Geolocation is not supported by your browser");
  }

  // Show other users
  socket.on("location", async data => {
    if (data.id === socket.id) return; // skip self

    if (!otherMarkers[data.id]) {
      otherMarkers[data.id] = L.marker([data.lat, data.lng])
        .addTo(map)
        .bindPopup(`User: ${data.phone || "Unknown"}<br>${data.address || ""}`);
    } else {
      otherMarkers[data.id].setLatLng([data.lat, data.lng])
                           .setPopupContent(`User: ${data.phone || "Unknown"}<br>${data.address || ""}`);
    }
  });
};
