import * as THREE from 'three';
import '../style.css';
import { setupScene } from './three-scene.js';

import { createCables } from './cables.js';
import cablesGeoJSON from './data/cables.json' assert { type: 'json' };
// Initialize the application
async function init() {
  const container = document.getElementById('canvas-container');
  
  // Set up 3D Scene
  const { scene, camera, renderer, earthGroup, controls, earthRadius } = await setupScene(container);
  
  // Render Cables
  const { cablesList } = createCables(scene, earthGroup, earthRadius, cablesGeoJSON);
  
  // Update Cable Count in UI
  document.getElementById('cable-count').textContent = cablesGeoJSON.features.length.toLocaleString();
  
  // Interaction logic
  const raycaster = new THREE.Raycaster();
  // Ensure lines have higher threshold to be easily selectable
  raycaster.params.Line.threshold = 1.0; 
  
  const mouse = new THREE.Vector2();
  
  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cablesList);
    
    const cableInfo = document.getElementById('cable-info');
    const cableName = document.getElementById('cable-name');
    const cableData = document.getElementById('cable-data');
    
    if (intersects.length > 0) {
      const data = intersects[0].object.userData;
      if (data && data.name) {
          cableName.textContent = data.name;
          // Some datasets might use 'capacity' instead of 'bandwidth' or have it missing
          const bandwidth = data.bandwidth || data.capacity || 'Refer to TeleGeography';
          cableData.textContent = `Bandwidth: ${bandwidth}`;
          cableInfo.classList.remove('hidden');
      }
    } else {
      cableInfo.classList.add('hidden');
    }
  });
}

init().catch(console.error);
