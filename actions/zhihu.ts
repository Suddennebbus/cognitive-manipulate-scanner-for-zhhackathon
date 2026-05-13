'use server';

interface HotItem {
  Title: string;
  Url: string;
  ThumbnailUrl: string;
  Summary: string;
}

interface HotListResponse {
  Code: number;
  Message: string;
  Data: {
    Total: number;
    Items: HotItem[];
  };
}

const ACCESS_SECRET = process.env.ZHIHU_ACCESS_SECRET || '';
const API_URL = 'https://developer.zhihu.com/api/v1/content/hot_list';

export async function fetchZhihuHotlist(): Promise<HotListResponse | { error: string }> {
  if (!ACCESS_SECRET) {
    return { error: '未配置 ZHIHU_ACCESS_SECRET' };
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const response = await fetch(`${API_URL}?Limit=30`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ACCESS_SECRET}`,
        'X-Request-Timestamp': String(timestamp),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('知乎热榜 API 错误:', response.status, errorText);
      return { error: `知乎 API 错误: ${response.status}` };
    }

    const data = await response.json() as HotListResponse;
    return data;
  } catch (error) {
    console.error('获取知乎热榜失败:', error);
    return { error: '获取热榜失败' };
  }
}
