type Variant = 'home' | 'knowweft' | 'tessera';
type ThreeModule = typeof import('three');

interface SceneParts {
  root: import('three').Group;
  reactiveMaterials: import('three').Material[];
  update: (elapsed: number, pointerX: number, pointerY: number, scroll: number, reducedMotion: boolean) => void;
  setProject?: (project: string) => void;
}

type RoundedBoxConstructor = new (
  width?: number,
  height?: number,
  depth?: number,
  segments?: number,
  radius?: number,
) => import('three').BufferGeometry;

const isNarrowScreen = () => window.matchMedia('(max-width: 720px)').matches;

function makeTube(
  THREE: ThreeModule,
  points: import('three').Vector3[],
  radius: number,
  material: import('three').Material,
  segments = 128,
) {
  const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
  return new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 8, true), material);
}

function orbitPoints(THREE: ThreeModule, phase: number, tilt: number, radius: number, depth: number) {
  return Array.from({ length: 72 }, (_, index) => {
    const angle = (index / 72) * Math.PI * 2;
    const pulse = 1 + Math.sin(angle * 3 + phase) * .045;
    const x = Math.cos(angle + phase) * radius * pulse;
    const y = Math.sin(angle + phase) * radius * .42 + Math.sin(angle * 2 - phase) * .16;
    const z = Math.sin(angle + phase) * depth + Math.cos(angle * 2 + phase) * .12;
    const vector = new THREE.Vector3(x, y, z);
    vector.applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
    return vector;
  });
}

function physicalLineMaterial(THREE: ThreeModule, color: number, opacity = .9) {
  return new THREE.MeshPhysicalMaterial({
    color,
    emissive: color,
    emissiveIntensity: .12,
    metalness: .28,
    roughness: .2,
    clearcoat: .75,
    clearcoatRoughness: .16,
    transmission: .08,
    transparent: true,
    opacity,
  });
}

function buildHome(THREE: ThreeModule): SceneParts {
  const root = new THREE.Group();
  const loom = new THREE.Group();
  root.add(loom);

  const palette = [0xa9b6ff, 0x5f9fd1, 0x75d4c7, 0xd8b98e];
  const lineMaterials = palette.map((color, index) => physicalLineMaterial(THREE, color, index === 3 ? .56 : .86));

  for (let index = 0; index < 7; index += 1) {
    const phase = (index / 7) * Math.PI * 2;
    const track = makeTube(
      THREE,
      orbitPoints(THREE, phase, (index - 3) * .115, 2.13 + (index % 3) * .12, .68 + (index % 2) * .15),
      index === 2 || index === 5 ? .022 : .013,
      lineMaterials[index % lineMaterials.length],
      isNarrowScreen() ? 72 : 120,
    );
    loom.add(track);
  }

  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xeaf1ff,
    emissive: 0x7588b5,
    emissiveIntensity: .12,
    roughness: .1,
    metalness: .12,
    transmission: .82,
    thickness: 1.8,
    ior: 1.38,
    clearcoat: 1,
    clearcoatRoughness: .08,
    transparent: true,
    opacity: .9,
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.53, 3), coreMaterial);
  root.add(core);

  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(.25, 2),
    new THREE.MeshStandardMaterial({ color: 0xf8fbff, emissive: 0xaebeff, emissiveIntensity: .85, roughness: .24 }),
  );
  root.add(inner);

  const facet = new THREE.Mesh(
    new THREE.IcosahedronGeometry(.545, 2),
    new THREE.MeshPhysicalMaterial({ color: 0xf8fbff, wireframe: true, transparent: true, opacity: .18, roughness: .16, metalness: .55 }),
  );
  root.add(facet);

  const haloMaterial = new THREE.MeshBasicMaterial({ color: 0x75d4c7, transparent: true, opacity: .24, side: THREE.DoubleSide });
  const halo = new THREE.Mesh(new THREE.RingGeometry(.7, 1.28, 96), haloMaterial);
  halo.rotation.x = Math.PI / 2;
  root.add(halo);

  const dustCount = isNarrowScreen() ? 110 : 220;
  const dustPosition = new Float32Array(dustCount * 3);
  for (let index = 0; index < dustCount; index += 1) {
    const radius = 2.35 + Math.random() * 1.8;
    const angle = Math.random() * Math.PI * 2;
    dustPosition[index * 3] = Math.cos(angle) * radius;
    dustPosition[index * 3 + 1] = (Math.random() - .5) * 3;
    dustPosition[index * 3 + 2] = Math.sin(angle) * radius * .5;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPosition, 3));
  const dustMaterial = new THREE.PointsMaterial({ color: 0xbfd2ff, size: .018, transparent: true, opacity: .48, depthWrite: false });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  root.add(dust);

  let targetProject = 'all';
  const colorTargets = {
    all: [0xa9b6ff, 0x75d4c7, 0xd8b98e, 0xdce5ff],
    knowweft: [0x185fa5, 0x1f9186, 0xd85a30, 0xdceeff],
    tessera: [0x847cff, 0x533afd, 0xc7c2ff, 0xf3f3fa],
  } as const;

  return {
    root,
    reactiveMaterials: [...lineMaterials, coreMaterial, haloMaterial, dustMaterial],
    setProject(project) {
      targetProject = project in colorTargets ? project : 'all';
    },
    update(elapsed, pointerX, pointerY, scroll, reducedMotion) {
      const motion = reducedMotion ? 0 : elapsed;
      loom.rotation.y = motion * .055 + pointerX * .16;
      loom.rotation.x = -.12 + pointerY * .1 + scroll * .06;
      loom.rotation.z = Math.sin(motion * .11) * .035;
      core.rotation.x = motion * .12;
      core.rotation.y = motion * .17;
      inner.rotation.y = -motion * .21;
      facet.rotation.x = -motion * .08;
      facet.rotation.z = motion * .11;
      dust.rotation.y = motion * .012;
      const targets = colorTargets[targetProject as keyof typeof colorTargets];
      lineMaterials.forEach((material, index) => {
        material.color.lerp(new THREE.Color(targets[index]), .025);
        material.emissive.lerp(new THREE.Color(targets[index]), .018);
      });
      coreMaterial.color.lerp(new THREE.Color(targets[0]), .018);
      haloMaterial.color.lerp(new THREE.Color(targets[1]), .018);
    },
  };
}

function buildKnowWeft(THREE: ThreeModule): SceneParts {
  const root = new THREE.Group();
  root.rotation.x = -.13;
  root.rotation.z = -.08;
  const warp = new THREE.Group();
  const weft = new THREE.Group();
  root.add(warp, weft);

  const blue = physicalLineMaterial(THREE, 0x185fa5, .88);
  const teal = physicalLineMaterial(THREE, 0x2aa79b, .9);
  const warm = physicalLineMaterial(THREE, 0xd85a30, .78);

  for (let column = -4; column <= 4; column += 1) {
    const points = Array.from({ length: 40 }, (_, index) => {
      const t = index / 39;
      const y = (t - .5) * 4.7;
      return new THREE.Vector3(column * .43, y, Math.sin(t * Math.PI * 6 + column * .7) * .08);
    });
    warp.add(makeTube(THREE, points, column % 3 === 0 ? .032 : .019, blue, 64));
  }

  for (let row = -4; row <= 4; row += 1) {
    const points = Array.from({ length: 40 }, (_, index) => {
      const t = index / 39;
      const x = (t - .5) * 4.4;
      const overUnder = Math.sin(t * Math.PI * 9 + row * Math.PI) * .115;
      return new THREE.Vector3(x, row * .45, overUnder);
    });
    weft.add(makeTube(THREE, points, row === 1 ? .034 : .021, row === 1 ? warm : teal, 64));
  }

  const nodeMaterial = new THREE.MeshPhysicalMaterial({ color: 0xf5f2e9, emissive: 0x2aa79b, emissiveIntensity: .22, roughness: .22 });
  const nodes = new THREE.InstancedMesh(new THREE.SphereGeometry(.065, 16, 12), nodeMaterial, 25);
  const matrix = new THREE.Matrix4();
  let nodeIndex = 0;
  for (let x = -2; x <= 2; x += 1) {
    for (let y = -2; y <= 2; y += 1) {
      matrix.makeTranslation(x * .86, y * .9, .14);
      nodes.setMatrixAt(nodeIndex, matrix);
      nodeIndex += 1;
    }
  }
  root.add(nodes);

  return {
    root,
    reactiveMaterials: [blue, teal, warm, nodeMaterial],
    update(elapsed, pointerX, pointerY, scroll, reducedMotion) {
      const motion = reducedMotion ? 0 : elapsed;
      root.rotation.y = pointerX * .12 + Math.sin(motion * .14) * .035;
      root.rotation.x = -.13 + pointerY * .08 + scroll * .035;
      warp.position.z = Math.sin(motion * .32) * .018;
      weft.position.z = -Math.sin(motion * .28) * .018;
    },
  };
}

function buildTessera(THREE: ThreeModule, RoundedBoxGeometry: RoundedBoxConstructor): SceneParts {
  const root = new THREE.Group();
  const modules = new THREE.Group();
  root.add(modules);

  const indigo = new THREE.MeshPhysicalMaterial({
    color: 0x533afd,
    emissive: 0x291a93,
    emissiveIntensity: .22,
    metalness: .32,
    roughness: .22,
    clearcoat: .85,
    clearcoatRoughness: .13,
  });
  const dark = new THREE.MeshPhysicalMaterial({
    color: 0x2b2b43,
    emissive: 0x111124,
    emissiveIntensity: .16,
    metalness: .38,
    roughness: .27,
    clearcoat: .7,
    clearcoatRoughness: .2,
  });
  const destinations: import('three').Vector3[] = [];

  for (let index = 0; index < 9; index += 1) {
    const x = (index % 3 - 1) * 1.12;
    const y = (1 - Math.floor(index / 3)) * 1.12;
    const isT = index < 3 || index === 4;
    const geometry = new RoundedBoxGeometry(.94, .94, .28, isNarrowScreen() ? 3 : 5, .1);
    const block = new THREE.Mesh(geometry, isT ? indigo : dark);
    const destination = new THREE.Vector3(x, y, isT && index === 4 ? .23 : 0);
    destinations.push(destination);
    block.position.copy(destination).multiplyScalar(1.55);
    block.position.z += (index % 2 ? .7 : -.45);
    block.userData.destination = destination;
    block.userData.offset = index * .08;
    modules.add(block);
  }

  const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0x847cff, transparent: true, opacity: .16, side: THREE.DoubleSide });
  const orbit = new THREE.Mesh(new THREE.RingGeometry(2.35, 2.37, 96), orbitMaterial);
  orbit.rotation.x = Math.PI / 2.6;
  root.add(orbit);

  return {
    root,
    reactiveMaterials: [indigo, dark, orbitMaterial],
    update(elapsed, pointerX, pointerY, scroll, reducedMotion) {
      const motion = reducedMotion ? 10 : elapsed;
      const assembly = reducedMotion ? 1 : Math.min(1, motion / 1.8);
      modules.children.forEach((child) => {
        const target = child.userData.destination as import('three').Vector3;
        const delay = child.userData.offset as number;
        const localProgress = Math.max(0, Math.min(1, (assembly - delay) / Math.max(.01, 1 - delay)));
        const eased = 1 - Math.pow(1 - localProgress, 3);
        child.position.lerp(target, eased * .08 + .015);
      });
      root.rotation.y = pointerX * .14 + Math.sin(motion * .12) * .035;
      root.rotation.x = -.18 + pointerY * .09 + scroll * .04;
      orbit.rotation.z = reducedMotion ? 0 : motion * .035;
    },
  };
}

function buildScene(THREE: ThreeModule, variant: Variant, RoundedBoxGeometry: RoundedBoxConstructor) {
  if (variant === 'knowweft') return buildKnowWeft(THREE);
  if (variant === 'tessera') return buildTessera(THREE, RoundedBoxGeometry);
  return buildHome(THREE);
}

async function mountScene(element: HTMLElement) {
  if (element.dataset.mounted === 'true') return;
  element.dataset.mounted = 'true';
  const canvas = element.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) return;

  let THREE: ThreeModule;
  let RoomEnvironment: typeof import('three/addons/environments/RoomEnvironment.js').RoomEnvironment;
  let RoundedBoxGeometry: RoundedBoxConstructor;
  try {
    const [threeModule, roomModule, roundedModule] = await Promise.all([
      import('three'),
      import('three/addons/environments/RoomEnvironment.js'),
      import('three/addons/geometries/RoundedBoxGeometry.js'),
    ]);
    THREE = threeModule;
    RoomEnvironment = roomModule.RoomEnvironment;
    RoundedBoxGeometry = roundedModule.RoundedBoxGeometry;
  } catch {
    return;
  }

  let renderer: import('three').WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !isNarrowScreen(), alpha: true, powerPreference: 'high-performance' });
  } catch {
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = (element.dataset.variant || 'home') === 'home' ? 1.04 : 1.18;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 60);
  const variant = (element.dataset.variant || 'home') as Variant;
  camera.position.set(0, 0, variant === 'knowweft' ? 7.4 : variant === 'tessera' ? 7.2 : 7.8);
  const roomEnvironment = new RoomEnvironment();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmremGenerator.fromScene(roomEnvironment, .04);
  scene.environment = environmentTarget.texture;
  pmremGenerator.dispose();

  scene.add(new THREE.AmbientLight(0xc8d2f2, variant === 'home' ? .62 : .9));
  const key = new THREE.PointLight(variant === 'tessera' ? 0x847cff : 0x75d4c7, 22, 15, 1.7);
  key.position.set(3.2, 2.5, 4.8);
  scene.add(key);
  const rim = new THREE.PointLight(variant === 'knowweft' ? 0xd85a30 : 0xd8b98e, variant === 'tessera' ? 20 : 14, 14, 1.8);
  rim.position.set(-3.6, -2.2, 2.6);
  scene.add(rim);

  if (variant === 'tessera') {
    const fill = new THREE.PointLight(0xf0efff, 16, 12, 2);
    fill.position.set(0, 3.8, 5.5);
    scene.add(fill);
  }

  const parts = buildScene(THREE, variant, RoundedBoxGeometry);
  scene.add(parts.root);

  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pointerX = 0;
  let pointerY = 0;
  let scroll = 0;
  let visible = true;
  let disposed = false;
  let frame = 0;
  // 只累计实际绘制的可见帧时间，避免切页或离屏后场景突然跳转。
  let elapsed = 0;
  let lastTimestamp = 0;

  const resize = () => {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const maxRatio = isNarrowScreen() ? 1.25 : 1.75;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxRatio));
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    if (reducedQuery.matches) renderOnce();
  };

  const renderOnce = () => {
    if (disposed) return;
    parts.update(elapsed, pointerX, pointerY, scroll, reducedQuery.matches);
    renderer.render(scene, camera);
  };

  const loop = (timestamp: number) => {
    if (disposed || !visible || document.hidden) {
      frame = 0;
      lastTimestamp = 0;
      return;
    }
    if (lastTimestamp) elapsed += Math.min((timestamp - lastTimestamp) / 1000, .05);
    lastTimestamp = timestamp;
    renderOnce();
    if (!reducedQuery.matches) frame = window.requestAnimationFrame(loop);
    else {
      frame = 0;
      lastTimestamp = 0;
    }
  };

  const resume = () => {
    if (!disposed && visible && !document.hidden && !frame) frame = window.requestAnimationFrame(loop);
  };

  const onPointerMove = (event: PointerEvent) => {
    const rect = element.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / Math.max(1, rect.width) - .5) * 2;
    pointerY = ((event.clientY - rect.top) / Math.max(1, rect.height) - .5) * 2;
    if (reducedQuery.matches) renderOnce();
  };

  const onScroll = () => {
    const rect = element.getBoundingClientRect();
    scroll = Math.max(-1, Math.min(1, -rect.top / Math.max(1, window.innerHeight)));
    if (reducedQuery.matches) renderOnce();
  };

  const onVisibility = () => {
    if (document.hidden) {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      lastTimestamp = 0;
      return;
    }
    resume();
  };
  const onProject = (event: Event) => {
    const detail = (event as CustomEvent<{ project?: string }>).detail;
    parts.setProject?.(detail?.project || 'all');
    resume();
  };
  const onMotionChange = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    lastTimestamp = 0;
    resume();
  };

  const onContextLost = (event: Event) => {
    event.preventDefault();
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    lastTimestamp = 0;
    delete element.dataset.ready;
  };

  const onContextRestored = () => {
    if (disposed) return;
    resize();
    renderOnce();
    element.dataset.ready = 'true';
    resume();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(element);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    if (!visible && frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
      lastTimestamp = 0;
    }
    resume();
  }, { rootMargin: '120px' });
  intersectionObserver.observe(element);

  element.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('portfolio:project', onProject);
  document.addEventListener('visibilitychange', onVisibility);
  reducedQuery.addEventListener('change', onMotionChange);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    lastTimestamp = 0;
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    element.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('portfolio:project', onProject);
    document.removeEventListener('visibilitychange', onVisibility);
    reducedQuery.removeEventListener('change', onMotionChange);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    canvas.removeEventListener('webglcontextrestored', onContextRestored);
    scene.traverse((object) => {
      const mesh = object as import('three').Mesh;
      mesh.geometry?.dispose?.();
      const material = mesh.material as import('three').Material | import('three').Material[] | undefined;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose?.();
    });
    parts.reactiveMaterials.forEach((material) => material.dispose());
    environmentTarget.dispose();
    roomEnvironment.traverse((object) => {
      const mesh = object as import('three').Mesh;
      mesh.geometry?.dispose?.();
      const material = mesh.material as import('three').Material | import('three').Material[] | undefined;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose?.();
    });
    renderer.dispose();
    renderer.forceContextLoss();
    // WebGL 上下文释放后旧 canvas 不再复用；bfcache 返回时用新节点重建。
    const freshCanvas = canvas.cloneNode(false) as HTMLCanvasElement;
    canvas.replaceWith(freshCanvas);
    delete element.dataset.ready;
    delete element.dataset.mounted;
  };
  const onPageHide = () => dispose();
  const onPageShow = (event: PageTransitionEvent) => {
    if (!event.persisted || !disposed) return;
    window.removeEventListener('pageshow', onPageShow);
    void mountScene(element);
  };
  window.addEventListener('pagehide', onPageHide, { once: true });
  window.addEventListener('pageshow', onPageShow);

  resize();
  renderOnce();
  element.dataset.ready = 'true';
  resume();
}

export function mountScenes() {
  document.querySelectorAll<HTMLElement>('[data-scene-root]').forEach((element) => {
    void mountScene(element);
  });
}
