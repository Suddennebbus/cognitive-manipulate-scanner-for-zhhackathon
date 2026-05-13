'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchZhihuHotlist } from '@/actions/zhihu';
import { searchZhihuContent } from '@/actions/search';
import { ChevronLeft } from 'lucide-react';

interface HotItem {
  Title: string;
  Url: string;
  ThumbnailUrl: string;
  Summary: string;
}

interface SearchItem {
  Title: string;
  ContentText: string;
  Url: string;
  VoteUpCount: number;
  AuthorName: string;
}

interface HotListResponse {
  Code: number;
  Message: string;
  Data: {
    Total: number;
    Items: HotItem[];
  };
}

interface ZhihuHotListProps {
  onSelect: (title: string, content: string) => void;
}

type ViewMode = 'hotlist' | 'searching' | 'results';

export function ZhihuHotList({ onSelect }: ZhihuHotListProps) {
  const [items, setItems] = useState<HotItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<ViewMode>('hotlist');
  const [selectedTitle, setSelectedTitle] = useState('');

  useEffect(() => {
    fetchZhihuHotlist()
      .then((data) => {
        if ('error' in data) {
          setError(data.error);
          setLoading(false);
          return;
        }
        if (data.Code !== 0) {
          setError(data.Message || '获取热榜失败');
          setLoading(false);
          return;
        }
        setItems(data.Data?.Items || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || '网络错误');
        setLoading(false);
      });
  }, []);

  const handleHotItemClick = async (item: HotItem) => {
    setSelectedTitle(item.Title);
    setMode('searching');
    setSearching(true);

    const result = await searchZhihuContent(item.Title, 10);

    if ('error' in result) {
      setError(result.error);
      setSearching(false);
      return;
    }

    if (result.Code !== 0) {
      setError(result.Message || '搜索失败');
      setSearching(false);
      return;
    }

    const filtered = (result.Data?.Items || [])
      .filter((i) => i.ContentText && i.ContentText.trim().length > 30)
      .map((i) => ({
        Title: i.Title,
        ContentText: i.ContentText,
        Url: i.Url,
        VoteUpCount: i.VoteUpCount,
        AuthorName: i.AuthorName,
      }));

    setSearchResults(filtered);
    setSearching(false);
    setMode('results');
  };

  const handleResultSelect = (item: SearchItem) => {
    const text = `${item.Title}\n\n${item.ContentText}`;
    onSelect(item.Title, text);
  };

  const handleBack = () => {
    setMode('hotlist');
    setSearchResults([]);
    setError('');
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-500 text-sm">
        加载热榜中...
      </div>
    );
  }

  if (error && mode === 'hotlist') {
    return (
      <div className="w-full h-64 flex items-center justify-center text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      {mode !== 'hotlist' && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
            返回热榜
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Hotlist View */}
        {mode === 'hotlist' && (
          <motion.div
            key="hotlist"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-h-[400px] overflow-y-auto space-y-2 pr-1 custom-scrollbar"
          >
            {items.map((item, index) => (
              <motion.button
                key={item.Url}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleHotItemClick(item)}
                className="w-full text-left p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-cyan-500/20 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`text-xs font-bold mt-0.5 w-5 h-5 flex items-center justify-center rounded shrink-0 ${
                      index < 3
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-white/5 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white group-hover:text-cyan-300 transition-colors truncate">
                      {item.Title}
                    </p>
                    {item.Summary && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {item.Summary}
                      </p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Searching View */}
        {mode === 'searching' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-64 flex flex-col items-center justify-center"
          >
            <div className="text-sm text-cyan-400 mb-2">正在搜索相关回答...</div>
            <div className="text-xs text-gray-500">「{selectedTitle}」</div>
            <div className="mt-4 w-32 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-cyan-400 rounded-full"
                animate={{ width: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}

        {/* Results View */}
        {mode === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-h-[400px] overflow-y-auto space-y-2 pr-1 custom-scrollbar"
          >
            <div className="text-xs text-gray-500 mb-2">
              找到 {searchResults.length} 个相关回答
            </div>
            {searchResults.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                未找到相关回答，请返回热榜重试或直接输入文本
              </div>
            ) : (
              searchResults.map((item, index) => (
                <motion.button
                  key={item.Url}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleResultSelect(item)}
                  className="w-full text-left p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-cyan-500/20 transition-colors group"
                >
                  <p className="text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                    {item.Title}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-gray-500">{item.AuthorName}</span>
                    <span className="text-[10px] text-cyan-400">▲ {item.VoteUpCount}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">
                    {item.ContentText.slice(0, 120)}...
                  </p>
                </motion.button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
