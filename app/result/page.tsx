'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, CheckCircle, AlertCircle } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { useScanStore } from '@/store/scanStore';
import { RiskSentence } from '@/lib/types';
import { publishToRing } from '@/actions/share';

const riskColors: Record<string, { text: string; bar: string; bg: string }> = {
  '情绪诱导': { text: 'text-red-400', bar: 'bg-red-400', bg: 'bg-red-400/15' },
  '逻辑跳跃': { text: 'text-yellow-400', bar: 'bg-yellow-400', bg: 'bg-yellow-400/15' },
  '权威依赖': { text: 'text-blue-400', bar: 'bg-blue-400', bg: 'bg-blue-400/15' },
  '幸存者偏差': { text: 'text-purple-400', bar: 'bg-purple-400', bg: 'bg-purple-400/15' },
  '事实': { text: 'text-gray-400', bar: 'bg-gray-400', bg: 'transparent' },
};

export default function ResultPage() {
  const router = useRouter();
  const { input, result, clearAll } = useScanStore();
  const [selectedSentence, setSelectedSentence] = useState<RiskSentence | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [shareError, setShareError] = useState('');

  useEffect(() => {
    if (!input && !result) {
      router.push('/');
    }
  }, [input, result, router]);

  const data = result;
  if (!data) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </main>
    );
  }

  const score = data.overall_score;
  const getRiskColor = (s: number) => {
    if (s >= 80) return { dot: 'bg-red-500', text: 'text-red-400', label: '高诡辩倾向' };
    if (s >= 60) return { dot: 'bg-orange-500', text: 'text-orange-400', label: '操控风险' };
    if (s >= 40) return { dot: 'bg-yellow-500', text: 'text-yellow-400', label: '倾向性' };
    return { dot: 'bg-green-500', text: 'text-green-400', label: '安全' };
  };
  const riskInfo = getRiskColor(score);

  const pointerRotation = -90 + (score / 100) * 180;

  const handleShare = async () => {
    setShareStatus('loading');
    setShareError('');

    const title = '【照妖镜】认知操控检测报告';
    const riskCount = data.sentences.filter((s) => s.risk_type !== '事实').length;
    const content = `我在「照妖镜」检测了一段知乎回答，发现了${riskCount}处认知操控风险。\n\n📊 认知操控指数：${score}/100\n⚠️ 风险等级：${riskInfo.label}\n💬 AI判词：${data.ai_verdict}`;

    const result = await publishToRing(title, content);

    if (result.success) {
      setShareStatus('success');
    } else {
      setShareStatus('error');
      setShareError(result.error || '分享失败');
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <Header variant="app" />

      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Scan line */}
      <motion.div
        className="fixed left-0 right-0 h-[1px] bg-cyan-400/10 pointer-events-none z-0"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Corner decorations */}
      <div className="fixed top-20 left-4 w-16 h-16 border-l border-t border-cyan-500/20 pointer-events-none z-0" />
      <div className="fixed top-20 right-4 w-16 h-16 border-r border-t border-cyan-500/20 pointer-events-none z-0" />
      <div className="fixed bottom-4 left-4 w-16 h-16 border-l border-b border-cyan-500/20 pointer-events-none z-0" />
      <div className="fixed bottom-4 right-4 w-16 h-16 border-r border-b border-cyan-500/20 pointer-events-none z-0" />

      {/* Left side — Action 3 (sword raised) */}
      <div className="fixed left-[2%] bottom-[5%] w-[24%] h-[82%] pointer-events-none z-0">
        <img
          src="/images/action3.png?v=1"
          alt="刘看山"
          className="w-full h-full object-contain object-bottom"
        />
        {/* Vertical text */}
        <div className="absolute left-[5%] top-1/2 -translate-y-1/2 text-gray-700 text-xs tracking-[0.3em]"
          style={{ writingMode: 'vertical-rl' }}
        >
          识别真伪 洞悉本源
        </div>
      </div>

      {/* Right side — Action 4 (sword sheathed) */}
      <div className="fixed right-[2%] bottom-[5%] w-[24%] h-[82%] pointer-events-none z-0">
        <img
          src="/images/action4.png?v=1"
          alt="刘看山"
          className="w-full h-full object-contain object-bottom"
        />
        {/* Vertical text */}
        <div className="absolute right-[5%] top-1/2 -translate-y-1/2 text-gray-700 text-xs tracking-[0.3em]"
          style={{ writingMode: 'vertical-rl' }}
        >
          洞察本质 识破迷障
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 pt-24 pb-16 px-4">
        {/* Action Buttons */}
        <div className="max-w-4xl mx-auto flex justify-center gap-4 mb-8">
          <button
            onClick={() => {
              clearAll();
              router.push('/');
            }}
            className="px-5 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            再测一个
          </button>
          <button
            onClick={() => router.push('/scan')}
            className="px-5 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-sm text-cyan-400 hover:bg-cyan-500/15 transition-colors"
          >
            查看过程
          </button>
          <button
            onClick={handleShare}
            disabled={shareStatus === 'loading'}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              shareStatus === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : shareStatus === 'error'
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/15'
            }`}
          >
            {shareStatus === 'success' ? (
              <><CheckCircle size={14} /> 已分享</>
            ) : shareStatus === 'error' ? (
              <><AlertCircle size={14} /> 分享失败</>
            ) : (
              <><Share2 size={14} /> 分享到圈子</>
            )}
          </button>
        </div>

        {/* Top Section — Gauge + Risk Distribution */}
        <div className="max-w-4xl mx-auto flex items-start justify-center gap-16 mb-10">
          {/* Gauge */}
          <div className="flex flex-col items-center relative">
            {/* Decorative ring */}
            <div className="absolute -inset-6 border border-cyan-500/10 rounded-full pointer-events-none" />
            <div className="absolute -inset-10 border border-dashed border-cyan-500/5 rounded-full pointer-events-none" />

            <div className="relative w-72 h-36">
              <svg viewBox="0 0 200 100" className="w-full h-full">
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
                {/* Inner arc */}
                <path
                  d="M 35 100 A 65 65 0 0 1 165 100"
                  fill="none"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="1"
                />
                {[0, 25, 50, 75, 100].map((tick) => {
                  const angle = -90 + (tick / 100) * 180;
                  const rad = (angle * Math.PI) / 180;
                  const x1 = 100 + 58 * Math.cos(rad);
                  const y1 = 100 + 58 * Math.sin(rad);
                  const x2 = 100 + 68 * Math.cos(rad);
                  const y2 = 100 + 68 * Math.sin(rad);
                  return (
                    <g key={tick}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                      <text
                        x={100 + 48 * Math.cos(rad)}
                        y={100 + 48 * Math.sin(rad)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="rgba(255,255,255,0.5)"
                        fontSize="8"
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <motion.div
                className="absolute bottom-0 left-1/2 w-0.5 h-28 origin-bottom"
                style={{ marginLeft: '-1px' }}
                initial={{ rotate: -90 }}
                animate={{ rotate: pointerRotation }}
                transition={{ duration: 1.5, type: 'spring', stiffness: 60 }}
              >
                <div className="w-full h-full bg-gradient-to-t from-white via-gray-300 to-gray-500 rounded-full shadow-[0_0_6px_rgba(255,255,255,0.3)]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
              </motion.div>
            </div>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-7xl font-black text-white leading-none mt-1"
            >
              {score}
            </motion.div>
            <div className="text-sm text-gray-400 mt-1">认知操控指数</div>
            <div className={`text-lg font-bold mt-1 ${riskInfo.text}`}>{riskInfo.label}</div>
          </div>

          {/* Risk Distribution */}
          <div className="w-56 space-y-3 pt-8 relative">
            <div className="absolute -inset-4 border border-white/[0.03] rounded-xl pointer-events-none" />
            <div className="absolute -top-1 left-3 px-2 bg-[#0a0a0f]">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">风险分布</span>
            </div>
            {Object.entries(data.risk_distribution).map(([type, value], index) => {
              const colors = riskColors[type] || riskColors['事实'];
              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span className={colors.text}>{type}</span>
                    <span className="text-gray-500">{value}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${colors.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(value, 100)}%` }}
                      transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Verdict Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-2xl mx-auto mb-8 text-center"
        >
          <div className="text-xs text-gray-600 mb-3 uppercase tracking-widest">一句话结论</div>
          <p className="text-xl font-bold text-white leading-relaxed">
            &ldquo;{data.ai_verdict}&rdquo;
          </p>
        </motion.div>

        {/* Text Analysis */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-2xl mx-auto relative"
        >
          <div className="relative border border-white/[0.03] rounded-xl p-6"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.005) 100%)',
            }}
          >
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/20 rounded-tl" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/20 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/20 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/20 rounded-br" />

            <div className="text-xs text-gray-600 mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-cyan-500/40 rounded-full" />
              原文分析
            </div>

            <div className="space-y-2">
            {data.sentences.map((sentence, index) => {
              const colors = riskColors[sentence.risk_type] || riskColors['事实'];
              const hasRisk = sentence.risk_type !== '事实';

              return (
                <motion.div
                  key={sentence.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  className={`flex items-start gap-2 cursor-pointer hover:bg-white/[0.03] p-2 rounded transition-colors ${
                    selectedSentence?.id === sentence.id ? 'bg-white/[0.05]' : ''
                  }`}
                  onClick={() => setSelectedSentence(hasRisk ? sentence : null)}
                >
                  <span
                    className={`text-sm leading-relaxed ${
                      hasRisk ? `${colors.bg} px-2 py-0.5 rounded` : ''
                    } ${hasRisk ? colors.text : 'text-gray-400'}`}
                  >
                    {sentence.text}
                  </span>
                  {hasRisk && (
                    <span className={`text-[10px] mt-1 ${colors.text}`}>● {sentence.risk_type}</span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Evidence Panel */}
          <AnimatePresence>
            {selectedSentence && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="fixed right-8 top-1/2 -translate-y-1/2 w-80 bg-white/[0.04] rounded-xl border border-white/10 p-5 z-50 backdrop-blur-sm"
                style={{
                  boxShadow: '0 0 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔔</span>
                  <span className="text-sm font-semibold text-white">风险识别</span>
                </div>
                <div className={`text-sm font-medium mb-2 ${riskColors[selectedSentence.risk_type]?.text || 'text-gray-400'}`}>
                  {selectedSentence.risk_type}
                </div>
                <div className="text-xs text-gray-500 mb-1">原因：</div>
                <p className="text-sm text-gray-300 mb-3">{selectedSentence.explanation}</p>
                <div className="text-xs text-gray-500 mb-1">风险等级：</div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  selectedSentence.severity === '高' ? 'bg-red-500/20 text-red-400' :
                  selectedSentence.severity === '中' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {selectedSentence.severity}
                </span>
                <button
                  onClick={() => setSelectedSentence(null)}
                  className="absolute top-3 right-3 text-gray-600 hover:text-white text-xs"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
