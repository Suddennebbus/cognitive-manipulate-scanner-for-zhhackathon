'use server';

interface SearchItem {
  Title: string;
  ContentType: string;
  ContentID: string;
  ContentText: string;
  Url: string;
  CommentCount: number;
  VoteUpCount: number;
  AuthorName: string;
  AuthorAvatar: string;
}

interface SearchResponse {
  Code: number;
  Message: string;
  Data: {
    HasMore: boolean;
    SearchHashId: string;
    Items: SearchItem[];
  };
}

const ACCESS_SECRET = process.env.ZHIHU_ACCESS_SECRET || '';
const API_URL = 'https://developer.zhihu.com/api/v1/content/zhihu_search';

export async function searchZhihuContent(query: string, count: number = 10): Promise<SearchResponse | { error: string }> {
  if (!ACCESS_SECRET) {
    return { error: '未配置 ZHIHU_ACCESS_SECRET' };
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = new URLSearchParams({
      Query: query,
      Count: String(Math.min(count, 10)),
    });

    const response = await fetch(`${API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ACCESS_SECRET}`,
        'X-Request-Timestamp': String(timestamp),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('知乎搜索 API 错误:', response.status, errorText);
      return { error: `知乎 API 错误: ${response.status}` };
    }

    const data = await response.json() as SearchResponse;
    return data;
  } catch (error) {
    console.error('知乎搜索失败:', error);
    return { error: '搜索失败' };
  }
}
