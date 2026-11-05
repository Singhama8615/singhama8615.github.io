/** 作品公开信息。新增项目时在这里登记，不读取个人项目运行数据。 */
export const projects = [
  { id: 'knowweft', name: 'KnowWeft', chineseName: '知织', description: '把知识和想法，编织成视频与课件。', href: '/knowweft/', status: '可下载', color: '#75d4c7' },
  { id: 'tessera', name: 'Tessera', chineseName: '千机', description: '一块块好用的工具，拼成你的日常。', href: '/tessera/', status: '可下载', color: '#aaa0ff' },
] as const;

export const experiments = [
  { name: 'self_review', title: '回望自己，也看见方向。', description: '本地优先的个人复盘与立体资料库。让经历、人物和想法产生连接。', category: '记录 · 认知 · 复盘', icon: 'reflection' },
  { name: 'Creator', title: '从一闪而过，到一个世界。', description: '正在探索的 AI 创作工作台，连接灵感、世界设定与多种表达。', category: '灵感 · 世界观 · 创作', icon: 'creation' },
] as const;
