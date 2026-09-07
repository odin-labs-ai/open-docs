import * as THREE from 'three';
import type { StageNode, StageCode } from './stage-types';

export type AssetState = 'ready' | 'active' | 'blocked' | 'passed';
export type StagePalette = { floor: number; body: number; edge: number; accent: number; pale: number; warning: number; ink: number; text: string; paper: string };
export type StageObject = { group: THREE.Group; animate(progress: number): void; labelHeight: number };
export function stagePalette(light: boolean): StagePalette {
  return light ? { floor: 0xd9e5db, body: 0x3d6956, edge: 0x64967d, accent: 0x168961, pale: 0xecf5ef, warning: 0xb86928, ink: 0x163f2d, text: '#173f2d', paper: '#edf5ef' } : { floor: 0x10251e, body: 0x244e3b, edge: 0x5d9b7c, accent: 0x50dba0, pale: 0xbdeed5, warning: 0xefb169, ink: 0xc7f8de, text: '#d6f6e3', paper: '#10271e' };
}
export function labelTexture(text: string, foreground: string, background: string, width = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = 96;
  const context = canvas.getContext('2d');
  if (context) { context.fillStyle = background; context.fillRect(0, 0, width, 96); context.fillStyle = foreground; context.font = '500 38px sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; const value = text.length > 37 ? `${text.slice(0, 34)}…` : text; context.fillText(value, width / 2, 49, width - 24); }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
function codeTexture(code: StageCode, palette: StagePalette): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 640;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0c2019'; ctx.fillRect(0, 0, 1024, 640);
    ctx.fillStyle = '#234634'; ctx.fillRect(0, 0, 1024, 64);
    ctx.font = '500 26px monospace'; ctx.fillStyle = '#d6f6e3'; ctx.fillText(code.file, 26, 42, 950);
    const lines = code.text.split('\n'), first = Math.max(0, (code.highlight?.[0] || 1) - 4);
    ctx.font = '25px monospace';
    lines.slice(first, first + 15).forEach((line, index) => {
      const number = first + index + 1, y = 104 + index * 32;
      if (code.highlight?.includes(number)) { ctx.fillStyle = '#345b3e'; ctx.fillRect(0, y - 23, 1024, 32); }
      ctx.fillStyle = '#729781'; ctx.fillText(String(number).padStart(2, ' '), 22, y);
      ctx.fillStyle = /^\s*(\/\/|#)/.test(line) ? '#94b69d' : /[{}\[\]]/.test(line) ? '#8de3c1' : '#e2efdc'; ctx.fillText(line, 83, y, 915);
    });
    ctx.fillStyle = palette.paper; ctx.fillRect(0, 603, 1024, 37); ctx.fillStyle = palette.text; ctx.font = '21px sans-serif'; ctx.fillText(code.provenance, 24, 628, 960);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; return texture;
}

/** Repo-native geometric teaching assets. No modeled operation executes real work. */
export function buildStageObject(node: StageNode, code: StageCode, state: AssetState, selected: boolean, palette: StagePalette): StageObject {
  const group = new THREE.Group(), animations: ((progress: number) => void)[] = [];
  // Inspection highlighting is an independent movable outline; asset color
  // records execution state and must not drift when another object is picked.
  group.userData.selected = selected;
  const color = state === 'blocked' ? palette.warning : state === 'active' || state === 'passed' ? palette.accent : palette.body;
  const material = (value: number, roughness = 0.5) => new THREE.MeshStandardMaterial({ color: value, metalness: 0.26, roughness });
  const solid = (geometry: THREE.BufferGeometry, value: number, position: [number, number, number] = [0, 0, 0], parent = group) => {
    const object = new THREE.Mesh(geometry, material(value)); object.position.set(...position); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  };
  const box = (width: number, height: number, depth: number, value: number, position: [number, number, number] = [0, 0, 0], parent = group) => solid(new THREE.BoxGeometry(width, height, depth), value, position, parent);
  const cylinder = (radius: number, height: number, value: number, position: [number, number, number], parent = group) => solid(new THREE.CylinderGeometry(radius, radius, height, 24), value, position, parent);
  const wire = (points: THREE.Vector3[], value = palette.edge, parent = group) => { const object = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: value })); parent.add(object); return object; };
  const screen = (width: number, height: number, position: [number, number, number], tilt = -0.14, parent = group) => {
    const frame = new THREE.Group(); frame.position.set(...position); frame.rotation.x = tilt; parent.add(frame);
    box(width + 0.13, height + 0.13, 0.11, palette.body, [0, 0, -0.05], frame);
    const surface = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: codeTexture(code, palette), side: THREE.DoubleSide })); surface.position.z = 0.015; frame.add(surface); return frame;
  };
  const bolt = (x: number, z: number) => cylinder(0.055, 0.025, palette.edge, [x, 0.095, z]);
  box(2.05, 0.12, 1.72, palette.floor, [0, 0, 0]); [-0.88, 0.88].forEach(x => [-0.69, 0.69].forEach(z => bolt(x, z)));
  // State is also carried by text labels and physical position, not color alone.
  box(0.55, 0.035, 0.07, color, [0, 0.09, 0.78]);
  let labelHeight = 2;
  switch (node.asset) {
    case 'terminal': {
      box(1.7, 0.12, 0.63, palette.body, [0, 0.17, 0.35]); box(0.22, 0.42, 0.2, color, [0, 0.44, -0.22]);
      const display = screen(1.8, 1.12, [0, 1.2, -0.24], -0.15);
      for (let row = 0; row < 3; row++) for (let column = 0; column < 9; column++) box(0.12, 0.04, 0.09, palette.edge, [-0.63 + column * 0.157, 0.25, 0.21 + row * 0.13]);
      const scan = box(1.64, 0.016, 0.016, palette.accent, [0, 0.4, 0.035], display);
      animations.push(progress => { scan.visible = state === 'active' && progress < 1; scan.position.y = 0.43 - progress * 0.87; }); break;
    }
    case 'editor': {
      box(1.7, 0.12, 1.1, palette.body, [0, 0.35, 0]);
      [-0.65, 0.65].forEach(x => box(0.09, 0.34, 0.75, color, [x, 0.18, 0]));
      screen(1.76, 1.24, [0, 0.87, 0.01], -0.6);
      box(0.48, 0.025, 0.12, palette.accent, [0.47, 0.4, 0.66]); labelHeight = 1.7; break;
    }
    case 'extension-rack': {
      box(1.76, 1.62, 0.55, palette.body, [0, 0.9, -0.28]);
      for (let index = 0; index < 6; index++) {
        const x = (index % 3 - 1) * 0.54, y = 0.43 + Math.floor(index / 3) * 0.7;
        const plug = box(0.44, 0.52, 0.48, index === 2 ? color : palette.edge, [x, y, 0.11]);
        box(0.25, 0.07, 0.04, palette.pale, [x, y + 0.1, 0.38]);
        for (let pin = 0; pin < 3; pin++) box(0.04, 0.05, 0.15, palette.warning, [x - 0.09 + pin * 0.09, y - 0.28, 0.24]);
        if (index === 2) animations.push(progress => { plug.position.z = 0.11 + (state === 'active' ? (1 - progress) * 0.48 : 0); });
      }
      screen(1.5, 0.5, [0, 1.64, 0.025], 0); labelHeight = 2.25; break;
    }
    case 'context-stack': {
      for (let index = 0; index < 4; index++) {
        const page = new THREE.Group(); page.position.set((index - 1.5) * 0.16, 0.18 + index * 0.19, 0); page.rotation.y = (index - 1.5) * 0.15; group.add(page);
        box(1.38, 0.07, 1.06, index === 3 ? palette.pale : palette.edge, [0, 0, 0], page);
        for (let line = 0; line < 4; line++) box(0.8 - (line % 2) * 0.15, 0.015, 0.03, color, [-0.1, 0.046, -0.3 + line * 0.16], page);
      }
      screen(1.45, 0.9, [0.05, 1.14, -0.16], -0.55); labelHeight = 1.9; break;
    }
    case 'model-chip': {
      box(1.45, 0.12, 1.28, palette.body, [0, 0.21, 0]); box(0.88, 0.27, 0.88, color, [0, 0.4, 0]);
      for (let i = 0; i < 7; i++) { const offset = -0.56 + i * 0.187; box(0.04, 0.05, 1.67, palette.warning, [offset, 0.22, 0]); box(1.76, 0.05, 0.04, palette.warning, [0, 0.22, offset]); }
      const core = solid(new THREE.OctahedronGeometry(0.34), palette.pale, [0, 0.87, 0]);
      animations.push(progress => { core.position.y = 0.87 + (state === 'active' ? Math.sin(progress * Math.PI) * 0.12 : 0); });
      screen(1.1, 0.56, [0, 1.15, -0.52], -0.2); labelHeight = 1.8; break;
    }
    case 'sandbox': {
      box(1.85, 0.13, 1.5, color, [0, 0.2, 0]);
      box(1.85, 1.38, 0.09, palette.body, [0, 0.92, -0.71]); box(0.09, 1.38, 1.5, palette.edge, [-0.89, 0.92, 0]);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.65, 1.5), new THREE.MeshPhysicalMaterial({ color: palette.accent, transparent: true, opacity: 0.19, roughness: 0.25, side: THREE.DoubleSide })); glass.position.set(0.9, 0.55, 0); group.add(glass);
      screen(1.32, 0.82, [0.1, 0.92, -0.43], -0.18);
      for (let i = 0; i < 3; i++) box(0.3, 0.22 + i * 0.12, 0.3, palette.edge, [-0.46 + i * 0.47, 0.39 + i * 0.06, 0.32]); labelHeight = 2.05; break;
    }
    case 'permission-gate': {
      [-0.73, 0.73].forEach(x => { box(0.2, 1.5, 0.3, palette.body, [x, 0.87, 0]); box(0.24, 0.07, 0.34, color, [x, 1.5, 0]); });
      box(1.65, 0.16, 0.32, color, [0, 1.58, 0]);
      const pivot = new THREE.Group(); pivot.position.set(-0.68, 0.92, 0.17); group.add(pivot);
      box(1.4, 0.18, 0.11, palette.warning, [0.7, 0, 0], pivot);
      for (let i = 0; i < 5; i++) box(0.08, 0.19, 0.013, palette.body, [0.14 + i * 0.26, 0, 0.065], pivot).rotation.z = -0.25;
      animations.push(progress => { pivot.rotation.z = state === 'passed' ? Math.PI * 0.47 * progress : 0; });
      screen(0.64, 0.4, [0.65, 0.5, 0.22], -0.15); labelHeight = 2.15; break;
    }
    case 'tool-workbench': {
      box(1.74, 0.14, 1.24, color, [0, 0.7, 0]);
      [-0.68, 0.68].forEach(x => [-0.42, 0.42].forEach(z => box(0.13, 0.66, 0.13, palette.body, [x, 0.36, z])));
      box(0.58, 0.32, 0.55, palette.edge, [-0.43, 0.93, 0.1]); box(0.07, 0.52, 0.14, palette.warning, [-0.43, 1.14, 0.1]);
      screen(1.04, 0.76, [0.38, 1.2, -0.3], -0.15);
      const arm = box(0.54, 0.09, 0.13, palette.pale, [-0.22, 1.45, 0.15]); animations.push(progress => { arm.rotation.z = state === 'active' ? -Math.sin(progress * Math.PI) * 0.45 : 0; }); break;
    }
    case 'diff-board': {
      const left = new THREE.Group(), right = new THREE.Group(); left.position.set(-0.06, 0.93, 0); right.position.set(0.06, 0.93, 0); group.add(left, right);
      screen(0.93, 1.31, [-0.51, 0, 0], -0.06, left); screen(0.93, 1.31, [0.51, 0, 0], -0.06, right);
      box(0.72, 0.07, 0.04, palette.warning, [-0.52, 0.1, 0.1], left); box(0.72, 0.07, 0.04, palette.accent, [0.52, 0.1, 0.1], right);
      cylinder(0.045, 1.7, palette.edge, [0, 0.88, 0]); animations.push(progress => { left.rotation.y = -(0.06 + (1 - progress) * 0.6); right.rotation.y = 0.06 + (1 - progress) * 0.6; }); labelHeight = 2.15; break;
    }
    case 'test-rig': {
      box(1.73, 0.16, 1.2, palette.body, [0, 0.27, 0]);
      for (let i = 0; i < 4; i++) { const cell = box(0.34, 0.24, 0.4, state === 'blocked' && i === 3 ? palette.warning : palette.accent, [-0.6 + i * 0.4, 0.47, 0.27]); animations.push(progress => { cell.scale.y = 0.4 + 0.6 * Math.max(0, Math.min(1, progress * 4 - i + 1)); }); }
      screen(1.63, 0.85, [0, 1.12, -0.42], -0.08);
      for (let i = 0; i < 4; i++) wire([new THREE.Vector3(-0.6 + i * 0.4, 0.45, 0.17), new THREE.Vector3(-0.6 + i * 0.4, 0.45, -0.38), new THREE.Vector3(-0.6 + i * 0.4, 0.78, -0.38)], palette.edge); break;
    }
    case 'session-tree': case 'branch-worktrees': {
      const worktrees = node.asset === 'branch-worktrees';
      cylinder(0.065, 1.33, color, [0, 0.76, 0]);
      for (let i = 0; i < 3; i++) {
        const x = (i - 1) * 0.72, y = 0.63 + (i % 2) * 0.58, z = i === 1 ? -0.36 : 0.21;
        wire([new THREE.Vector3(0, 0.39, 0), new THREE.Vector3(0, y, 0), new THREE.Vector3(x, y, z)], palette.accent);
        if (worktrees) { box(0.59, 0.36, 0.44, palette.body, [x, y + 0.12, z]); box(0.62, 0.06, 0.46, palette.accent, [x, y + 0.33, z]); }
        else { cylinder(0.15, 0.11, i === 2 ? palette.warning : palette.pale, [x, y, z]); cylinder(0.055, 0.23, palette.edge, [x, y + 0.1, z]); }
      }
      screen(1.52, 0.68, [0, 1.58, -0.24], -0.12); labelHeight = 2.2; break;
    }
    case 'checkpoint-bridge': {
      [-0.76, 0.76].forEach(x => box(0.53, 0.43, 1.12, palette.body, [x, 0.28, 0]));
      for (let i = 0; i < 7; i++) box(0.21, 0.075, 0.7, i === 3 ? color : palette.edge, [-0.78 + i * 0.26, 0.56 + Math.sin(i / 6 * Math.PI) * 0.2, 0]);
      [-0.35, 0.35].forEach(z => wire(Array.from({ length: 13 }, (_, i) => new THREE.Vector3(-0.88 + i / 12 * 1.76, 0.83 + Math.sin(i / 12 * Math.PI) * 0.23, z)), palette.pale));
      screen(1.21, 0.62, [0, 1.3, -0.27], -0.1); labelHeight = 1.95; break;
    }
    case 'queue': {
      box(1.88, 0.17, 0.91, palette.body, [0, 0.36, 0]);
      for (let i = 0; i < 9; i++) { const roller = cylinder(0.07, 0.91, palette.edge, [-0.8 + i * 0.2, 0.48, 0]); roller.rotation.x = Math.PI / 2; }
      for (let i = 0; i < 4; i++) { const packet = box(0.29, 0.25, 0.42, i === 2 ? color : palette.pale, [-0.63 + i * 0.4, 0.64, 0]); animations.push(progress => { packet.position.x = -0.63 + i * 0.4 + (state === 'active' ? progress * 0.16 : 0); }); }
      screen(1.53, 0.64, [0, 1.35, -0.45], -0.1); break;
    }
    case 'tenant-vault': {
      box(1.52, 1.53, 0.85, palette.body, [0, 0.87, -0.05]);
      const door = new THREE.Group(); door.position.set(-0.7, 0.91, 0.43); group.add(door); box(1.35, 1.31, 0.12, color, [0.68, 0, 0], door);
      const wheel = solid(new THREE.TorusGeometry(0.25, 0.045, 8, 32), palette.pale, [0.82, 0, 0.12], door);
      for (let i = 0; i < 3; i++) { const bar = box(0.41, 0.04, 0.045, palette.pale, [0, 0, 0], group); wheel.add(bar); bar.rotation.z = i * Math.PI / 3; }
      animations.push(progress => { door.rotation.y = state === 'passed' ? -progress * 0.9 : 0; });
      screen(0.96, 0.37, [0.02, 1.49, 0.45], 0); labelHeight = 2.15; break;
    }
    case 'eval-matrix': {
      const board = new THREE.Group(); board.position.set(0, 0.85, 0); board.rotation.x = -0.52; group.add(board);
      box(1.88, 1.42, 0.11, palette.body, [0, 0, 0], board);
      for (let row = 0; row < 3; row++) for (let column = 0; column < 4; column++) {
        const tile = box(0.36, 0.32, 0.09, row === 2 && column === 2 && state === 'blocked' ? palette.warning : palette.edge, [-0.66 + column * 0.44, -0.35 + row * 0.39, 0.12], board);
        box(0.2, 0.026, 0.02, palette.pale, [-0.66 + column * 0.44, -0.35 + row * 0.39, 0.18], board);
        animations.push(progress => { tile.position.z = 0.12 + (state === 'active' ? Math.max(0, progress - (row * 4 + column) / 12) * 0.13 : 0); });
      }
      screen(1.58, 0.5, [0, 1.63, -0.36], -0.12); labelHeight = 2.15; break;
    }
    case 'budget-meter': {
      for (let i = 0; i < 4; i++) { const height = [0.66, 1.02, 1.42, 0.9][i]; box(0.34, height, 0.48, i === 2 ? palette.warning : color, [-0.68 + i * 0.45, 0.14 + height / 2, 0.08]); box(0.37, 0.035, 0.51, palette.pale, [-0.68 + i * 0.45, 0.16 + height, 0.08]); }
      wire([new THREE.Vector3(-0.92, 1.43, 0.4), new THREE.Vector3(0.92, 1.43, 0.4)], palette.warning);
      screen(1.5, 0.53, [0, 1.78, -0.24], -0.1); labelHeight = 2.3; break;
    }
    case 'api-gateway': {
      [-0.66, 0.66].forEach(x => { box(0.43, 1.35, 0.63, palette.body, [x, 0.81, -0.04]); for (let i = 0; i < 4; i++) box(0.28, 0.06, 0.025, color, [x, 0.4 + i * 0.26, 0.29]); });
      const arc = solid(new THREE.TorusGeometry(0.45, 0.075, 8, 36), color, [0, 0.98, 0.06]); arc.scale.x = 0.78;
      for (let i = 0; i < 3; i++) { const packet = box(0.15, 0.13, 0.21, palette.pale, [0, 0.59 + i * 0.31, 0.22]); animations.push(progress => { packet.position.z = 0.22 + (state === 'active' ? progress * 0.21 : 0); }); }
      screen(1.51, 0.52, [0, 1.64, -0.2], -0.08); labelHeight = 2.2; break;
    }
  }
  group.traverse(object => { object.userData.nodeId = node.id; });
  return { group, animate: progress => animations.forEach(apply => apply(Math.max(0, Math.min(1, progress)))), labelHeight };
}
