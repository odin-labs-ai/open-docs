import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { StageSpec, StageRenderer, StageLayout, StageFrame, StageNode } from './stage-types';
import { buildStageObject, labelTexture, stagePalette, type AssetState, type StageObject } from './stage-geometry';

type RouteSegment = { from: string; to: string; curve: THREE.QuadraticBezierCurve3 };
type NodeLabel = { node: StageNode; button: HTMLButtonElement; leader: SVGLineElement; position: THREE.Vector3; sprite: THREE.Sprite };
const arrangements: Record<StageLayout, [number, number][]> = {
  'pi-workbench': [[-3.8, 1.8], [-3.7, -1.7], [0, 0], [3.8, -1.7], [3.8, 1.8], [0, 3.4]],
  'codex-sandbox': [[-4, 0], [-1, -2.8], [0, 0.4], [3.6, -1.5], [3.6, 2.2], [-0.8, 3.9]],
  'claude-hooks': [[-4.7, 0], [-2.2, -1.9], [0.6, 0], [3.5, -1.9], [4.1, 1.9], [0.2, 3.4]],
  'droid-pipeline': [[-4.8, -1.8], [-2.4, -0.8], [0, 0], [2.4, 0.8], [4.8, 1.8], [0, -3.1]],
  'deepseek-wire': [[-3.7, 1.8], [-3.7, -1.8], [0, -1.8], [3.7, -1.8], [3.7, 1.8], [0, 1.8]],
  'contract-desk': [[-3.2, 1.2], [-3.2, -2.1], [0, 0.4], [3.3, -2.1], [3.3, 1.2], [0, 3.4]],
  'context-cutaway': [[-3.8, -2.5], [-3.8, 0.6], [-0.8, -2.5], [-0.8, 0.6], [3, -0.6], [3, 2.9]],
  'boundary-section': [[-4, -1.8], [-4, 1.8], [0, 0], [3.7, -1.8], [3.7, 1.8], [0, 3.5]],
  'evidence-bench': [[-3.7, -1.8], [-3.7, 1.8], [0, 0], [3.7, -1.8], [3.7, 1.8], [0, 3.5]],
  'session-branches': [[0, 2.9], [0, -0.5], [-3.6, -3.3], [3.6, -3.3], [-3.6, 0.4], [3.6, 0.4]],
  'recovery-bridge': [[-4.1, 1.1], [-2.5, -2.1], [0, -0.8], [2.5, -2.1], [4.1, 1.1], [0, 2.7]],
  'trace-waterfall': [[-4, -3], [-2, -1.6], [0, 0], [2, 1.6], [4, 3], [4, -2]],
  'eval-arena': [[-3.6, 2], [-3.6, -1.8], [0, -2.5], [3.6, -1.8], [3.6, 2], [0, 1]],
  'fleet-worktrees': [[-4.1, 0], [-0.6, -3.2], [-0.6, 0], [-0.6, 3.2], [3.7, -1.6], [3.7, 1.8]],
  'budget-ledger': [[-4.2, -1.7], [-4.2, 1.7], [-0.6, 0], [3.1, -1.7], [3.1, 1.7], [-0.6, 3.4]],
  'tenant-enclave': [[-4.1, 0], [-0.8, -2.8], [-0.8, 0.4], [3.1, -2.8], [3.1, 0.4], [1.1, 3.5]],
};
const css = `
.stage-renderer{position:relative;width:100%;height:100%;min-height:260px;overflow:hidden;isolation:isolate;--stage-label-bg:#132d22;--stage-label-text:#e0f7e9;--stage-label-line:#59856c;--stage-label-focus:#8ae7b7;--stage-label-warning:#edba77;background:#0b1b15}
.stage-renderer[data-light=true]{--stage-label-bg:#f0f6ef;--stage-label-text:#1d4932;--stage-label-line:#8fac97;--stage-label-focus:#157b50;--stage-label-warning:#965319;background:#eff4ed}
.stage-renderer canvas{position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:pan-y}
.stage-node-labels,.stage-label-leaders{position:absolute;inset:0;pointer-events:none;width:100%;height:100%;overflow:hidden}
.stage-node-label{position:absolute;pointer-events:auto;display:flex;flex-direction:column;justify-content:center;min-height:42px;max-width:145px;width:max-content;padding:5px 9px;color:var(--stage-label-text);background:var(--stage-label-bg);border:1px solid var(--stage-label-line);border-radius:5px;font-family:inherit;font-size:12px;font-weight:500;line-height:1.25;text-align:center;cursor:pointer;white-space:normal;overflow-wrap:anywhere;box-sizing:border-box}
.stage-node-label[data-state=blocked]{border-color:var(--stage-label-warning)}
.stage-node-label[aria-pressed=true]{border-color:var(--stage-label-focus);box-shadow:0 3px 10px #0002}
.stage-node-label:hover{filter:brightness(1.08)}
.stage-node-label:focus-visible{outline:3px solid var(--stage-label-focus);outline-offset:3px}
.stage-node-label small{font-family:inherit;font-size:10px;font-weight:400;line-height:1.3;margin-top:2px}
.stage-label-leaders line{stroke:var(--stage-label-line);stroke-width:1;opacity:.7}
.stage-packet-caption{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);padding:6px 10px;max-width:90%;font-size:12px;line-height:1.35;color:var(--stage-label-text);background:var(--stage-label-bg);border-radius:5px;pointer-events:none;text-align:center}
@media(max-width:600px){.stage-node-label{font-size:10px;max-width:112px;min-height:44px;padding:4px 6px}.stage-node-label small{font-size:9px}.stage-packet-caption{font-size:10px;bottom:6px}}
`;

/** A local explanatory stage: geometry and motion never execute the shown code. */
export function createStageRenderer(host: HTMLElement, initial: StageSpec, initialFrame: number, initialSelected: string, onPick: (id: string) => void, onUnavailable: () => void, light: boolean): StageRenderer {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power', preserveDrawingBuffer: true }); }
  catch { onUnavailable(); return { update: () => {}, pause: () => {}, capture: () => null, reset: () => {}, dispose: () => {} }; }
  const previousHeight = host.style.height, suppliedHeight = !Number.parseFloat(getComputedStyle(host).height);
  if (suppliedHeight) host.style.height = 'clamp(360px,52vw,600px)';
  const root = document.createElement('div'); root.className = 'stage-renderer'; root.dataset.light = String(light);
  const style = document.createElement('style'); style.textContent = css + `.stage-node-label{width:44px;max-width:44px;min-height:44px;height:44px;border-radius:50%;padding:0;font:600 15px/1 sans-serif}.stage-node-label small{display:none}.stage-node-label[aria-pressed=true]{background:var(--stage-label-focus);color:var(--stage-label-bg)}.stage-packet-caption{font-size:12px;max-width:90%;line-height:1.4}`; root.append(style);
  const leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); leaders.classList.add('stage-label-leaders'); leaders.setAttribute('aria-hidden', 'true');
  const labelsLayer = document.createElement('div'); labelsLayer.className = 'stage-node-labels'; labelsLayer.setAttribute('aria-label', 'Inspect an engineered component');
  const packetCaption = document.createElement('div'); packetCaption.className = 'stage-packet-caption'; packetCaption.setAttribute('aria-live', 'polite');
  root.append(renderer.domElement, leaders, labelsLayer, packetCaption); host.append(root); host.dataset.engine = 'three-stage';
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.setClearColor(light ? 0xeff4ed : 0x0b1b15, 1); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('role', 'img');
  const scene = new THREE.Scene(), palette = stagePalette(light);
  scene.add(new THREE.HemisphereLight(0xf1fff2, light ? 0x667665 : 0x152e20, 2.4));
  const key = new THREE.DirectionalLight(0xffffff, 3.5); key.position.set(-5, 12, 7); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -12; key.shadow.camera.right = 12; key.shadow.camera.top = 12; key.shadow.camera.bottom = -12; key.shadow.normalBias = 0.04; scene.add(key);
  const fill = new THREE.DirectionalLight(0xa4e9c9, 1.5); fill.position.set(7, 5, -4); scene.add(fill);
  const camera = new THREE.OrthographicCamera(-9, 9, 6, -6, 0.1, 90); camera.position.set(9, 11, 14);
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = false; controls.enablePan = false; controls.enableZoom = true; controls.minZoom = 0.8; controls.maxZoom = 1.75; controls.minPolarAngle = 0.35; controls.maxPolarAngle = 1.3; controls.target.set(0, 0.6, 0); controls.update();
  let content = new THREE.Group(); scene.add(content);
  let retired: THREE.Group | undefined;
  let selectionOutline: THREE.LineSegments | undefined;
  const positions = new Map<string, THREE.Vector3>(), objects = new Map<string, StageObject>(), nodeLabels: NodeLabel[] = [], routeSegments: RouteSegment[] = [];
  const pickables: THREE.Object3D[] = [], linkLabels: THREE.Sprite[] = [];
  let spec = initial, frameIndex = initialFrame, selected = initialSelected, frameData: StageFrame;
  let disposed = false, lost = false, paused = false, intersecting = false, renderRequest = 0, animationRequest = 0, elapsed = 0, lastTime = 0, animating = false;
  let journey: RouteSegment[] = [], packet: THREE.Group | undefined, hasRendered = false, sceneCenter = new THREE.Vector3(), viewFit = { halfWidth: 8, halfHeight: 6 };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sprite = (text: string, width: number, height: number, background = palette.paper) => {
    const object = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(text, palette.text, background, Math.max(170, Math.min(720, text.length * 23 + 34))), depthTest: false, transparent: false })); object.scale.set(width, height, 1); object.renderOrder = 5; return object;
  };
  const disposeGroup = (group: THREE.Object3D) => {
    const textures = new Set<THREE.Texture>();
    group.traverse(object => {
      if ('geometry' in object) (object.geometry as THREE.BufferGeometry).dispose();
      if ('material' in object) (Array.isArray(object.material) ? object.material : [object.material]).forEach(item => {
        const material = item as THREE.Material & { map?: THREE.Texture }; if (material.map) textures.add(material.map); material.dispose();
      });
    }); textures.forEach(texture => texture.dispose());
  };
  const renderScene = () => {
    renderer.render(scene, camera); content.userData.rendered = true;
    if (retired) { disposeGroup(retired); retired = undefined; }
  };
  const stateOf = (id: string): AssetState => frameData.states?.[id] || (frameData.focus.includes(id) ? 'active' : 'ready');
  const project = (position: THREE.Vector3) => { const point = position.clone().project(camera); return { x: (point.x + 1) * root.clientWidth / 2, y: (1 - point.y) * root.clientHeight / 2 }; };
  const placeLabels = () => {
    const width = root.clientWidth, height = root.clientHeight;
    if (!width || !height) return;
    const occupied: { x: number; y: number; w: number; h: number }[] = [];
    const labels = nodeLabels.map(label => ({ label, anchor: project(label.position) })).sort((a, b) => a.anchor.y - b.anchor.y);
    for (const { label, anchor } of labels) {
      const w = 44, h = 44;
      const clamp = (x: number, y: number) => ({ x: Math.max(5, Math.min(width - w - 5, x)), y: Math.max(6, Math.min(height - h - 43, y)), w, h });
      const options = [clamp(anchor.x - w / 2, anchor.y - h / 2)];
      for (const dy of [-52, 52, -104, 104, -156, 156]) for (const dx of [0, -w - 9, w + 9]) options.push(clamp(anchor.x - w / 2 + dx, anchor.y - h / 2 + dy));
      const overlaps = (a: typeof options[number], b: typeof options[number]) => a.x < b.x + b.w + 5 && a.x + a.w + 5 > b.x && a.y < b.y + b.h + 4 && a.y + a.h + 4 > b.y;
      const chosen = options.find(option => occupied.every(other => !overlaps(option, other))) || options[0]; occupied.push(chosen);
      label.button.style.left = `${chosen.x}px`; label.button.style.top = `${chosen.y}px`;
      label.leader.setAttribute('x1', String(anchor.x)); label.leader.setAttribute('y1', String(anchor.y + 12)); label.leader.setAttribute('x2', String(chosen.x + w / 2)); label.leader.setAttribute('y2', String(chosen.y + h / 2));
      label.leader.style.display = Math.hypot(chosen.x + w / 2 - anchor.x, chosen.y + h / 2 - anchor.y) > 24 ? '' : 'none';
    }
  };
  const draw = () => {
    if (disposed || lost || !intersecting || document.hidden) return;
    placeLabels();
    if (!renderRequest) renderRequest = requestAnimationFrame(() => { renderRequest = 0; if (!disposed && !lost && intersecting && !document.hidden) renderScene(); });
  };
  const fit = (resetAngle = false) => {
    const width = root.clientWidth, height = root.clientHeight; if (!width || !height) return;
    if (resetAngle) { camera.position.copy(sceneCenter).add(new THREE.Vector3(9, 11, 14)); controls.target.copy(sceneCenter); camera.zoom = 1; controls.update(); }
    camera.updateMatrixWorld();
    const corners = new THREE.Box3().setFromObject(content); const min = corners.min, max = corners.max;
    let maxX = 0, maxY = 0;
    for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) {
      const point = new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse); maxX = Math.max(maxX, Math.abs(point.x)); maxY = Math.max(maxY, Math.abs(point.y));
    }
    const aspect = width / height, vertical = Math.max(3, maxY * 1.09, maxX / aspect * 1.08);
    viewFit = { halfHeight: vertical, halfWidth: vertical * aspect };
    camera.left = -viewFit.halfWidth; camera.right = viewFit.halfWidth; camera.top = viewFit.halfHeight; camera.bottom = -viewFit.halfHeight; camera.updateProjectionMatrix();
    controls.enableRotate = width >= 600; controls.enableZoom = width >= 600; renderer.setSize(width, height, false); draw();
  };
  const frameRoute = () => {
    const result: RouteSegment[] = [];
    for (let index = 1; index < frameData.route.length; index++) {
      const from = frameData.route[index - 1], to = frameData.route[index];
      if (stateOf(from) === 'blocked') break;
      const segment = routeSegments.find(edge => edge.from === from && edge.to === to);
      if (segment) result.push(segment);
      if (stateOf(to) === 'blocked') break;
    }
    return result;
  };
  const endPacket = () => {
    if (!packet) return;
    if (journey.length) packet.position.copy(journey[journey.length - 1].curve.getPoint(1));
    else { const id = frameData.focus[0] || frameData.route[0], position = positions.get(id); packet.visible = Boolean(position); if (position) packet.position.copy(position).add(new THREE.Vector3(0, 0.85, 0.98)); }
  };
  const applyProgress = (progress: number) => {
    objects.forEach((object, id) => object.animate(reduced.matches || stateOf(id) !== 'active' && stateOf(id) !== 'passed' ? 1 : progress));
    if (packet && journey.length && progress < 1) { const segment = Math.min(journey.length - 1, Math.floor(progress * journey.length)); packet.position.copy(journey[segment].curve.getPoint(progress * journey.length - segment)); }
    else endPacket();
  };
  const tick = (now: number) => {
    animationRequest = 0; if (!animating || paused || disposed || lost || reduced.matches || !intersecting || document.hidden) return;
    if (lastTime) elapsed += Math.min(80, now - lastTime); lastTime = now;
    const progress = Math.min(1, elapsed / 1850); applyProgress(progress); draw();
    if (progress < 1) animationRequest = requestAnimationFrame(tick); else animating = false;
  };
  const schedule = () => { lastTime = 0; if (!animationRequest && animating && !paused && !reduced.matches && !disposed && !lost && intersecting && !document.hidden) animationRequest = requestAnimationFrame(tick); };
  const applySelection = (id: string) => {
    selected = id;
    const object = objects.get(id);
    if (selectionOutline) {
      selectionOutline.visible = Boolean(object);
      if (object) { selectionOutline.position.copy(object.group.position).add(new THREE.Vector3(0, 0.09, 0)); selectionOutline.rotation.copy(object.group.rotation); }
    }
    nodeLabels.forEach(label => label.button.setAttribute('aria-pressed', String(label.node.id === id)));
    objects.forEach((asset, nodeId) => { asset.group.userData.selected = nodeId === id; });
  };
  const update = (next: StageSpec, nextFrame: number, nextSelected: string) => {
    if (disposed || lost) return;
    const requestedFrame = Math.max(0, Math.min(nextFrame, next.frames.length - 1));
    if (hasRendered && next === spec && requestedFrame === frameIndex && nextSelected !== selected) {
      // Inspection is not an execution transition. Keep GPU resources, code,
      // authority poses, packet progress, and keyboard targets intact.
      applySelection(nextSelected); draw(); return;
    }
    const changed = spec.id !== next.id, transition = !hasRendered || spec.id !== next.id || frameIndex !== Math.max(0, Math.min(nextFrame, next.frames.length - 1)) || selected === nextSelected, focused = document.activeElement instanceof HTMLElement && labelsLayer.contains(document.activeElement) ? document.activeElement.dataset.stageNode : undefined;
    spec = next; frameIndex = Math.max(0, Math.min(nextFrame, spec.frames.length - 1)); selected = nextSelected;
    frameData = spec.frames[frameIndex] || { id: 'ready', title: spec.title, explanation: spec.subtitle, focus: [], route: [] };
    cancelAnimationFrame(animationRequest); animationRequest = 0; elapsed = 0; lastTime = 0;
    // Retain the last drawn materials until the next draw acquires their shader
    // programs. Disposing them first forces shader recompilation on every event.
    // Undrawn intermediate frames are disposed immediately; at most two groups live.
    if (content.userData.rendered) { if (retired) disposeGroup(retired); retired = content; } else disposeGroup(content);
    scene.remove(content); content = new THREE.Group(); scene.add(content);
    positions.clear(); objects.clear(); nodeLabels.length = 0; routeSegments.length = 0; pickables.length = 0; linkLabels.length = 0; labelsLayer.replaceChildren(); leaders.replaceChildren();
    root.dataset.layout = spec.layout; root.dataset.frame = frameData.id;
    renderer.domElement.setAttribute('aria-label', `${spec.title}. ${frameData.title}. ${frameData.explanation} Named buttons inspect each component. ${root.clientWidth >= 600 ? 'Drag the workbench to inspect its depth.' : ''}`);
    const defaults = arrangements[spec.layout];
    spec.nodes.forEach((node, index) => {
      const fallback = defaults[index] || [(index % 3 - 1) * 3.5, Math.floor(index / 3) * 3.3];
      positions.set(node.id, new THREE.Vector3(...(node.position || [fallback[0], 0, fallback[1]])));
    });
    const bounds = new THREE.Box3(); positions.forEach(position => bounds.expandByPoint(position));
    if (bounds.isEmpty()) bounds.set(new THREE.Vector3(-3, 0, -2), new THREE.Vector3(3, 0, 2));
    sceneCenter = bounds.getCenter(new THREE.Vector3()).add(new THREE.Vector3(0, 0.75, 0));
    const slab = new THREE.Mesh(new THREE.BoxGeometry(bounds.max.x - bounds.min.x + 3.05, 0.28, bounds.max.z - bounds.min.z + 2.9), new THREE.MeshStandardMaterial({ color: palette.floor, roughness: 0.72, metalness: 0.12 })); slab.position.copy(bounds.getCenter(new THREE.Vector3())).add(new THREE.Vector3(0, -0.25, 0)); slab.receiveShadow = true; content.add(slab);
    if (spec.layout === 'boundary-section' || spec.layout === 'tenant-enclave' || spec.layout === 'codex-sandbox') {
      const gate = spec.nodes.find(node => node.asset === 'permission-gate' || node.asset === 'tenant-vault'), position = gate ? positions.get(gate.id)! : sceneCenter;
      const section = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, bounds.max.z - bounds.min.z + 2.4), new THREE.MeshBasicMaterial({ color: palette.warning })); section.position.set(position.x, -0.09, sceneCenter.z); content.add(section);
    }
    spec.nodes.forEach(node => {
      const state = stateOf(node.id), isSelected = selected === node.id, object = buildStageObject(node, node.id === frameData.focus[0] && frameData.code ? frameData.code : node.code, state, isSelected, palette);
      object.group.position.copy(positions.get(node.id)!);
      if (node.asset === 'permission-gate') {
        const incoming = spec.links.find(link => link.to === node.id), source = incoming && positions.get(incoming.from);
        if (source) { const direction = object.group.position.clone().sub(source); if (direction.x || direction.z) object.group.rotation.y = Math.atan2(direction.x, direction.z); }
      }
      objects.set(node.id, object); content.add(object.group);
      object.group.traverse(child => { if (child instanceof THREE.Mesh) pickables.push(child); });
      const button = document.createElement('button'); button.type = 'button'; button.className = 'stage-node-label'; button.dataset.stageNode = node.id; button.dataset.state = state; button.setAttribute('aria-pressed', String(isSelected)); button.title = node.detail;
      const name = document.createElement('span'); name.textContent = String(spec.nodes.indexOf(node) + 1); button.setAttribute('aria-label', `${node.label}: ${state === 'blocked' ? 'blocked before action' : state === 'active' ? 'current event' : state}. Inspect code`); const status = document.createElement('small'); status.textContent = state === 'blocked' ? 'Blocked before action' : state === 'passed' ? 'Passed' : state === 'active' ? 'Current step' : 'Inspect component'; button.append(name, status); button.addEventListener('click', () => onPick(node.id)); labelsLayer.append(button);
      const position = object.group.position.clone().add(new THREE.Vector3(0, object.labelHeight + 0.15, 0));
      const labelSprite = sprite(node.label, 2.15, 0.44); labelSprite.position.copy(position); labelSprite.visible = false; content.add(labelSprite);
      const leader = document.createElementNS('http://www.w3.org/2000/svg', 'line'); leaders.append(leader); nodeLabels.push({ node, button, leader, position, sprite: labelSprite });
    });
    selectionOutline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.15, 0.04, 1.84)), new THREE.LineBasicMaterial({ color: palette.accent }));
    content.add(selectionOutline); applySelection(selected);
    spec.links.forEach(link => {
      const from = positions.get(link.from), to = positions.get(link.to); if (!from || !to || from.equals(to)) return;
      const delta = to.clone().sub(from).setY(0).normalize(), a = from.clone().addScaledVector(delta, 1.03).add(new THREE.Vector3(0, 0.34, 0)), b = to.clone().addScaledVector(delta, -1.03).add(new THREE.Vector3(0, 0.34, 0));
      const middle = a.clone().lerp(b, 0.5); middle.y += 0.4;
      const curve = new THREE.QuadraticBezierCurve3(a, middle, b), denied = link.kind === 'denied' || stateOf(link.from) === 'blocked';
      const path = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(30)), new THREE.LineDashedMaterial({ color: denied ? palette.warning : palette.edge, dashSize: denied ? 0.13 : 20, gapSize: denied ? 0.1 : 0, transparent: true, opacity: denied ? 0.55 : 0.85 })); path.computeLineDistances(); content.add(path);
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.27, 4), new THREE.MeshBasicMaterial({ color: denied ? palette.warning : palette.accent })); arrow.position.copy(curve.getPoint(0.86)); arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangent(0.86)); content.add(arrow);
      const label = sprite(link.label, Math.min(3.6, Math.max(1.2, link.label.length * 0.105 + 0.2)), 0.46); label.position.copy(curve.getPoint(0.5)).add(new THREE.Vector3(0, 0.25, 0)); label.visible = false; content.add(label); linkLabels.push(label);
      routeSegments.push({ from: link.from, to: link.to, curve });
    });
    packet = new THREE.Group();
    const packetBody = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.16, 0.32), new THREE.MeshStandardMaterial({ color: frameData.route.some(id => stateOf(id) === 'blocked') ? palette.warning : palette.accent, emissive: palette.accent, emissiveIntensity: 0.16 })); packetBody.castShadow = true; packet.add(packetBody);
    const packetName = sprite(frameData.packet || 'Current observation', 2.4, 0.43); packetName.visible = false; packetName.position.y = 0.48; packet.add(packetName); content.add(packet);
    journey = frameRoute(); packet.visible = Boolean(frameData.route.length || frameData.focus.length);
    const blocked = frameData.route.find(id => stateOf(id) === 'blocked');
    packetCaption.textContent = blocked ? `${frameData.packet || 'Request'} stops at ${spec.nodes.find(node => node.id === blocked)?.label || blocked}.` : frameData.packet || frameData.title;
    animating = transition && !paused && !reduced.matches && (journey.length > 0 || frameData.focus.length > 0); hasRendered = true; applyProgress(animating ? 0 : 1);
    fit(changed || !nodeLabels.length || controls.target.distanceTo(sceneCenter) > 0.1); draw(); schedule();
    if (focused) nodeLabels.find(label => label.node.id === focused)?.button.focus({ preventScroll: true });
  };
  const resize = new ResizeObserver(() => fit()); resize.observe(root);
  const intersection = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; if (intersecting) { draw(); schedule(); } else { cancelAnimationFrame(animationRequest); animationRequest = 0; lastTime = 0; } }); intersection.observe(root);
  const visibility = () => { if (document.hidden) { cancelAnimationFrame(animationRequest); animationRequest = 0; lastTime = 0; } else { draw(); schedule(); } }; document.addEventListener('visibilitychange', visibility);
  const motionChange = () => { if (reduced.matches) { cancelAnimationFrame(animationRequest); animationRequest = 0; animating = false; applyProgress(1); draw(); } }; reduced.addEventListener('change', motionChange);
  controls.addEventListener('change', draw);
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(); let startPointer = { x: 0, y: 0 };
  const down = (event: PointerEvent) => { startPointer = { x: event.clientX, y: event.clientY }; };
  const up = (event: PointerEvent) => {
    if (Math.hypot(event.clientX - startPointer.x, event.clientY - startPointer.y) > 7) return; const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(pickables, false)[0]; if (hit) onPick(hit.object.userData.nodeId as string);
  };
  renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointerup', up);
  const contextLost = (event: Event) => { event.preventDefault(); lost = true; cancelAnimationFrame(animationRequest); cancelAnimationFrame(renderRequest); root.hidden = true; host.dataset.engine = 'fallback'; onUnavailable(); }; renderer.domElement.addEventListener('webglcontextlost', contextLost);
  update(initial, initialFrame, initialSelected);
  return {
    update,
    pause: value => { paused = value; if (paused) { cancelAnimationFrame(animationRequest); animationRequest = 0; } else schedule(); },
    capture: () => {
      if (disposed || lost) return null;
      try { nodeLabels.forEach(label => { label.sprite.visible = true; }); renderScene(); const image = renderer.domElement.toDataURL('image/png'); nodeLabels.forEach(label => { label.sprite.visible = false; }); draw(); return image; }
      catch { nodeLabels.forEach(label => { label.sprite.visible = false; }); return null; }
    },
    reset: () => { fit(true); draw(); },
    dispose: () => {
      if (disposed) return; disposed = true; cancelAnimationFrame(animationRequest); cancelAnimationFrame(renderRequest); resize.disconnect(); intersection.disconnect(); controls.dispose(); document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', motionChange);
      renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('webglcontextlost', contextLost); disposeGroup(content); if (retired) { disposeGroup(retired); retired = undefined; } key.shadow.map?.dispose(); renderer.dispose(); root.remove(); if (suppliedHeight) host.style.height = previousHeight;
    },
  };
}
