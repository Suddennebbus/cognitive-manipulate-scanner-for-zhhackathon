'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Header } from '@/components/shared/Header';
import { useScanStore } from '@/store/scanStore';
import { ScanResult } from '@/lib/types';

export default function ScanPage() {
  const router = useRouter();
  const { input, startScan, updateProgress, setCurrentAnalysis, addDetectedRisk, setResult, addToHistory } = useScanStore();
  const detectedRisks = useScanStore((state) => state.detectedRisks);
  const [localProgress, setLocalProgress] = useState(0);
  const [analysisSteps, setAnalysisSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [scanLines, setScanLines] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!input) {
      router.push('/');
      return;
    }
    startScan();
  }, [input, router, startScan]);

  useEffect(() => {
    if (!input) return;

    const steps = [
      '检测逻辑结构...',
      '分析情绪诱导...',
      '识别幸存者偏差...',
      '验证事实引用...',
      '评估权威依赖...',
      '构建证据链...',
    ];
    setAnalysisSteps(steps);

    const interval = setInterval(() => {
      setLocalProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(prev + Math.random() * 8 + 2, 100);
      });
    }, 300);

    return () => clearInterval(interval);
  }, [input]);

  useEffect(() => {
    updateProgress(localProgress);
  }, [localProgress, updateProgress]);

  useEffect(() => {
    if (analysisSteps.length === 0) return;
    const stepIndex = Math.floor((localProgress / 100) * analysisSteps.length);
    setCurrentStep(Math.min(stepIndex, analysisSteps.length - 1));
    if (analysisSteps[stepIndex]) {
      setCurrentAnalysis(analysisSteps[stepIndex]);
    }
  }, [localProgress, analysisSteps, setCurrentAnalysis]);

  useEffect(() => {
    const lines = Array.from({ length: 5 }, (_, i) => i * 20);
    setScanLines(lines);
  }, []);

  useEffect(() => {
    if (localProgress >= 100 && input && !isAnalyzing) {
      setIsAnalyzing(true);
      // 调用真实分析 API
      fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          inputType: input.includes('zhihu.com') || input.startsWith('http') ? 'link' : 'text',
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok || data.error) {
            throw new Error(data.error || `API 错误: ${res.status}`);
          }
          return data as ScanResult;
        })
        .then((result: ScanResult) => {
          setResult(result);
          addToHistory(result);
          // 根据结果填充检测到的风险
          if (result.sentences) {
            result.sentences.forEach((s, i) => {
              if (s.risk_type !== '事实') {
                setTimeout(() => {
                  addDetectedRisk({
                    type: s.risk_type,
                    score: s.severity === '高' ? 12 : s.severity === '中' ? 8 : 5,
                  });
                }, i * 200);
              }
            });
          }
        })
        .catch(err => {
          console.error('分析失败:', err);
          // API 失败也生成一个 fallback 结果，避免页面空白
          const fallbackResult: ScanResult = {
            id: `scan-${Date.now()}`,
            input,
            inputType: input.includes('zhihu.com') || input.startsWith('http') ? 'link' : 'text',
            timestamp: Date.now(),
            overall_score: 0,
            risk_level: '安全',
            risk_distribution: { '情绪诱导': 0, '逻辑跳跃': 0, '权威依赖': 0, '幸存者偏差': 0 },
            sentences: input.split(/[。！？\n]+/).filter(s => s.trim().length > 0).map((text, i) => ({
              id: `s${i + 1}`,
              text: text.trim(),
              risk_type: '事实' as const,
              severity: '低' as const,
            })),
            ai_verdict: `分析失败: ${err instanceof Error ? err.message : '未知错误'}`,
          };
          setResult(fallbackResult);
        })
        .finally(() => {
          setTimeout(() => {
            router.push('/result');
          }, 1200);
        });
    }
  }, [localProgress, input, isAnalyzing, router, setResult, addToHistory, addDetectedRisk]);

  const sentences = input ? input.split(/[。！？\n]+/).filter((s) => s.trim().length > 0) : [];

  const displayProgress = isAnalyzing ? 95 : Math.min(localProgress, 100);
  const progressBars = [
    { label: '分析进度', value: displayProgress },
    { label: '文案进度', value: Math.min(displayProgress * 0.8, 100) },
    { label: '证据链进度', value: Math.min(displayProgress * 0.6, 100) },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <Header variant="app" />

      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 mt-14 h-14 bg-[#0a0a0f]/90 border-b border-white/5 flex items-center justify-between px-7">
        <div className="flex items-center gap-6">
          <span className="text-sm text-white cursor-pointer transition-colors">分析</span>
          <span
            className="text-sm text-gray-500 hover:text-white cursor-pointer transition-colors"
            onClick={() => router.push('/history')}
          >历史记录</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-gray-500">实时分析中</span>
          <span className="text-xs text-gray-600 ml-2 font-mono">
            {new Date().toLocaleTimeString('zh-CN', { hour12: false })}
          </span>
        </div>
      </div>

      {/* Main Content - Three Columns */}
      <div className="flex-1 flex pt-28 pb-16 px-4 gap-4">
        {/* Left Column - Original Text */}
        <div className="w-[28%] bg-white/[0.02] rounded-xl border border-white/5 p-5 overflow-hidden relative flex flex-col"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 0 20px rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-pulse" />
            <span className="text-xs text-gray-600 uppercase tracking-wider">原文内容</span>
          </div>
          <div className="flex-1 space-y-3 relative overflow-y-auto">
            {/* Scan lines */}
            {scanLines.map((line, i) => (
              <motion.div
                key={i}
                className="absolute left-0 right-0 h-6 bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent pointer-events-none"
                style={{ top: `${line}%` }}
                animate={{ left: ['-100%', '100%'] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'linear',
                }}
              />
            ))}
            {/* Grid overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.02]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)`,
                backgroundSize: '100% 24px',
              }}
            />

            {sentences.length > 0 ? (
              sentences.map((sentence, index) => {
                const isScanned = (index / sentences.length) * 100 < localProgress;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0.3 }}
                    animate={{
                      opacity: isScanned ? 1 : 0.3,
                      backgroundColor: isScanned ? 'rgba(0,200,255,0.05)' : 'rgba(0,0,0,0)',
                    }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-gray-300 leading-relaxed p-2 rounded"
                  >
                    {sentence}
                  </motion.div>
                );
              })
            ) : (
              <div className="text-sm text-gray-500 leading-relaxed">
                {input || '等待输入内容...'}
              </div>
            )}
          </div>
        </div>

        {/* Middle Column - LiuKanShan + Scan Animation */}
        <div className="w-[44%] flex flex-col items-center relative overflow-hidden">
          {/* LiuKanShan */}
          <div className="relative w-full h-[70vh] shrink-0">
            <Image
              src="/images/action2.png"
              alt="刘看山"
              fill
              className="object-contain object-top"
              sizes="44vw"
              priority
            />
          </div>

          {/* Analysis status - Terminal style */}
          <div className="mt-2 px-4 py-2 bg-black/30 rounded border border-cyan-500/10 text-center min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-gray-600 font-mono">TERMINAL_</span>
              <span className="relative flex h-1.5 w-1.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAnalyzing ? 'bg-cyan-400' : 'bg-green-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isAnalyzing ? 'bg-cyan-500' : 'bg-green-500'}`}></span>
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={isAnalyzing ? 'analyzing' : currentStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-cyan-400/80 font-mono"
              >
                <span className="text-cyan-600">{'>'}</span> {isAnalyzing
                  ? 'AI 深度分析中...'
                  : analysisSteps[currentStep] || '正在初始化扫描...'}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Detected risks */}
          <div className="mt-3 flex gap-4">
            {detectedRisks.slice(-3).map((risk, i) => (
              <motion.div
                key={`${risk.type}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="text-lg font-bold text-red-400">+{risk.score}</div>
                <div className="text-[10px] text-gray-600">{risk.type}</div>
              </motion.div>
            ))}
          </div>

          {/* Bottom progress in middle column */}
          <div className="mt-4 w-full px-8 space-y-2">
            {progressBars.map((bar, index) => (
              <div key={index}>
                <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                  <span>{bar.label}</span>
                  <span>{Math.round(bar.value)}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${bar.value}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Risk Panel */}
        <div className="w-[28%] bg-white/[0.02] rounded-xl border border-white/5 p-5 relative overflow-hidden"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 0 20px rgba(0,0,0,0.3)',
          }}
        >
          {/* HUD corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/30 rounded-tl" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/30 rounded-tr" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/30 rounded-bl" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/30 rounded-br" />

          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 bg-red-500/50 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-white">风险检测</span>
          </div>

          <div className="mb-4">
            <span className="text-xs text-gray-500">风险级别：</span>
            <span className={`text-xs px-2 py-0.5 rounded ml-1 ${
              detectedRisks.length > 2
                ? 'bg-red-500/10 text-red-400'
                : detectedRisks.length > 0
                ? 'bg-yellow-500/10 text-yellow-400'
                : isAnalyzing
                ? 'bg-cyan-500/10 text-cyan-400'
                : 'bg-green-500/10 text-green-400'
            }`}>
              {detectedRisks.length > 2 ? '中高风险' : detectedRisks.length > 0 ? '中低风险' : isAnalyzing ? 'AI 分析中' : '分析中...'}
            </span>
          </div>

          <div className="space-y-3">
            {detectedRisks.length > 0 ? (
              detectedRisks.map((item, index) => (
                <motion.div
                  key={`${item.type}-${index}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="p-3 bg-white/[0.03] rounded-lg border border-white/5"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-gray-300 font-medium flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                      </span>
                      检测到{item.type}
                    </span>
                    <span className="text-xs text-red-400 font-bold">+{item.score}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    在分析过程中发现{item.type}类风险表达，建议仔细审视该论述的合理性。
                  </p>
                </motion.div>
              ))
            ) : (
              [
                { title: '正在扫描情绪诱导...', desc: '检测内容中是否存在情绪操控性表达', score: 0 },
                { title: '正在扫描逻辑结构...', desc: '验证论证过程的逻辑完整性', score: 0 },
                { title: '正在验证事实引用...', desc: '检查数据来源和引用可靠性', score: 0 },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 0.5, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="p-3 bg-white/[0.02] rounded-lg border border-white/5"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-gray-400 font-medium">{item.title}</span>
                    <span className="text-xs text-gray-600 font-bold">--</span>
                  </div>
                  <p className="text-[11px] text-gray-700 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))
            )}
          </div>

          {/* Disclaimer */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-[10px] text-gray-700 leading-relaxed">
              本系统不判断观点对错，仅分析表达中的认知操控倾向。
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
