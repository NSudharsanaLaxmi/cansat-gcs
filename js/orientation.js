/* ==========================================================================
   Three.js 3D CanSat Model & Artificial Horizon PFD Instrument
   ========================================================================== */

class OrientationManager {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cansatMesh = null;
  }

  init() {
    const container = document.getElementById('canvas-3d');
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 220;

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 8);

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.2);
    dirLight.position.set(5, 5, 5);
    this.scene.add(dirLight);

    // 4. CanSat Satellite Geometry Group
    const canSatGroup = new THREE.Group();

    // Main Cylindrical Body
    const bodyGeo = new THREE.CylinderGeometry(0.9, 0.9, 2.5, 32);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: 0x1e293b,
      specular: 0x00f0ff,
      shininess: 30,
      wireframe: false
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    canSatGroup.add(bodyMesh);

    // Gold Foil / Accent Bands
    const bandGeo = new THREE.CylinderGeometry(0.92, 0.92, 0.4, 32);
    const bandMat = new THREE.MeshPhongMaterial({ color: 0xeab308 });
    const bandMesh = new THREE.Mesh(bandGeo, bandMat);
    canSatGroup.add(bandMesh);

    // Solar Panel Wings
    const wingGeo = new THREE.BoxGeometry(3.6, 1.2, 0.05);
    const wingMat = new THREE.MeshPhongMaterial({ color: 0x0284c7 });
    const wingMesh = new THREE.Mesh(wingGeo, wingMat);
    canSatGroup.add(wingMesh);

    // Parachute Loop Top
    const ringGeo = new THREE.TorusGeometry(0.3, 0.05, 16, 32);
    const ringMat = new THREE.MeshPhongMaterial({ color: 0xef4444 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 1.35;
    canSatGroup.add(ringMesh);

    this.cansatMesh = canSatGroup;
    this.scene.add(this.cansatMesh);

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      this.renderer.render(this.scene, this.camera);
    };
    animate();

    // Handle Window Resize
    window.addEventListener('resize', () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      this.camera.aspect = newW / newH;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(newW, newH);
    });
  }

  update(pitch, roll, yaw) {
    // 1. Update 3D Three.js Object Rotation (Convert Degrees to Radians)
    if (this.cansatMesh) {
      const pitchRad = THREE.MathUtils.degToRad(pitch);
      const rollRad = THREE.MathUtils.degToRad(roll);
      const yawRad = THREE.MathUtils.degToRad(yaw);

      this.cansatMesh.rotation.set(pitchRad, yawRad, rollRad);
    }

    // 2. Update HUD Text
    const textEl = document.getElementById('orientation-vals');
    if (textEl) {
      textEl.innerText = `P:${pitch.toFixed(1)}° R:${roll.toFixed(1)}° Y:${yaw.toFixed(1)}°`;
    }

    // 3. Update PFD Artificial Horizon SVG / CSS transform
    const skyEl = document.getElementById('pfd-sky');
    if (skyEl) {
      // Pitch translates vertically, Roll rotates
      const pitchTranslate = pitch * 1.5; // Scale factor
      skyEl.style.transform = `translate(-50%, calc(-50% + ${pitchTranslate}px)) rotate(${-roll}deg)`;
    }
  }
}

window.orientationManager = new OrientationManager();
