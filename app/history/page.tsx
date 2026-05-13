'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { useScanStore } from '@/store/scanStore';

export default function HistoryPage() {
  const router = useRouter();
  const { history } = useScanStore();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getScoreDot = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <Header variant="app" />

      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 mt-14 h-14 bg-[#0a0a0f]/90 border-b border-white/5 flex items-center justify-between px-7">
        <div className="flex items-center gap-6">
          <span
            className="text-sm text-gray-500 hover:text-white cursor-pointer transition-colors"
            onClick={() => router.push('/scan')}
          >分析</span>
          <span className="text-sm text-white cursor-pointer transition-colors">历史记录</span>
          <span className="text-sm text-gray-500 hover:text-white cursor-pointer transition-colors">知识库</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto pt-28 px-6">
        <h1 className="text-2xl font-bold text-white mb-8">扫描历史</h1>

        {history.length === 0 ? (
          <div className="text-gray-600 text-center py-20">暂无扫描记录</div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  useScanStore.getState().setResult(item);
                  router.push('/result');
                }}
                className="bg-white/[0.02] rounded-xl border border-white/5 p-5 cursor-pointer hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-white text-sm font-medium truncate flex-1 mr-4">
                    {item.input.length > 60 ? item.input.slice(0, 60) + '...' : item.input}
                  </div>
                  <div className={`text-lg font-bold ${getScoreColor(item.overall_score)}`}>
                    {item.overall_score}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-600">
                    {new Date(item.timestamp).toLocaleString('zh-CN')}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${getScoreDot(item.overall_score)}`} />
                  <span className={`text-xs ${getScoreColor(item.overall_score)}`}>
                    {item.risk_level}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  {Object.entries(item.risk_distribution)
                    .filter(([_, v]) => v > 15)
                    .map(([type, value]) => {
                      const colorMap: Record<string, string> = {
                        '情绪诱导': 'bg-red-400/15 text-red-400',
                        '逻辑跳跃': 'bg-yellow-400/15 text-yellow-400',
                        '权威依赖': 'bg-blue-400/15 text-blue-400',
                        '幸存者偏差': 'bg-purple-400/15 text-purple-400',
                      };
                      return (
                        <span
                          key={type}
                          className={`text-[10px] px-2 py-0.5 rounded ${colorMap[type] || 'bg-gray-400/15 text-gray-400'}`}
                        >
                          {type} {value}%
                        </span>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
