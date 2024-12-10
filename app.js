const LOCATIONIQ_API_KEY = 'pk.3717459021ad96cf42874b41b82add1b';
const fixedLocation = {
  lat: 22.68138055901152,
  lon: 75.87980355352765,
  address: "MVJH+FW7, Takshashila Campus, Khandwa road, Indore, Madhya Pradesh 452020"
};
let currentLocation = fixedLocation;
let map, userMarker, customMarker, routeControl;

const currentAddress = document.getElementById('current-address');
const hospitalsList = document.getElementById('hospitals-list');
const directionsList = document.getElementById('directions-list');

// Initialize Map
function initMap() {
  map = L.map('map').setView([currentLocation.lat, currentLocation.lon], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  userMarker = L.marker([currentLocation.lat, currentLocation.lon], { 
    icon: L.divIcon({className: 'current-location-marker', html: 'C'}) 
  }).addTo(map);
  userMarker.bindPopup('Current Location').openPopup();
  updateLocationInfo();
  findNearestHospitals();
}

// Update current location info
async function updateLocationInfo() {
  currentAddress.textContent = `Address: ${currentLocation.address}`;
  const response = await fetch(`https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${currentLocation.lat}&lon=${currentLocation.lon}&format=json`);
  const data = await response.json();
  currentLocation.address = data.display_name;
  currentAddress.textContent = `Address: ${"MVJH+FW7, Takshashila Campus, Khandwa road, Indore, Madhya Pradesh 452020"}`;
}

// Find nearest hospitals
async function findNearestHospitals() {
  const url = `https://us1.locationiq.com/v1/nearby.php?key=${LOCATIONIQ_API_KEY}&lat=${currentLocation.lat}&lon=${currentLocation.lon}&tag=hospital&radius=10000&format=json`;
  const response = await fetch(url);
  const data = await response.json();
  displayHospitals(data.slice(0, 3));  // Display 3 nearest hospitals
}

// Display hospitals on map and list
function displayHospitals(hospitals) {
  hospitalsList.innerHTML = '';
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker && layer !== userMarker) {
      map.removeLayer(layer);
    }
  });

  hospitals.forEach((hospital, index) => {
    const marker = L.marker([hospital.lat, hospital.lon], { 
      icon: L.divIcon({className: 'hospital-marker', html: (index + 1)}) 
    }).addTo(map);
    marker.bindPopup(`${hospital.name}`);

    hospitalsList.innerHTML += `
      <div class="p-4 border-b border-gray-300">
        <h3 class="font-bold">${index + 1}. ${hospital.name}</h3>
        <p>Distance: ${(hospital.distance / 1000).toFixed(2)} km</p>
        <button class="bg-blue-500 text-white p-2 mt-2 rounded" onclick="navigateToHospital(${hospital.lat}, ${hospital.lon})">Show Route</button>
      </div>
    `;
  });
}

// Show route to a selected hospital with directions
function navigateToHospital(hospitalLat, hospitalLon) {
  if (routeControl) {
    map.removeControl(routeControl);  // Remove previous route if it exists
  }

  routeControl = L.Routing.control({
    waypoints: [
      L.latLng(currentLocation.lat, currentLocation.lon),
      L.latLng(hospitalLat, hospitalLon)
    ],
    routeWhileDragging: true,
    createMarker: function(i, wp) {
      return L.marker(wp.latLng, { 
        icon: L.divIcon({className: 'hospital-marker', html: (i + 1)}) 
      });
    }
  }).on('routesfound', function(e) {
    const routes = e.routes;
    const summary = routes[0].summary;
    const steps = routes[0].instructions;

    directionsList.innerHTML = `
      <p>Total distance: ${(summary.totalDistance / 1000).toFixed(2)} km</p>
      <p>Total time: ${(summary.totalTime / 60).toFixed(2)} mins</p>
      <ul class="mt-4 list-decimal pl-6">
        ${steps.map(step => `<li>${step.text}</li>`).join('')}
      </ul>
    `;
  }).addTo(map);
}

// Handle "Use Current Location" button click
document.getElementById('use-current-location').addEventListener('click', () => {
  currentLocation = fixedLocation;
  map.setView([currentLocation.lat, currentLocation.lon], 13);
  findNearestHospitals();
  updateLocationInfo();
});

// Handle "Drop Custom Location" button click
document.getElementById('drop-custom-location').addEventListener('click', () => {
  map.on('click', function (e) {
    if (customMarker) {
      map.removeLayer(customMarker);
    }
    customMarker = L.marker([e.latlng.lat, e.latlng.lng], {
      icon: L.divIcon({className: 'custom-location-marker', html: 'CL'})
    }).addTo(map);
    customMarker.bindPopup('Custom Location').openPopup();
    currentLocation = { lat: e.latlng.lat, lon: e.latlng.lng };
    updateLocationInfo();
    findNearestHospitals();
  });
});

// Initialize the map on page load
window.onload = initMap;
