"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

let map;
let routeLayer;
let startMarker;
let startCoords;

const destinationMarkers = [];

const carSpeed = 70;
const bicycleSpeed = 15;
const walkSpeed = 5;

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(function (position) {
    const { latitude, longitude } = position.coords;

    startCoords = [latitude, longitude];

    map = L.map("map").setView(startCoords, 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    startMarker = L.marker(startCoords).addTo(map).openPopup();

    map.on("click", function (event) {
      const { lat, lng } = event.latlng;

      if (routeLayer) {
        map.removeLayer(routeLayer);
      }

      destinationMarkers.forEach((marker) => {
        map.removeLayer(marker);
      });

      const endCoords = [lat, lng];
      const endMarker = L.marker(endCoords).addTo(map).openPopup();

      destinationMarkers.push(endMarker);

      fetch(
        `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${lng},${lat}?overview=full&geometries=geojson`
      )
        .then((response) => response.json())
        .then((data) => {
          const distance = data.routes[0].distance / 1000;

          const carTime = (distance / carSpeed) * 60;
          const bicycleTime = (distance / bicycleSpeed) * 60;
          const walkTime = (distance / walkSpeed) * 60;

          const carTimeString = formatTime(carTime);
          const bicycleTimeString = formatTime(bicycleTime);
          const walkTimeString = formatTime(walkTime);

          endMarker
            .bindPopup(
              `Car: ${carTimeString}<br>Bicycle: ${bicycleTimeString}<br>Walk: ${walkTimeString}`
            )
            .openPopup();

          routeLayer = L.geoJSON(data.routes[0].geometry, {
            style: { color: "blue" },
          }).addTo(map);
          map.fitBounds(routeLayer.getBounds());
        })
        .catch((error) => console.error("Error fetching route:", error));
    });
  });

  navigator.geolocation.watchPosition(function (position) {
    const { latitude, longitude } = position.coords;
    startCoords = [latitude, longitude];
  });
}

function formatTime(minutes) {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  } else if (minutes < 24 * 60) {
    return `${Math.round(minutes / 60)} hr`;
  } else {
    return `${Math.round(minutes / (24 * 60))} day`;
  }
}
