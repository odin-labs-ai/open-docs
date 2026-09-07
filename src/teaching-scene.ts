import * as THREE from 'three';

export type TeachingLayout = 'loop' | 'context' | 'boundary' | 'evidence' | 'recovery' | 'fleet';
export type TeachingNode = { id: string; label: string; detail?: string; kind: 'document' | 'model' | 'gate' | 'tool' | 'evidence' | 'memory'; state?: 'idle' | 'active' | 'passed' | 'blocked' };
export type TeachingModel = { layout: TeachingLayout; nodes: TeachingNode[]; edges: [string, string][]; caption: string; active?: string; blocked?: string };
export type TeachingScene = { update: (model: TeachingModel) => void; setLight: (light: boolean) => void; pause: (paused: boolean) => void; reset: () => void; dispose: () => void; capture: () => string | null };
type Route = { from: string; to: string; curve: THREE.QuadraticBezierCurve3 };
const styles = `
.teaching-render{width:100%;position:relative;--teach-ink:#e4f5ed;--teach-muted:#acc8bb;--teach-bg:#0c211c;--teach-line:#375b4d;--teach-accent:#8cf0c1;--teach-active:#184333;color:var(--teach-ink)}
.teaching-render[data-light=true]{--teach-ink:#183e2e;--teach-muted:#456b59;--teach-bg:#f1f8f3;--teach-line:#a4c3b0;--teach-accent:#086846;--teach-active:#d2f1df}
.teaching-stage{height:clamp(320px,38vw,440px);width:100%;position:relative;overflow:hidden;border-radius:12px;background:var(--teach-bg)}
.teaching-stage canvas{display:block;width:100%;height:100%;cursor:pointer;touch-action:pan-y}
.teaching-markers{position:absolute;inset:0;pointer-events:none}
.teaching-marker{position:absolute;display:grid;place-items:center;width:23px;height:23px;border:1px solid var(--teach-line);background:var(--teach-bg);color:var(--teach-ink);border-radius:50%;font-size:11px;font-weight:600;transform:translate(-50%,-50%)}
.teaching-caption{margin:14px 0 12px;font-size:14px;line-height:1.6;color:var(--teach-ink);max-width:70ch}
.teaching-nodes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0;padding:0;list-style:none}
.teaching-nodes button{font-family:inherit;width:100%;min-height:52px;text-align:left;display:flex;gap:9px;align-items:center;padding:9px 11px;background:transparent;border:1px solid var(--teach-line);border-radius:7px;color:var(--teach-ink);cursor:pointer;line-height:1.3;font-size:13px;overflow-wrap:anywhere}
.teaching-nodes button:hover{background:var(--teach-active)}
.teaching-nodes button:focus-visible{outline:3px solid var(--teach-accent);outline-offset:3px}
.teaching-nodes button[aria-pressed=true]{background:var(--teach-active);border-color:var(--teach-accent)}
.teaching-node-key{display:grid;place-items:center;flex:0 0 23px;height:23px;border:1px solid var(--teach-line);border-radius:50%;font-size:11px}
.teaching-node-state{display:block;margin-top:3px;color:var(--teach-muted);font-size:11px}
@media(min-width:1100px){.teaching-nodes{grid-template-columns:repeat(3,minmax(0,1fr))}}
`;

/** A bounded teaching diagram. Content and permission decisions belong to the caller. */
export function createTeachingScene(host: HTMLElement, initial: TeachingModel, onPick: (id: string) => void, onUnavailable: () => void, light = false): TeachingScene {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power', preserveDrawingBuffer: true }); }
  catch { onUnavailable(); return { update: () => {}, setLight: () => {}, pause: () => {}, reset: () => {}, dispose: () => {}, capture: () => null }; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const root = document.createElement('div'); root.className = 'teaching-render';
  const style = document.createElement('style'); style.textContent = styles; root.append(style);
  const stage = document.createElement('div'); stage.className = 'teaching-stage'; root.append(stage);
  renderer.domElement.setAttribute('role', 'img'); stage.append(renderer.domElement);
  const markerLayer = document.createElement('div'); markerLayer.className = 'teaching-markers'; markerLayer.setAttribute('aria-hidden', 'true'); stage.append(markerLayer);
  const caption = document.createElement('p'); caption.className = 'teaching-caption'; root.append(caption);
  const nodeList = document.createElement('ul'); nodeList.className = 'teaching-nodes'; nodeList.setAttribute('aria-label', 'Inspect a diagram component'); root.append(nodeList);
  host.append(root); host.dataset.engine = 'three';
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5, 5, 3.4, -3.4, 0.1, 60); camera.position.set(0, 0, 18); camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xf0fff5, 0x14382d, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3.5); key.position.set(-3, 5, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6ce3be, 2); rim.position.set(4, -2, 3); scene.add(rim);
  let content = new THREE.Group(); scene.add(content);
  const signal = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 8), new THREE.MeshBasicMaterial({ color: 0xf1cd75 })); scene.add(signal);
  const positions = new Map<string, THREE.Vector3>(), markers = new Map<string, HTMLElement>();
  const pickables: THREE.Object3D[] = [], routes: Route[] = [];
  let journey: Route[] = [], model = initial, paused = false, disposed = false, lost = false, intersecting = true, frame = 0, drawFrame = 0, elapsed = 0, lastTick = 0, motionPending = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const disposeObject = (group: THREE.Object3D) => group.traverse(object => {
    if ('geometry' in object) (object.geometry as THREE.BufferGeometry).dispose();
    if ('material' in object) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => (material as THREE.Material).dispose());
  });
  const colors = () => light ? { base: 0xe4f1e8, ink: 0x2b7252, line: 0x729b83, active: 0x13a76e, blocked: 0xb36122, idle: 0x78ac91 } : { base: 0x173c2e, ink: 0xa1f3cc, line: 0x588d74, active: 0x55e4a2, blocked: 0xf0b56a, idle: 0x347356 };
  const line = (points: THREE.Vector3[], color: number, opacity = 1) => {
    const object = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity })); content.add(object); return object;
  };
  const mesh = (group: THREE.Group, geometry: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0) => {
    const object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, metalness: 0.28, roughness: 0.42 })); object.position.set(x, y, z); group.add(object);
    object.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: colors().ink, transparent: true, opacity: 0.38 }))); return object;
  };
  const makeNode = (node: TeachingNode, index: number) => {
    const palette = colors(), blocked = model.blocked === node.id || node.state === 'blocked', active = model.active === node.id || node.state === 'active';
    const color = blocked ? palette.blocked : active || node.state === 'passed' ? palette.active : palette.idle;
    const group = new THREE.Group(); group.position.copy(positions.get(node.id)!);
    switch (node.kind) {
      case 'model':
        mesh(group, new THREE.IcosahedronGeometry(0.48, 0), color).rotation.set(0.18, 0.35, 0.15);
        mesh(group, new THREE.TorusGeometry(0.67, 0.035, 6, 44), palette.ink).rotation.set(0.45, 0.22, 0); break;
      case 'document': case 'evidence': {
        mesh(group, new THREE.BoxGeometry(0.68, 0.88, 0.08), palette.base, -0.07, 0.05, -0.08).rotation.z = 0.12;
        mesh(group, new THREE.BoxGeometry(0.68, 0.88, 0.1), color);
        for (let i = 0; i < 3; i++) mesh(group, new THREE.BoxGeometry(i === 2 ? 0.26 : 0.44, 0.035, 0.015), palette.ink, i === 2 ? -0.09 : 0, 0.18 - i * 0.15, 0.065);
        if (node.kind === 'evidence') group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.1, -0.38, 0.1), new THREE.Vector3(0.22, -0.48, 0.1), new THREE.Vector3(0.47, -0.22, 0.1)]), new THREE.LineBasicMaterial({ color: palette.ink })));
        group.rotation.y = -0.25; break;
      }
      case 'gate': {
        mesh(group, new THREE.BoxGeometry(0.11, 1.05, 0.2), color, -0.38); mesh(group, new THREE.BoxGeometry(0.11, 1.05, 0.2), color, 0.38); mesh(group, new THREE.BoxGeometry(0.86, 0.1, 0.2), color, 0, 0.5);
        const bar = mesh(group, new THREE.BoxGeometry(0.75, 0.1, 0.12), palette.blocked, 0, 0.06, 0.13);
        if (!blocked && node.state === 'passed') { bar.rotation.z = Math.PI / 2; bar.position.set(-0.37, 0.43, 0.13); } break;
      }
      case 'tool':
        mesh(group, new THREE.BoxGeometry(0.78, 0.56, 0.5), color).rotation.set(0.16, -0.3, 0);
        mesh(group, new THREE.TorusGeometry(0.18, 0.045, 6, 18, Math.PI), palette.ink, 0, 0.27); mesh(group, new THREE.BoxGeometry(0.13, 0.18, 0.06), palette.ink, 0, 0, 0.3); break;
      case 'memory':
        for (let i = 0; i < 3; i++) mesh(group, new THREE.CylinderGeometry(0.4, 0.4, 0.16, 32), color, 0, (i - 1) * 0.22).rotation.x = 0.28; break;
    }
    const base = new THREE.Mesh(new THREE.CircleGeometry(0.83, 48), new THREE.MeshBasicMaterial({ color: active ? palette.active : palette.line, transparent: true, opacity: active ? 0.15 : 0.055 })); base.position.z = -0.4; group.add(base);
    group.traverse(object => { object.userData.nodeId = node.id; if (object instanceof THREE.Mesh) pickables.push(object); }); content.add(group);
    const marker = document.createElement('span'); marker.className = 'teaching-marker'; marker.textContent = String(index + 1); markerLayer.append(marker); markers.set(node.id, marker);
    const item = document.createElement('li'), button = document.createElement('button'); button.type = 'button'; button.dataset.node = node.id; button.setAttribute('aria-pressed', String(active));
    const state = blocked ? 'Blocked' : node.state === 'passed' ? 'Passed' : active ? 'Active' : 'Ready'; button.setAttribute('aria-label', `${node.label}. ${state}.${node.detail ? ` ${node.detail}` : ''}`);
    const badge = document.createElement('span'); badge.className = 'teaching-node-key'; badge.textContent = String(index + 1); badge.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span'); label.textContent = node.label;
    const status = document.createElement('span'); status.className = 'teaching-node-state'; status.textContent = state; label.append(status); button.append(badge, label);
    button.addEventListener('click', () => onPick(node.id)); item.append(button); nodeList.append(item);
  };
  const arrange = () => {
    const count = model.nodes.length;
    const place = (index: number, x: number, y: number) => { const node = model.nodes[index]; if (node) positions.set(node.id, new THREE.Vector3(x, y, 0)); };
    if (count === 1) { place(0, 0, 0); return; }
    if (model.layout === 'loop') model.nodes.forEach((_, i) => { const angle = Math.PI - i / count * Math.PI * 2; place(i, Math.cos(angle) * 3.4, Math.sin(angle) * 1.9); });
    else if (model.layout === 'context') {
      const center = Math.max(0, model.nodes.findIndex(node => node.kind === 'model')); place(center, 2.4, 0);
      const inputs = model.nodes.map((_, i) => i).filter(i => i !== center);
      inputs.forEach((index, i) => place(index, -2.9 + (i % 2) * 1.8, inputs.length < 4 ? (i - (inputs.length - 1) / 2) * 1.6 : (Math.floor(i / 2) - (Math.ceil(inputs.length / 2) - 1) / 2) * 1.65));
    } else if (model.layout === 'boundary') {
      const gateIndex = model.nodes.findIndex(node => node.kind === 'gate');
      if (gateIndex >= 0) {
        place(gateIndex, 0, 0);
        const before = model.nodes.map((_, i) => i).filter(i => i < gateIndex), after = model.nodes.map((_, i) => i).filter(i => i > gateIndex);
        before.forEach((index, i) => place(index, -3.0 + (i % 2) * 1.1, before.length > 1 ? (i - (before.length - 1) / 2) * Math.min(1.4, 4.2 / before.length) : 0));
        after.forEach((index, i) => place(index, 2.4 + (i % 2) * 1.1, after.length > 1 ? (i - (after.length - 1) / 2) * Math.min(1.4, 4.2 / after.length) : 0));
      } else model.nodes.forEach((_, i) => place(i, -3.7 + i * 7.4 / Math.max(1, count - 1), 0));
    } else if (model.layout === 'evidence') model.nodes.forEach((_, i) => place(i, count <= 3 ? -3.1 + i * 6.2 / Math.max(1, count - 1) : (i % 3 - 1) * 3.1, count <= 3 ? (i === 1 ? -0.5 : 0.5) : (Math.floor(i / 3) - Math.floor((count - 1) / 3) / 2) * -1.7));
    else if (model.layout === 'recovery') model.nodes.forEach((_, i) => place(i, -3.6 + i * 7.2 / Math.max(1, count - 1), i === Math.floor(count / 2) ? 1.3 : -0.45));
    else {
      place(0, -3.6, 0); const branchCount = Math.max(1, count - 2);
      model.nodes.forEach((_, i) => { if (i > 0 && i < count - 1) place(i, i % 2 ? -0.6 : 0.7, (i - 1 - (branchCount - 1) / 2) * Math.min(1.25, 4.2 / branchCount)); });
      if (count > 1) place(count - 1, 3.6, 0);
    }
  };
  const ornament = () => {
    const palette = colors();
    if (model.layout === 'boundary') {
      const barrier = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 5.4), new THREE.MeshBasicMaterial({ color: palette.blocked, transparent: true, opacity: 0.22 })); barrier.position.z = -0.5; content.add(barrier);
      for (let i = -3; i <= 3; i++) line([new THREE.Vector3(-0.35, i * 0.72, -0.45), new THREE.Vector3(0.35, i * 0.72 + 0.4, -0.45)], palette.blocked, 0.35);
    } else if (model.layout === 'recovery') {
      [-2.6, 2.6].forEach(x => { const ledge = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.15, 0.3), new THREE.MeshStandardMaterial({ color: palette.base })); ledge.position.set(x, -1.4, -0.6); content.add(ledge); });
      line([new THREE.Vector3(-0.9, -1.4, -0.4), new THREE.Vector3(0, 0.3, -0.4), new THREE.Vector3(0.9, -1.4, -0.4)], palette.ink, 0.5);
    } else if (model.layout === 'evidence') {
      const scale = new THREE.Group(); scale.position.z = -0.55; mesh(scale, new THREE.BoxGeometry(7.3, 0.05, 0.08), palette.line, 0, -1.3); mesh(scale, new THREE.ConeGeometry(0.3, 0.7, 3), palette.line, 0, -1.7); content.add(scale);
    }
  };
  const makeEdges = () => model.edges.forEach(([from, to]) => {
    const a = positions.get(from), b = positions.get(to); if (!a || !b || from === to) return;
    const direction = b.clone().sub(a).normalize(), distance = a.distanceTo(b), inset = Math.min(0.78, distance * 0.32);
    const start = a.clone().addScaledVector(direction, inset), end = b.clone().addScaledVector(direction, -inset), mid = start.clone().lerp(end, 0.5); mid.z = -0.16;
    if (model.layout === 'loop') mid.addScaledVector(mid.clone().normalize(), 0.58);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end), blocked = from === model.blocked || model.nodes.find(node => node.id === from)?.state === 'blocked';
    const stroke = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(30)), new THREE.LineDashedMaterial({ color: blocked ? colors().blocked : colors().line, dashSize: blocked ? 0.1 : 10, gapSize: blocked ? 0.1 : 0, transparent: true, opacity: blocked ? 0.4 : 0.9 })); stroke.computeLineDistances(); content.add(stroke);
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.26, 3), new THREE.MeshBasicMaterial({ color: blocked ? colors().blocked : colors().ink, transparent: true, opacity: blocked ? 0.35 : 1 })); arrow.position.copy(curve.getPoint(0.92)); arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangent(0.92).normalize()); content.add(arrow); routes.push({ from, to, curve });
  });
  const target = () => model.blocked || model.nodes.find(node => node.state === 'blocked')?.id || model.active || model.nodes.find(node => node.state === 'active')?.id;
  const findJourney = () => {
    const stop = target(), start = model.nodes.find(node => !routes.some(route => route.to === node.id))?.id ?? model.nodes[0]?.id;
    if (!stop || !start || start === stop) return [];
    const queue: { id: string; path: Route[] }[] = [{ id: start, path: [] }], seen = new Set<string>();
    while (queue.length) {
      const next = queue.shift()!; if (seen.has(next.id)) continue; seen.add(next.id); if (next.id === stop) return next.path;
      if (next.id === model.blocked || model.nodes.find(node => node.id === next.id)?.state === 'blocked') continue;
      routes.filter(route => route.from === next.id).forEach(route => queue.push({ id: route.to, path: [...next.path, route] }));
    }
    return [];
  };
  const placeMarkers = () => positions.forEach((position, id) => {
    const projected = position.clone().add(new THREE.Vector3(0.53, 0.6, 0.2)).project(camera), marker = markers.get(id);
    if (marker) { marker.style.left = `${(projected.x + 1) * 50}%`; marker.style.top = `${(-projected.y + 1) * 50}%`; }
  });
  const draw = () => {
    if (disposed || lost || !intersecting || document.hidden) return;
    placeMarkers();
    // Collapse rapid lesson/trace updates into one GPU submission per display frame.
    if (!drawFrame) drawFrame = requestAnimationFrame(() => { drawFrame = 0; if (!disposed && !lost && intersecting && !document.hidden) renderer.render(scene, camera); });
  };
  const finishSignal = () => {
    const id = target(), position = id ? positions.get(id) : undefined; signal.visible = Boolean(position);
    if (journey.length) signal.position.copy(journey[journey.length - 1].curve.getPoint(1)); else if (position) signal.position.copy(position).add(new THREE.Vector3(0, -0.75, 0.3));
    signal.material.color.set(model.blocked || model.nodes.some(node => node.state === 'blocked') ? colors().blocked : colors().active);
  };
  const tick = (now: number) => {
    frame = 0; if (disposed || lost || paused || reduced.matches || !intersecting || document.hidden || !motionPending) return;
    if (lastTick) elapsed += Math.min(now - lastTick, 70); lastTick = now;
    const duration = Math.min(2200, journey.length * 500), progress = duration ? Math.min(1, elapsed / duration) : 1;
    if (progress < 1 && journey.length) { const segment = progress * journey.length; signal.visible = true; signal.position.copy(journey[Math.floor(segment)].curve.getPoint(segment % 1)); }
    else { motionPending = false; finishSignal(); }
    draw(); if (motionPending) frame = requestAnimationFrame(tick);
  };
  const schedule = () => { lastTick = 0; if (!frame && motionPending && !paused && !reduced.matches && intersecting && !document.hidden && !lost && !disposed) frame = requestAnimationFrame(tick); };
  const resizeScene = () => {
    if (disposed || lost) return; const width = stage.clientWidth, height = stage.clientHeight; if (!width || !height) return;
    const halfWidth = Math.max(5, 3.35 * width / height), halfHeight = halfWidth * height / width;
    camera.left = -halfWidth; camera.right = halfWidth; camera.top = halfHeight; camera.bottom = -halfHeight; camera.updateProjectionMatrix(); renderer.setSize(width, height, false); draw();
  };
  const update = (next: TeachingModel) => {
    if (disposed || lost) return;
    const focused = document.activeElement instanceof HTMLElement && nodeList.contains(document.activeElement) ? document.activeElement.dataset.node : undefined;
    model = { ...next, nodes: next.nodes.slice(0, 7) }; cancelAnimationFrame(frame); frame = 0; elapsed = 0; lastTick = 0;
    disposeObject(content); scene.remove(content); content = new THREE.Group(); scene.add(content); positions.clear(); markers.clear(); pickables.length = 0; routes.length = 0; markerLayer.replaceChildren(); nodeList.replaceChildren();
    root.dataset.light = String(light); root.dataset.layout = model.layout; renderer.setClearColor(light ? 0xf1f8f3 : 0x0c211c, 1); caption.textContent = model.caption;
    renderer.domElement.setAttribute('aria-label', `${model.layout} diagram. ${model.caption} Use the numbered component buttons below to inspect nodes.`);
    arrange(); ornament(); model.nodes.forEach(makeNode); makeEdges(); journey = findJourney(); motionPending = journey.length > 0 && !reduced.matches; finishSignal();
    if (motionPending) signal.position.copy(journey[0].curve.getPoint(0)); resizeScene(); schedule();
    if (focused) Array.from(nodeList.querySelectorAll<HTMLButtonElement>('button')).find(button => button.dataset.node === focused)?.focus({ preventScroll: true });
  };
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(); let pointerStart = { x: 0, y: 0 };
  const pointerDown = (event: PointerEvent) => { pointerStart = { x: event.clientX, y: event.clientY }; };
  const pointerUp = (event: PointerEvent) => {
    if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8) return; const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0]; if (hit) onPick(hit.object.userData.nodeId as string);
  };
  renderer.domElement.addEventListener('pointerdown', pointerDown); renderer.domElement.addEventListener('pointerup', pointerUp);
  const resize = new ResizeObserver(resizeScene); resize.observe(stage);
  const intersection = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; if (intersecting) { draw(); schedule(); } else { cancelAnimationFrame(frame); frame = 0; lastTick = 0; } }); intersection.observe(stage);
  const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTick = 0; } else { draw(); schedule(); } }; document.addEventListener('visibilitychange', visibility);
  const motionChange = () => { if (reduced.matches) { cancelAnimationFrame(frame); frame = 0; motionPending = false; finishSignal(); draw(); } }; reduced.addEventListener('change', motionChange);
  const contextLost = (event: Event) => { event.preventDefault(); lost = true; cancelAnimationFrame(frame); cancelAnimationFrame(drawFrame); drawFrame = 0; frame = 0; root.hidden = true; host.dataset.engine = 'fallback'; onUnavailable(); }; renderer.domElement.addEventListener('webglcontextlost', contextLost);
  update(initial);
  return {
    update, setLight: value => { if (light !== value) { light = value; update(model); } },
    pause: value => { paused = value; if (paused) { cancelAnimationFrame(frame); frame = 0; } else schedule(); }, reset: () => update(model),
    capture: () => { if (disposed || lost) return null; try { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); } catch { return null; } },
    dispose: () => {
      if (disposed) return; disposed = true; cancelAnimationFrame(frame); cancelAnimationFrame(drawFrame); resize.disconnect(); intersection.disconnect(); document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', motionChange);
      renderer.domElement.removeEventListener('pointerdown', pointerDown); renderer.domElement.removeEventListener('pointerup', pointerUp); renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      disposeObject(content); signal.geometry.dispose(); signal.material.dispose(); renderer.dispose(); root.remove();
    },
  };
}
