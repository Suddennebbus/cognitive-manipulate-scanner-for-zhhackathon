'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScanStore } from '@/store/scanStore';
import { ZhihuHotList } from './ZhihuHotList';

type InputMode = 'text' | 'hotlist';

export function ScanInput() {
  const [mode, setMode] = useState<InputMode>('text');
  const [value, setValue] = useState('');
  const router = useRouter();
  const { setInput, setInputType } = useScanStore();

  const isLink = value.includes('zhihu.com') || value.startsWith('http');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    setInput(value);
    setInputType(isLink ? 'link' : 'text');
    router.push('/scan');
  };

  const handleHotItemSelect = (title: string, summary: string) => {
    const text = summary.trim() ? `${title}\n\n${summary}` : title;
    setInput(text);
    setInputType('text');
    router.push('/scan');
  };

  return (
    <div className="w-full">
      {/* Mode Tabs */}
      <div className="flex gap-4 mb-4">
        <button
          type="button"
          onClick={() => setMode('text')}
          className={`text-sm pb-1 border-b-2 transition-colors ${
            mode === 'text'
              ? 'text-cyan-400 border-cyan-400'
              : 'text-gray-500 border-transparent hover:text-gray-400'
          }`}
        >
          直接输入回答正文
        </button>
        <button
          type="button"
          onClick={() => setMode('hotlist')}
          className={`text-sm pb-1 border-b-2 transition-colors ${
            mode === 'hotlist'
              ? 'text-cyan-400 border-cyan-400'
              : 'text-gray-500 border-transparent hover:text-gray-400'
          }`}
        >
          知乎热榜
        </button>
      </div>

      {mode === 'text' ? (
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center h-11 rounded-lg border border-cyan-400/50 bg-white/[0.05] shadow-[0_0_15px_rgba(34,211,238,0.12)]">
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="输入回答正文"
                className="flex-1 h-full bg-transparent pl-4 pr-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              className="h-11 px-5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-bold tracking-wide transition-colors shadow-[0_0_12px_rgba(34,211,238,0.3)]"
            >
              显形吧！
            </button>
          </div>
        </form>
      ) : (
        <ZhihuHotList onSelect={handleHotItemSelect} />
      )}
    </div>
  );
}
