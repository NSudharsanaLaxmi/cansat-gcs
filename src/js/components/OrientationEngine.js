/**
 * Three.js WebGL 3D Satellite Model & PFD Horizon Component
 * @module components/OrientationEngine
 */

export class OrientationEngine {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.satelliteGroup = null;
  }

  init() {
    const container = document.getElementById('canvas-3d');
    if (!container) return;

    const w = container.clientWidth || 300;
    const h = container.clientHeight || 220;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    this.camera.position.set(0, 0, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const light = new THREE.DirectionalLight(0x00f0ff, 1.2);
    light.position.set(5, 5, 5);
    this.scene.add(light);

    // CanSat Mesh Assembly
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x1e293b, specular: 0x00f0ff, shininess: 30 });
    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.5, 32), bodyMat);
    group.add(bodyMesh);

    const solarMat = new THREE.MeshPhongMaterial({ color: 0x0284c7 });
    const solarWing = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 0.05), solarMat);
    group.add(solarWing);

    this.satelliteGroup = group;
    this.scene.add(this.satelliteGroup);

    const renderLoop = () => {
      requestAnimationFrame(renderLoop);
      this.renderer.render(this.scene, this.camera);
    };
    renderLoop();
  }

  update(pitch, roll, yaw) {
    if (this.satelliteGroup) {
      const pRad = THREE.MathUtils.degToRad(pitch);
      const rRad = THREE.MathUtils.degToRad(roll);
      const yRad = THREE.MathUtils.degToRad(yaw);
      this.satelliteGroup.rotation.set(pRad, yRad, rRad);
    }

    const sky = document.getElementById('pfd-sky');
    if (sky) {
      const pitchOffset = pitch * 1.5;
      sky.style.transform = `translate(-50%, calc(-50% + ${pitchOffset}px)) rotate(${-roll}deg)`;
    }
  }
}
