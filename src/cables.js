import * as THREE from 'three';

// Convert lat/lon pairs to 3D Cartesian vector on a sphere of radius R
export function latLongToVector3(lat, lon, radius) {
  var phi = (lat) * Math.PI / 180;
  var theta = (lon - 180) * Math.PI / 180;

  var x = -(radius * Math.cos(phi) * Math.cos(theta));
  var y = radius * Math.sin(phi);
  var z = radius * Math.cos(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

// Generate spline curves connecting multiple coordinate points
export function createCables(scene, earthGroup, radius, cablesData) {
  const cablesList = [];
  const cableGroup = new THREE.Group();
  earthGroup.add(cableGroup);

  const materials = [
    new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8, linewidth: 2 }),
    new THREE.LineBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.8, linewidth: 2 }),
    new THREE.LineBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0.8, linewidth: 2 }),
    new THREE.LineBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8, linewidth: 2 })
  ];

  cablesData.features.forEach((feature, index) => {
    if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
      const coordinatesList = feature.geometry.type === 'MultiLineString' ? feature.geometry.coordinates : [feature.geometry.coordinates];
      
      const properties = feature.properties || { name: 'Unknown Cable' };
      
      coordinatesList.forEach(lineCoords => {
        const points = [];
        lineCoords.forEach(coord => {
          const lon = coord[0];
          const lat = coord[1];
          // Cables are slightly elevated from the radius for visibility
          points.push(latLongToVector3(lat, lon, radius * 1.01)); 
        });

        if (points.length > 1) {
          const curve = new THREE.CatmullRomCurve3(points);
          // Get more points for smoothness
          const smoothPoints = curve.getPoints(Math.max(50, points.length * 5));
          const geometry = new THREE.BufferGeometry().setFromPoints(smoothPoints);
          
          const material = materials[index % materials.length];
          const line = new THREE.Line(geometry, material);
          
          // Store user data for interaction
          line.userData = properties;
          cablesList.push(line);
          cableGroup.add(line);
        }
      });
    }
  });

  // Adding pulse animation via custom shader or just simple line thickness?
  // We can use standard Line for simplicity initially
  return { cableGroup, cablesList };
}
