/** 作品公开信息。新增项目时在这里登记，不读取个人项目运行数据。 */
export const projects = [
  { id: 'knowweft', name: 'KnowWeft', chineseName: '知织', description: 'Knowledge, woven into video & courseware.', href: '/knowweft/', status: '可下载', color: '#75d4c7' },
  { id: 'tessera', name: 'Tessera', chineseName: '千机', description: 'Small tools that stay out of the way.', href: '/tessera/', status: '可下载', color: '#aaa0ff' },
] as const;

export const experiments = [
  { name: 'self_review', title: 'A local-first archive of you.', description: '个人复盘与立体资料库，数据留在本地。', category: '记录 · 认知 · 复盘', icon: 'reflection' },
  { name: 'Creator', title: 'A workbench for ideas.', description: 'AI 创作工作台，从灵感到世界观。', category: '灵感 · 世界观 · 创作', icon: 'creation' },
] as const;
