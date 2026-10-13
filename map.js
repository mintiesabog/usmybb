(() => {
  const albany = { name: "Albany, New York", lat: 42.6526, lng: -73.7562 };
  const bulakan = { name: "Bulakan, Philippines", lat: 14.7942, lng: 120.8787 };
  const mapElement = document.getElementById("travelMap");
  const replayButton = document.getElementById("replayFlight");
  const distanceElement = document.querySelector(".distance-badge strong");

  if (!mapElement || !window.L) {
    if (mapElement) mapElement.textContent = "The interactive map needs an internet connection to load.";
    return;
  }

  const earthRadiusMiles = 3958.7613;
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const toDegrees = (radians) => radians * 180 / Math.PI;
  const normalizedLongitude = (longitude) => ((longitude + 180) % 360 + 360) % 360 - 180;

  function getDistanceMiles(from, to) {
    const lat1 = toRadians(from.lat);
    const lat2 = toRadians(to.lat);
    const deltaLat = lat2 - lat1;
    const deltaLng = toRadians(normalizedLongitude(to.lng - from.lng));
    const haversine = Math.sin(deltaLat / 2) ** 2
      + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  function makeGreatCircle(from, to, count) {
    const startLat = toRadians(from.lat);
    const startLng = toRadians(from.lng);
    const endLat = toRadians(to.lat);
    const endLng = startLng + toRadians(normalizedLongitude(to.lng - from.lng));
    const start = [Math.cos(startLat) * Math.cos(startLng), Math.cos(startLat) * Math.sin(startLng), Math.sin(startLat)];
    const end = [Math.cos(endLat) * Math.cos(endLng), Math.cos(endLat) * Math.sin(endLng), Math.sin(endLat)];
    const dot = Math.max(-1, Math.min(1, start[0] * end[0] + start[1] * end[1] + start[2] * end[2]));
    const angle = Math.acos(dot);
    const sinAngle = Math.sin(angle);
    const points = [];
    let previousLongitude = from.lng;

    for (let index = 0; index <= count; index++) {
      const fraction = index / count;
      const startWeight = sinAngle === 0 ? 1 - fraction : Math.sin((1 - fraction) * angle) / sinAngle;
      const endWeight = sinAngle === 0 ? fraction : Math.sin(fraction * angle) / sinAngle;
      const x = startWeight * start[0] + endWeight * end[0];
      const y = startWeight * start[1] + endWeight * end[1];
      const z = startWeight * start[2] + endWeight * end[2];
      const latitude = toDegrees(Math.atan2(z, Math.hypot(x, y)));
      let longitude = toDegrees(Math.atan2(y, x));

      while (longitude - previousLongitude > 180) longitude -= 360;
      while (longitude - previousLongitude < -180) longitude += 360;
      previousLongitude = longitude;
      points.push([latitude, longitude]);
    }

    return points;
  }

  function bearingDegrees(from, to) {
    const lat1 = toRadians(from[0]);
    const lat2 = toRadians(to[0]);
    const deltaLng = toRadians(to[1] - from[1]);
    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
    return (toDegrees(Math.atan2(y, x)) + 360) % 360;
  }

  function markerIcon(kind) {
    return L.divIcon({
      className: `city-marker ${kind}`,
      html: '<span class="marker-heart">♥</span>',
      iconSize: [32, 38],
      iconAnchor: [16, 34]
    });
  }

  function planeIcon(rotation = 0) {
    return L.divIcon({
      className: "plane-marker",
      html: `<span class="plane-disc"><svg viewBox="0 0 40 40" aria-hidden="true" style="transform:rotate(${rotation}deg)"><path d="M19 3c-1.5 0-2.4 1.3-2.6 3.2l-1.2 13.1-9.1 5.3v3.1l9.3-2.8-.7 8.2-3.1 2.3v2.2l7.4-1.9 7.4 1.9v-2.2l-3.1-2.3-.7-8.2 9.3 2.8v-3.1l-9.1-5.3-1.2-13.1C21.4 4.3 20.5 3 19 3z"/></svg></span>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });
  }

  const route = makeGreatCircle(bulakan, albany, 240);
  const startPoint = route[0];
  const endPoint = route[route.length - 1];
  const map = L.map(mapElement, { zoomControl: true, scrollWheelZoom: false, worldCopyJump: true });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
  }).addTo(map);

  const fullRoute = L.polyline(route, { color: "#f5a6b8", weight: 4, opacity: .42, dashArray: "3 9" }).addTo(map);
  const flownRoute = L.polyline([], { color: "#d84970", weight: 4, opacity: .95, lineCap: "round" }).addTo(map);
  const startMarker = L.marker(startPoint, { icon: markerIcon("bulakan-marker"), keyboard: true }).addTo(map);
  const endMarker = L.marker(endPoint, { icon: markerIcon("albany-marker"), keyboard: true }).addTo(map);
  const plane = L.marker(startPoint, { icon: planeIcon(), interactive: false, zIndexOffset: 1000 }).addTo(map);

  const routeBounds = L.latLngBounds(route[0], route[0]);
  route.forEach((point) => routeBounds.extend(point));
  map.fitBounds(routeBounds, { padding: [60, 60], maxZoom: 3 });
  if (distanceElement) distanceElement.textContent = `≈ ${Math.round(getDistanceMiles(albany, bulakan)).toLocaleString()} miles`;

  let animationFrame = 0;
  let animationToken = 0;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function flyRoute() {
    animationToken += 1;
    const token = animationToken;
    if (animationFrame) cancelAnimationFrame(animationFrame);

    flownRoute.setLatLngs([]);
    plane.setLatLng(startPoint);
    plane.setIcon(planeIcon(bearingDegrees(route[0], route[1])));
    if (replayButton) replayButton.disabled = true;

    if (prefersReducedMotion) {
      flownRoute.setLatLngs(route);
      plane.setLatLng(endPoint);
      plane.setIcon(planeIcon(bearingDegrees(route[route.length - 2], endPoint)));
      if (replayButton) replayButton.disabled = false;
      return;
    }

    const duration = 14000;
    let beganAt = null;

    function frame(timestamp) {
      if (token !== animationToken) return;
      if (beganAt === null) beganAt = timestamp;
      const progress = Math.min((timestamp - beganAt) / duration, 1);
      const routeIndex = progress * (route.length - 1);
      const index = Math.min(Math.floor(routeIndex), route.length - 2);
      const segmentProgress = routeIndex - index;
      const here = [
        route[index][0] + (route[index + 1][0] - route[index][0]) * segmentProgress,
        route[index][1] + (route[index + 1][1] - route[index][1]) * segmentProgress
      ];

      plane.setLatLng(here);
      plane.setIcon(planeIcon(bearingDegrees(route[index], route[index + 1])));
      flownRoute.setLatLngs(route.slice(0, index + 1).concat([here]));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(frame);
      } else if (replayButton) {
        replayButton.disabled = false;
      }
    }

    animationFrame = requestAnimationFrame(frame);
  }

  if (replayButton) replayButton.addEventListener("click", flyRoute);
  map.whenReady(() => {
    map.invalidateSize();
    flyRoute();
  });
  window.addEventListener("resize", () => map.invalidateSize());
})();
