import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { components, type Component } from './curriculum';

export type HarnessScene = {
  select: (id: Component) => void;
  pause: (value: boolean) => void;
  explode: (value: boolean) => void;
  reset: () => void;
  pulse: (id: Component, failed?: boolean) => void;
  dispose: () => void;
};

export function createScene(host: HTMLElement, onSelect: (id: Component) => void, onUnavailable: () => void): HarnessScene {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 80);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x080f14, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D harness assembly. Use the component buttons to select a layer; drag to orbit.');
  renderer.domElement.setAttribute('role', 'img');
  host.prepend(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = Math.PI / 5;
  controls.maxPolarAngle = Math.PI / 2.2;
  const reset = () => { camera.position.set(8, 6, 10.3); controls.target.set(0, 0, 0); controls.update(); };
  reset();
  scene.add(new THREE.HemisphereLight(0xd0f9ef, 0x132837, 2.4));
  const key = new THREE.DirectionalLight(0xe7fff6, 3.2); key.position.set(3, 8, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x70c3c9, 0.9); rim.position.set(-5, 3, -5); scene.add(rim);
  const group = new THREE.Group(); scene.add(group);
  const layerGroups: THREE.Group[] = [];
  const plates: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>[] = [];
  const edges: THREE.LineSegments[] = [];
  const pickables: THREE.Object3D[] = [];
  let selected: Component = 'model';
  let expanded = true;
  let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = true;
  let disposed = false;
  let frame = 0;
  let lastFrame = 0;
  let time = 0;
  let pulseUntil = 0;
  let failed = false;
  const labels = document.createElement('div'); labels.className = 'scene-labels'; host.append(labels);
  const labelButtons: HTMLButtonElement[] = [];

  components.forEach((component, i) => {
    const layer = new THREE.Group(); layer.userData.component = component.id;
    const radius = i === 2 ? 1.9 : 2.48 - Math.abs(i - 3) * 0.095;
    const geometry = new THREE.CylinderGeometry(radius, radius, 0.105, 6);
    const material = new THREE.MeshStandardMaterial({ color: 0x142d34, metalness: 0.58, roughness: 0.36, transparent: true, opacity: 0.84 });
    const plate = new THREE.Mesh(geometry, material); plate.userData.component = component.id; layer.add(plate); plates.push(plate); pickables.push(plate);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: component.color, transparent: true, opacity: 0.45 })); layer.add(edge); edges.push(edge);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.79, 0.014, 5, 72), new THREE.MeshBasicMaterial({ color: component.color, transparent: true, opacity: 0.65 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.075; layer.add(ring);
    for (let j = 0; j < 6; j++) {
      const angle = j * Math.PI / 3;
      const chip = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.07, 0.14), new THREE.MeshStandardMaterial({ color: component.color, metalness: 0.65, roughness: 0.35 }));
      chip.position.set(Math.cos(angle) * radius * 0.84, 0.1, Math.sin(angle) * radius * 0.84); chip.rotation.y = -angle;
      layer.add(chip);
      const track = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.5 * Math.cos(angle), 0.08, 0.5 * Math.sin(angle)), chip.position]), new THREE.LineBasicMaterial({ color: component.color, transparent: true, opacity: 0.28 })); layer.add(track);
    }
    layer.position.y = (3 - i) * 0.83;
    group.add(layer); layerGroups.push(layer);
    const label = document.createElement('button'); label.className = 'layer-label'; label.dataset.component = component.id;
    label.innerHTML = `<span class="layer-dot" style="--layer-color:${component.color}"></span><span>${component.title}</span>`;
    label.addEventListener('click', () => onSelect(component.id)); labels.append(label); labelButtons.push(label);
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.63, 0), new THREE.MeshStandardMaterial({ color: 0x65efb9, emissive: 0x13875e, emissiveIntensity: 0.5, metalness: 0.35, roughness: 0.2 }));
  core.position.y = 0.38; layerGroups[2].add(core); core.userData.component = 'model'; pickables.push(core);
  const coreWire = new THREE.LineSegments(new THREE.EdgesGeometry(core.geometry), new THREE.LineBasicMaterial({ color: 0xc1ffe3 })); core.add(coreWire);
  const spine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -2.65, 0), new THREE.Vector3(0, 2.65, 0)]), new THREE.LineDashedMaterial({ color: 0x52c8a0, dashSize: 0.09, gapSize: 0.12, transparent: true, opacity: 0.6 })); spine.computeLineDistances(); group.add(spine);
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;
    const x = Math.cos(angle) * 2.75, z = Math.sin(angle) * 2.75;
    const post = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, -2.85, z), new THREE.Vector3(x, 2.85, z)]), new THREE.LineBasicMaterial({ color: 0x547b88, transparent: true, opacity: 0.2 })); group.add(post);
  }
  const floor = new THREE.GridHelper(12, 24, 0x264550, 0x142c36); floor.position.y = -3.15;
  (floor.material as THREE.Material).transparent = true; (floor.material as THREE.Material).opacity = 0.36; scene.add(floor);
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.012, 4, 100), new THREE.MeshBasicMaterial({ color: 0x38636b, transparent: true, opacity: 0.6 })); baseRing.rotation.x = Math.PI / 2; baseRing.position.y = -3.14; scene.add(baseRing);
  const signal = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), new THREE.MeshBasicMaterial({ color: 0xadffdc })); group.add(signal);
  const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2(); let downX = 0, downY = 0;
  const pointerDown = (event: PointerEvent) => { downX = event.clientX; downY = event.clientY; };
  const pointerUp = (event: PointerEvent) => {
    if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables)[0];
    if (hit) onSelect(hit.object.userData.component as Component);
  };
  renderer.domElement.addEventListener('pointerdown', pointerDown); renderer.domElement.addEventListener('pointerup', pointerUp);
  const draw = () => {
    if (disposed || !active || !host.clientWidth || !host.clientHeight) return;
    components.forEach((component, i) => {
      const highlight = component.id === selected;
      plates[i].material.color.set(highlight ? (failed && performance.now() < pulseUntil ? 0x5b3224 : 0x235e50) : 0x142d34);
      plates[i].material.emissive.set(highlight ? 0x0b3727 : 0x000000);
      (edges[i].material as THREE.LineBasicMaterial).opacity = highlight ? 1 : 0.4;
      layerGroups[i].position.y = (3 - i) * (expanded ? 0.83 : 0.3);
      labelButtons[i].classList.toggle('selected', highlight);
      labelButtons[i].setAttribute('aria-pressed', String(highlight));
      // Labels form a stable, non-overlapping index; the selected plate supplies the spatial correspondence.
      labelButtons[i].style.top = `${16 + i * 10.8}%`;
    });
    spine.scale.y = expanded ? 1 : 0.4;
    signal.position.set(0, (2.55 - (time * 0.65) % 5.1) * (expanded ? 1 : 0.4), 0);
    renderer.render(scene, camera);
  };
  const resize = new ResizeObserver(() => {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.fov = width < 500 ? 46 : 37;
    camera.updateProjectionMatrix(); renderer.setSize(width, height); draw();
  }); resize.observe(host);
  const observer = new IntersectionObserver(([entry]) => { active = entry.isIntersecting; draw(); }); observer.observe(host);
  const visibility = () => { active = !document.hidden; draw(); }; document.addEventListener('visibilitychange', visibility);
  const animate = (now: number) => {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    if (!paused && active && now - lastFrame > 32) {
      time += Math.min((now - lastFrame) / 1000, 0.05); lastFrame = now;
      core.rotation.y = time * 0.15; draw();
    }
  };
  controls.addEventListener('change', draw);
  const contextLost = (event: globalThis.Event) => { event.preventDefault(); onUnavailable(); };
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  frame = requestAnimationFrame(animate);
  host.dataset.engine = 'three';
  return {
    select: id => { selected = id; draw(); },
    pause: value => { paused = value; draw(); },
    explode: value => { expanded = value; draw(); },
    reset: () => { reset(); draw(); },
    pulse: (id, isFailed = false) => { selected = id; failed = isFailed; pulseUntil = performance.now() + 1000; draw(); },
    dispose: () => {
      if (disposed) return; disposed = true; cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect(); controls.dispose();
      document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('pointerdown', pointerDown); renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      scene.traverse(object => { if ('geometry' in object) (object.geometry as THREE.BufferGeometry).dispose(); if ('material' in object) { const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(material => (material as THREE.Material).dispose()); } });
      renderer.dispose(); renderer.domElement.remove(); labels.remove();
    },
  };
}
