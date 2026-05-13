export interface ScanResult {
  id: string;
  input: string;
  inputType: 'link' | 'text';
  timestamp: number;
  overall_score: number;
  risk_level: string;
  risk_distribution: Record<string, number>;
  sentences: RiskSentence[];
  ai_verdict: string;
}

export interface RiskSentence {
  id: string;
  text: string;
  risk_type: '情绪诱导' | '逻辑跳跃' | '权威依赖' | '幸存者偏差' | '事实';
  explanation?: string;
  severity: '低' | '中' | '高';
}

export interface DetectedRisk {
  type: string;
  score: number;
}
