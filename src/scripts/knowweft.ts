type KnowledgeScene = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  accent: string;
  label: string;
};

const scenes: KnowledgeScene[] = [
  {
    id: 'structure',
    kicker: '知识树',
    title: '先把复杂主题拆成可理解的路径',
    body: '围绕「光如何塑造画面」展开概念、案例和练习，章节关系一眼可见。',
    accent: '#185FA5',
    label: '结构正在成形',
  },
  {
    id: 'visual',
    kicker: '场景编排',
    title: '再把节点变成可以讲述的画面',
    body: '文本、媒体与镜头落入同一场景，内容顺序与画面节奏保持一致。',
    accent: '#1F9186',
    label: '场景已就位',
  },
  {
    id: 'motion',
    kicker: '时间线',
    title: '最后让表达沿着时间发生',
    body: '拖动下方播放头，查看字幕、动画与镜头在时间线中依次进入。',
    accent: '#D85A30',
    label: '时间线可编辑',
  },
];

export function setupKnowledgeDemo(root: ParentNode = document): void {
  const demo = root.querySelector<HTMLElement>('[data-knowledge-demo]');
  if (!demo || demo.dataset.ready === 'true') return;
  demo.dataset.ready = 'true';

  const buttons = [...demo.querySelectorAll<HTMLButtonElement>('[data-scene]')];
  const range = demo.querySelector<HTMLInputElement>('[data-timeline]');
  const sceneKicker = demo.querySelector<HTMLElement>('[data-scene-kicker]');
  const sceneTitle = demo.querySelector<HTMLElement>('[data-scene-title]');
  const sceneBody = demo.querySelector<HTMLElement>('[data-scene-body]');
  const sceneLabel = demo.querySelector<HTMLElement>('[data-scene-label]');
  const playhead = demo.querySelector<HTMLElement>('[data-playhead]');
  const time = demo.querySelector<HTMLElement>('[data-time]');

  const selectScene = (id: string): void => {
    const scene = scenes.find((item) => item.id === id) ?? scenes[0];
    buttons.forEach((button) => {
      const active = button.dataset.scene === scene.id;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    });
    if (sceneKicker) sceneKicker.textContent = scene.kicker;
    if (sceneTitle) sceneTitle.textContent = scene.title;
    if (sceneBody) sceneBody.textContent = scene.body;
    if (sceneLabel) sceneLabel.textContent = scene.label;
    demo.style.setProperty('--demo-accent', scene.accent);
    demo.dataset.activeScene = scene.id;
  };

  buttons.forEach((button) => button.addEventListener('click', () => selectScene(button.dataset.scene ?? 'structure')));

  range?.addEventListener('input', () => {
    const progress = Number(range.value);
    demo.style.setProperty('--progress', `${progress}%`);
    if (playhead) playhead.style.left = `${progress}%`;
    if (time) time.textContent = `${Math.round(progress * 0.48)} 秒`;
    selectScene(progress < 34 ? 'structure' : progress < 68 ? 'visual' : 'motion');
  });

  selectScene('structure');
}
