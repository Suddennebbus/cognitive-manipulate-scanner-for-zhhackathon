import { ScanResult, RiskSentence } from './types';

// ==================== DeepSeek 配置 ====================
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-v4-flash';

const SYSTEM_PROMPT = `你是一名「认知表达分析系统」。

分析原则：不判断观点对错，只分析表达结构。保持冷静、克制、中立。

分析维度：情绪诱导、逻辑跳跃、权威依赖、幸存者偏差、事实。

注意：只有当表达明显替代逻辑论证、压制质疑、或削弱理性判断时，才标记为风险。

=== CRITICAL: 输出格式 ===
你必须严格输出以下JSON格式，字段名必须完全一致：

{"overall_score":0-100整数,"risk_level":"安全"/"倾向性"/"操控风险"/"高诡辩倾向","risk_distribution":{"情绪诱导":百分比,"逻辑跳跃":百分比,"权威依赖":百分比,"幸存者偏差":百分比},"sentences":[{"text":"句子原文","risk_type":"情绪诱导"/"逻辑跳跃"/"权威依赖"/"幸存者偏差"/"事实","severity":"低"/"中"/"高","explanation":"判断原因"}],"ai_verdict":"认知分析结论，像观察报告，冷静克制，不超过120字"}

CRITICAL RULE：只输出纯JSON，不要任何其他文字，不要markdown代码块。第一个字符必须是{，最后一个字符必须是}。`;

// ==================== 主入口 ====================

export async function analyzeContent(text: string): Promise<ScanResult> {
  if (!DEEPSEEK_API_KEY) {
    console.warn('[分析] 未配置 DEEPSEEK_API_KEY，使用本地规则分析');
    return fallbackAnalyze(text);
  }

  try {
    console.log('[分析] 使用 DeepSeek 分析...');
    return await analyzeWithDeepSeek(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[分析] DeepSeek 失败: ${msg}`);
    console.warn('[分析] 使用本地规则分析 fallback');
    return fallbackAnalyze(text);
  }
}

// ==================== DeepSeek 分析 ====================

async function analyzeWithDeepSeek(text: string): Promise<ScanResult> {
  const response = await httpPostJSON(
    DEEPSEEK_API_URL,
    {
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `请分析以下文本：\n\n${text}` },
      ],
      temperature: 0.1,
      max_tokens: 4096,
      stream: false,
    },
    {
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    30000
  );

  if (response.status < 200 || response.status >= 300) {
    const errorText = response.text();
    let errorMsg = `HTTP ${response.status}`;
    try {
      const errorData = JSON.parse(errorText) as any;
      errorMsg = errorData?.error?.message || errorText.slice(0, 200);
    } catch {
      errorMsg = errorText.slice(0, 200);
    }
    throw new Error(`DeepSeek API 错误: ${errorMsg}`);
  }

  const data = (await response.json()) as any;
  const content = data.choices?.[0]?.message?.content || '';

  if (!content) {
    console.error('[API] DeepSeek 返回空内容, 原始响应:', JSON.stringify(data).slice(0, 500));
    throw new Error('DeepSeek API 返回空内容');
  }

  return parseAnalysisResult(content, text);
}

// ==================== HTTP 工具 (Cloudflare compatible) ====================

async function httpPostJSON(
  url: string,
  body: object,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<{ status: number; json: () => Promise<unknown>; text: () => string }> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.text();
    const elapsed = Date.now() - startTime;
    const urlObj = new URL(url);
    console.log(
      `[API] ${urlObj.hostname} 响应: HTTP ${res.status}, 耗时 ${elapsed}ms, 返回 ${data.length} 字节`
    );
    if (res.status >= 400) {
      console.error(`[API] ${urlObj.hostname} 错误响应体:`, data.slice(0, 500));
    }

    return {
      status: res.status,
      json: async () => JSON.parse(data),
      text: () => data,
    };
  } catch (err) {
    const urlObj = new URL(url);
    if (err instanceof Error && err.name === 'AbortError') {
      console.error(`[API] ${urlObj.hostname} 请求超时, 已耗时 ${timeoutMs}ms`);
      throw new Error(`请求超时（${timeoutMs}ms）`);
    }
    console.error(`[API] ${urlObj.hostname} 请求错误:`, err instanceof Error ? err.message : String(err));
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ==================== 解析工具 ====================

function extractJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  // 1. 先尝试直接解析整个文本（最外层完整JSON）
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      // 直接解析失败，继续用括号匹配法
    }
  }

  // 2. 括号匹配法 — 从最外层第一个 '{' 开始匹配
  if (cleaned.startsWith('{')) {
    let depth = 0;
    let end = -1;
    for (let j = 0; j < cleaned.length; j++) {
      if (cleaned[j] === '{') depth++;
      if (cleaned[j] === '}') depth--;
      if (depth === 0 && j > 0) {
        end = j;
        break;
      }
    }
    if (end !== -1) {
      const candidate = cleaned.slice(0, end + 1);
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch {
        // 继续尝试子对象匹配
      }
    }
  }

  // 3. fallback：从最后一个 '{' 匹配子对象
  const braceIndices: number[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '{') braceIndices.push(i);
  }

  for (let i = braceIndices.length - 1; i >= 0; i--) {
    const start = braceIndices[i];
    let depth = 0;
    let end = -1;
    for (let j = start; j < cleaned.length; j++) {
      if (cleaned[j] === '{') depth++;
      if (cleaned[j] === '}') depth--;
      if (depth === 0) {
        end = j;
        break;
      }
    }
    if (end === -1) continue;

    const candidate = cleaned.slice(start, end + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      // 继续尝试前一个 '{'
    }
  }

  return null;
}

function parseAnalysisResult(content: string, originalText: string): ScanResult {
  const parsed = extractJsonObject(content);

  if (!parsed) {
    console.error('无法从 AI 响应中提取有效 JSON，原始内容前 800 字:', content.slice(0, 800));
    throw new Error('AI 返回的内容无法解析为有效 JSON');
  }

  const sentences = (parsed.sentences as Array<Record<string, unknown>> || []).map(
    (s, index): RiskSentence => ({
      id: `s${index + 1}`,
      text: String(s.text || ''),
      risk_type: validateRiskType(String(s.risk_type || '事实')),
      severity: validateSeverity(String(s.severity || '低')),
      explanation: s.explanation ? String(s.explanation) : undefined,
    })
  );

  if (sentences.length === 0) {
    const rawSentences = originalText
      .split(/[。！？\n]+/)
      .filter(s => s.trim().length > 0)
      .map((text, i): RiskSentence => ({
        id: `s${i + 1}`,
        text: text.trim(),
        risk_type: '事实',
        severity: '低',
      }));
    sentences.push(...rawSentences);
  }

  const score = Math.max(0, Math.min(100, Number(parsed.overall_score) || 45));
  const riskLevel = validateRiskLevel(String(parsed.risk_level || '')) || getRiskLevelFromScore(score);

  const distribution = parsed.risk_distribution as Record<string, number> || {};
  const riskDistribution: Record<string, number> = {
    '情绪诱导': Math.max(0, Math.min(100, Number(distribution['情绪诱导']) || 0)),
    '逻辑跳跃': Math.max(0, Math.min(100, Number(distribution['逻辑跳跃']) || 0)),
    '权威依赖': Math.max(0, Math.min(100, Number(distribution['权威依赖']) || 0)),
    '幸存者偏差': Math.max(0, Math.min(100, Number(distribution['幸存者偏差']) || 0)),
  };

  return {
    id: `scan-${Date.now()}`,
    input: originalText,
    inputType: 'text',
    timestamp: Date.now(),
    overall_score: score,
    risk_level: riskLevel,
    risk_distribution: riskDistribution,
    sentences,
    ai_verdict: String(parsed.ai_verdict || '分析完成'),
  };
}

function validateRiskType(type: string): RiskSentence['risk_type'] {
  const validTypes: RiskSentence['risk_type'][] = ['情绪诱导', '逻辑跳跃', '权威依赖', '幸存者偏差', '事实'];
  return validTypes.includes(type as RiskSentence['risk_type']) ? (type as RiskSentence['risk_type']) : '事实';
}

function validateSeverity(sev: string): RiskSentence['severity'] {
  const validSevs: RiskSentence['severity'][] = ['低', '中', '高'];
  return validSevs.includes(sev as RiskSentence['severity']) ? (sev as RiskSentence['severity']) : '低';
}

function validateRiskLevel(level: string): string | null {
  const validLevels = ['安全', '倾向性', '操控风险', '高诡辩倾向'];
  return validLevels.includes(level) ? level : null;
}

function getRiskLevelFromScore(score: number): string {
  if (score >= 80) return '高诡辩倾向';
  if (score >= 60) return '操控风险';
  if (score >= 40) return '倾向性';
  return '安全';
}

// ==================== Fallback 本地分析 ====================

const PATTERNS: Record<string, { keywords: string[]; weight: number }> = {
  '情绪诱导': {
    keywords: [
      '正常人都知道', '众所周知', '难道你不知道', '不买房就是不', '不孝顺', '不爱国', '不负责',
      '一定会后悔', '迟早会', '就是不够努力', '太浮躁', '太懒', '太笨', '拖后腿',
      '让父母失望', '让家人失望', '对不起', '不配', '丢人',
    ],
    weight: 2,
  },
  '逻辑跳跃': {
    keywords: [
      '所以想要', '这说明他们', '因此', '于是', '可见', '证明',
      '不支持就是反对', '不加班就是', '不买房就是', '不支持就是',
      '因为.*所以', '既然.*为什么', '都.*还', '还.*什么',
    ],
    weight: 2,
  },
  '权威依赖': {
    keywords: [
      '专家说', '权威研究表明', '著名经济学家', '权威机构',
      '数据显示', '据统计', '研究表明', '专家指出',
      '据某', '有研究', '有数据表明', '科学证明',
    ],
    weight: 1.5,
  },
  '幸存者偏差': {
    keywords: [
      '我身边', '我朋友', '我邻居', '我同事', '我认识的',
      '没有一个不是', '都成功了', '都发财了', '都买房了',
      '某某某也', '别人都能', '人家都能', '为什么你不能',
    ],
    weight: 1.5,
  },
};

function fallbackAnalyze(text: string): ScanResult {
  const rawSentences = text
    .split(/[。！？\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const sentences: RiskSentence[] = [];
  const riskCounts: Record<string, number> = {
    '情绪诱导': 0,
    '逻辑跳跃': 0,
    '权威依赖': 0,
    '幸存者偏差': 0,
  };
  let totalRiskScore = 0;

  for (let i = 0; i < rawSentences.length; i++) {
    const s = rawSentences[i];
    let detectedType: RiskSentence['risk_type'] = '事实';
    let severity: RiskSentence['severity'] = '低';
    let explanation: string | undefined;
    let maxScore = 0;

    for (const [type, config] of Object.entries(PATTERNS)) {
      let score = 0;
      for (const kw of config.keywords) {
        const regex = kw.includes('.*')
          ? new RegExp(kw.replace(/\./g, '\\.').replace(/\*/g, '.*'), 'i')
          : new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        if (regex.test(s)) {
          score += config.weight;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        detectedType = type as RiskSentence['risk_type'];
        severity = score >= 3 ? '高' : score >= 2 ? '中' : '低';
        explanation = getExplanation(type, s);
      }
    }

    sentences.push({
      id: `s${i + 1}`,
      text: s,
      risk_type: detectedType,
      severity,
      explanation,
    });

    if (detectedType !== '事实') {
      riskCounts[detectedType]++;
      totalRiskScore += maxScore * (severity === '高' ? 3 : severity === '中' ? 2 : 1);
    }
  }

  const sentenceCount = rawSentences.length || 1;
  const riskRatio = sentences.filter(s => s.risk_type !== '事实').length / sentenceCount;
  const overallScore = Math.min(100, Math.round(30 + riskRatio * 50 + Math.min(totalRiskScore * 3, 40)));

  const sc = sentences.length || 1;
  const riskDistribution: Record<string, number> = {
    '情绪诱导': Math.round((riskCounts['情绪诱导'] / sc) * 100),
    '逻辑跳跃': Math.round((riskCounts['逻辑跳跃'] / sc) * 100),
    '权威依赖': Math.round((riskCounts['权威依赖'] / sc) * 100),
    '幸存者偏差': Math.round((riskCounts['幸存者偏差'] / sc) * 100),
  };

  const riskLevel = getRiskLevelFromScore(overallScore);

  const riskTypes = sentences
    .filter(s => s.risk_type !== '事实')
    .map(s => s.risk_type);
  const uniqueTypes = [...new Set(riskTypes)];

  let verdict: string;
  if (uniqueTypes.length === 0) {
    verdict = '该内容表述较为客观，未发现明显的认知操控倾向。';
  } else if (overallScore >= 70) {
    verdict = `该内容存在明显的${uniqueTypes.slice(0, 2).join('、')}倾向，易引发读者认知偏差。`;
  } else if (overallScore >= 50) {
    verdict = `该内容使用了${uniqueTypes.slice(0, 2).join('、')}等手法，存在一定论证缺陷。`;
  } else {
    verdict = `该内容整体较为客观，但存在轻微的${uniqueTypes[0]}痕迹。`;
  }

  return {
    id: `scan-${Date.now()}`,
    input: text,
    inputType: 'text',
    timestamp: Date.now(),
    overall_score: overallScore,
    risk_level: riskLevel,
    risk_distribution: riskDistribution,
    sentences,
    ai_verdict: verdict,
  };
}

function getExplanation(riskType: string, sentence: string): string {
  const explanations: Record<string, string> = {
    '情绪诱导': '这句话使用了情绪性表达，试图通过情感共鸣而非理性论证来影响读者。',
    '逻辑跳跃': '这句话的论证存在逻辑断层，前提与结论之间缺乏充分的因果关系。',
    '权威依赖': '这句话引用权威但未提供具体出处或验证依据，存在诉诸权威倾向。',
    '幸存者偏差': '这句话用个别案例推导普遍结论，忽略了大量反例和失败样本。',
  };
  return explanations[riskType] || '该表述存在认知操控倾向。';
}
