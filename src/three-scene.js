import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

function latLongToVector3(lat, lon, radius) {
  var phi = (lat) * Math.PI / 180;
  var theta = (lon - 180) * Math.PI / 180;
  var x = -(radius * Math.cos(phi) * Math.cos(theta));
  var y = radius * Math.sin(phi);
  var z = radius * Math.cos(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

const countries = [
  { name: 'RUSSIA', lat: 61, lon: 105 },
  { name: 'CANADA', lat: 56, lon: -106 },
  { name: 'USA', lat: 37, lon: -95 },
  { name: 'CHINA', lat: 35, lon: 105 },
  { name: 'BRAZIL', lat: -14, lon: -51 },
  { name: 'AUSTRALIA', lat: -25, lon: 133 },
  { name: 'INDIA', lat: 20, lon: 78 },
  { name: 'ARGENTINA', lat: -38, lon: -63 },
  { name: 'KAZAKHSTAN', lat: 48, lon: 66 },
  { name: 'ALGERIA', lat: 28, lon: 1 },
  { name: 'DR CONGO', lat: -4, lon: 21 },
  { name: 'GREENLAND', lat: 72, lon: -42 },
  { name: 'SAUDI ARABIA', lat: 23, lon: 45 },
  { name: 'MEXICO', lat: 23, lon: -102 },
  { name: 'INDONESIA', lat: -0.7, lon: 113 },
  { name: 'SUDAN', lat: 12, lon: 30 },
  { name: 'IRAN', lat: 32, lon: 53 },
  { name: 'UK', lat: 55, lon: -3 },
  { name: 'FRANCE', lat: 46, lon: 2 },
  { name: 'GERMANY', lat: 51, lon: 9 },
  { name: 'SOUTH AFRICA', lat: -30, lon: 25 },
  { name: 'JAPAN', lat: 36, lon: 138 }
];

export async function setupScene(container) {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020205);
  
  // Camera setup
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 250;
  
  // Renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  
  // Label Renderer
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.pointerEvents = 'none';
  container.appendChild(labelRenderer.domElement);
  
  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.minDistance = 120;
  controls.maxDistance = 400;
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);

  const starField = createStarField();
  scene.add(starField);
  
  // Earth Sphere
  const earthRadius = 100;
  const segments = 128; // Increased for better detail
  const geometry = new THREE.SphereGeometry(earthRadius, segments, segments);
  
  const textureLoader = new THREE.TextureLoader();
  const material = new THREE.MeshPhongMaterial({
    map: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'),
    bumpMap: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png'),
    bumpScale: 5,
    specularMap: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-water.png'),
    specular: new THREE.Color('grey'),
    shininess: 25
  });
  
  const earth = new THREE.Mesh(geometry, material);
  
  const labels = [];
  countries.forEach(country => {
    const text = document.createElement('div');
    text.className = 'country-label';
    text.textContent = country.name;
    text.style.color = '#ffffff';
    text.style.fontSize = '12px';
    text.style.fontWeight = 'bold';
    text.style.textShadow = '0 0 5px #000';
    text.style.pointerEvents = 'none';
    
    const label = new CSS2DObject(text);
    const pos = latLongToVector3(country.lat, country.lon, earthRadius * 1.02);
    label.position.copy(pos);
    earth.add(label);
    labels.push(label);
  });

  // Group for rotation
  const earthGroup = new THREE.Group();
  earthGroup.add(earth);
  scene.add(earthGroup);

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
  });

  let isAutoRotating = true;
  renderer.domElement.addEventListener('mousedown', () => isAutoRotating = false);
  renderer.domElement.addEventListener('touchstart', () => isAutoRotating = false);

  const labelPos = new THREE.Vector3();


  function animate() {
    requestAnimationFrame(animate);
    if (isAutoRotating) {
      earthGroup.rotation.y += 0.0015;
    }
    
    // Manage Label Visibility (Occlusion)
    labels.forEach(label => {
      labelPos.setFromMatrixPosition(label.matrixWorld);
      // Distance check from camera to origin vs distance from camera to label
      // Or more simply: dot product of label vector (from earth center) and camera vector
      const dot = labelPos.dot(camera.position);
      // If dot product is > 10000 (roughly sphere radius squared), it's on front
      // Since earth is at origin, labelPos is the vector from center to label.
      // camera.position is the vector from center to camera.
      label.element.style.visibility = dot > 10000 ? 'visible' : 'hidden';
    });

    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
  
  animate();
  
  return { scene, camera, renderer, earthGroup, controls, earthRadius };
}

function createStarField() {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  for (let i = 0; i < 5000; i++) {
    vertices.push(
      THREE.MathUtils.randFloatSpread(1000),
      THREE.MathUtils.randFloatSpread(1000),
      THREE.MathUtils.randFloatSpread(1000)
    );
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
  return new THREE.Points(geometry, material);
}

