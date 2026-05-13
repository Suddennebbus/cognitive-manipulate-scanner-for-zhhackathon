import { ScanResult, RiskSentence } from './types';

const templates: ScanResult[] = [
  {
    id: 'template-1',
    input: '',
    inputType: 'text',
    timestamp: Date.now(),
    overall_score: 78,
    risk_level: '高诡辩倾向',
    risk_distribution: {
      '情绪诱导': 42,
      '逻辑跳跃': 28,
      '权威依赖': 12,
      '幸存者偏差': 18,
    },
    sentences: [
      { id: 's1', text: '你们这些年轻人就是不够努力，看看那些成功人士，哪个不是每天工作16个小时？', risk_type: '情绪诱导', severity: '高', explanation: '用"不努力"进行羞辱式表达，制造焦虑情绪，替代理性论证。' },
      { id: 's2', text: '我邻居家的孩子初中毕业就创业，现在年入百万。', risk_type: '幸存者偏差', severity: '中', explanation: '用个体成功案例替代总体统计，忽略大量失败样本。' },
      { id: 's3', text: '据某权威机构研究表明，996工作制能提升30%的效率。', risk_type: '权威依赖', severity: '中', explanation: '引用"专家观点"但未提供数据来源，存在诉诸权威倾向。' },
      { id: 's4', text: '如果你不加班，就是在拖团队后腿。', risk_type: '情绪诱导', severity: '高', explanation: '将道德责任绑定个人选择，用情绪压力代替逻辑论证。' },
      { id: 's5', text: '经济发展需要每个人的付出，这是客观规律。', risk_type: '事实', severity: '低' },
      { id: 's6', text: '所以你不支持996就是反对公司发展。', risk_type: '逻辑跳跃', severity: '高', explanation: '非黑即白谬误：将"不支持996"偷换成"反对公司发展"。' },
    ],
    ai_verdict: '该内容存在明显的情绪操控与信息扭曲倾向，易引发群体极化。',
  },
  {
    id: 'template-2',
    input: '',
    inputType: 'text',
    timestamp: Date.now(),
    overall_score: 45,
    risk_level: '倾向性',
    risk_distribution: {
      '情绪诱导': 20,
      '逻辑跳跃': 35,
      '权威依赖': 25,
      '幸存者偏差': 20,
    },
    sentences: [
      { id: 's1', text: '最近看到一个有趣的现象，很多年轻人选择躺平。', risk_type: '事实', severity: '低' },
      { id: 's2', text: '这说明他们缺乏奋斗精神，上一代人不都是这么过来的吗？', risk_type: '逻辑跳跃', severity: '中', explanation: '用"上一代经历"推导"年轻人缺乏奋斗精神"，存在虚假因果。' },
      { id: 's3', text: '著名经济学家曾经说过，勤奋是唯一的成功之路。', risk_type: '权威依赖', severity: '中', explanation: '未指明具体经济学家和出处，诉诸权威。' },
      { id: 's4', text: '我身边认识的有钱人，没有一个不是拼命工作的。', risk_type: '幸存者偏差', severity: '中', explanation: '忽略不拼命工作但也成功的人，以及拼命工作但未成功的人。' },
      { id: 's5', text: '所以想要成功就必须拼命，这是天经地义的道理。', risk_type: '逻辑跳跃', severity: '高', explanation: '循环论证：用"天经地义"来证明结论，未提供实质论据。' },
    ],
    ai_verdict: '该回答使用了常见的逻辑捷径和权威背书，虽未构成强烈操控，但存在明显的论证缺陷。',
  },
  {
    id: 'template-3',
    input: '',
    inputType: 'text',
    timestamp: Date.now(),
    overall_score: 62,
    risk_level: '操控风险',
    risk_distribution: {
      '情绪诱导': 35,
      '逻辑跳跃': 25,
      '权威依赖': 20,
      '幸存者偏差': 20,
    },
    sentences: [
      { id: 's1', text: '作为一个从业二十年的老兵，我可以负责任地告诉你。', risk_type: '权威依赖', severity: '中', explanation: '用从业年限建立权威感，但未提供具体论据支撑后续观点。' },
      { id: 's2', text: '现在的年轻人太浮躁了，根本不知道什么叫真正的努力。', risk_type: '情绪诱导', severity: '中', explanation: '用"浮躁"进行羞辱式表达，制造代际对立情绪。' },
      { id: 's3', text: '我当年每天睡四个小时，现在才能站在这里说话。', risk_type: '幸存者偏差', severity: '中', explanation: '用个人经历替代普遍规律，忽略个体差异和运气因素。' },
      { id: 's4', text: '如果你现在不拼命，以后一定会后悔的。', risk_type: '情绪诱导', severity: '高', explanation: '恐惧煽动：用"后悔"制造焦虑，迫使人接受观点。' },
      { id: 's5', text: '数据显示，努力工作的人平均收入比不努力的人高20%。', risk_type: '事实', severity: '低' },
      { id: 's6', text: '所以你不努力，就是对自己的人生不负责。', risk_type: '逻辑跳跃', severity: '高', explanation: '把"收入差异"偷换成"人生负责"，存在偷换概念。' },
    ],
    ai_verdict: '该回答通过"奋斗叙事"将结构问题转化为个人责任，存在明显幸存者偏差和情绪操控。',
  },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function generateMockResult(input: string): ScanResult {
  const hash = hashString(input);
  const template = templates[hash % templates.length];

  return {
    ...template,
    id: `scan-${Date.now()}`,
    input,
    inputType: input.includes('zhihu.com') || input.startsWith('http') ? 'link' : 'text',
    timestamp: Date.now(),
  };
}

export function getMockAnalysisSteps(): string[] {
  return [
    '检测逻辑结构...',
    '分析情绪诱导...',
    '识别幸存者偏差...',
    '验证事实引用...',
    '评估权威依赖...',
    '构建证据链...',
  ];
}

export function getMockDetectedRisks(): { type: string; score: number }[] {
  return [
    { type: '情绪诱导', score: 12 },
    { type: '逻辑跳跃', score: 8 },
    { type: '数据缺失', score: 5 },
  ];
}
