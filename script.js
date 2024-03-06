"use strict";

class MapManager {
  constructor() {
    this._map = null;
    this._routeLayer = null;
    this._startMarker = null;
    this._startCoords = null;
    this._destinationMarkers = [];
    this._carSpeed = 70;
    this._bicycleSpeed = 15;
    this._walkSpeed = 5;
  }

  get getRouteLayer() {
    return this._routeLayer;
  }

  set setRouteLayer(routeLayer) {
    this._routeLayer = routeLayer;
  }

  get getStartMarker() {
    return this._startMarker;
  }

  set setStartMarker(startMarker) {
    this._startMarker = startMarker;
  }

  get getStartCoords() {
    return this._startCoords;
  }

  set setStartCoords(coords) {
    this._startCoords = coords;
  }

  get getDestinationMarkers() {
    return this._destinationMarkers;
  }

  set setDestinationMarkers(markers) {
    if (Array.isArray(markers)) {
      this._destinationMarkers = markers;
    } else {
      throw new Error("Destination markers must be an array.");
    }
  }

  initMap(position) {
    const { latitude, longitude } = position.coords;

    this.setStartCoords = [latitude, longitude];

    this._map = L.map("map").setView(this.getStartCoords, 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);

    this.setStartMarker = L.marker(this.getStartCoords)
      .addTo(this._map)
      .openPopup();

    this._map.on("click", (event) => this.handleMapClick(event.latlng));
  }

  handleMapClick(latlng) {
    const { lat, lng } = latlng;

    if (this.getRouteLayer) {
      this._map.removeLayer(this.getRouteLayer);
    }

    this.getDestinationMarkers.forEach((marker) => {
      this._map.removeLayer(marker);
    });

    const endCoords = [lat, lng];
    const endMarker = L.marker(endCoords).addTo(this._map).openPopup();

    this.setDestinationMarkers = [...this.getDestinationMarkers, endMarker];

    fetch(
      `https://router.project-osrm.org/route/v1/driving/${this.getStartCoords[1]},${this.getStartCoords[0]};${lng},${lat}?overview=full&geometries=geojson`
    )
      .then((response) => response.json())
      .then((data) => {
        this.displayRoute(data, endMarker);
      })
      .catch((error) => console.error("Error fetching route:", error));
  }

  displayRoute(data, endMarker) {
    const distance = data.routes[0].distance / 1000;

    const carTime = (distance / this._carSpeed) * 60;
    const bicycleTime = (distance / this._bicycleSpeed) * 60;
    const walkTime = (distance / this._walkSpeed) * 60;

    const carTimeString = this.formatTime(carTime);
    const bicycleTimeString = this.formatTime(bicycleTime);
    const walkTimeString = this.formatTime(walkTime);

    endMarker
      .bindPopup(
        `Car: ${carTimeString}<br>Bicycle: ${bicycleTimeString}<br>Walk: ${walkTimeString}`
      )
      .openPopup();

    this.setRouteLayer = L.geoJSON(data.routes[0].geometry, {
      style: { color: "blue" },
    }).addTo(this._map);
    this._map.fitBounds(this.getRouteLayer.getBounds());
  }

  updatePosition(position) {
    const { latitude, longitude } = position.coords;
    this.setStartCoords = [latitude, longitude];
  }

  formatTime(minutes) {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else if (minutes < 24 * 60) {
      return `${Math.round(minutes / 60)} hr`;
    } else {
      return `${Math.round(minutes / (24 * 60))} day`;
    }
  }

  start() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) =>
        this.initMap(position)
      );
      navigator.geolocation.watchPosition(this.updatePosition(position));
    }
  }
}

const mapManager = new MapManager();
mapManager.start();
