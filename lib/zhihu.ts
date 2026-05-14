/**
 * 判断输入是否是知乎链接
 */
export function isZhihuLink(input: string): boolean {
  return /^https?:\/\/(www\.)?zhihu\.com/.test(input) || /^https?:\/\/zhuanlan\.zhihu\.com/.test(input);
}

/**
 * 使用 fetch 抓取知乎回答/文章正文 (Cloudflare compatible)
 * 注意：知乎有反爬机制，抓取可能失败
 */
export async function fetchZhihuContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Referer': 'https://www.zhihu.com/',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  });

  if (!res.ok) {
    throw new Error(`抓取失败: HTTP ${res.status}`);
  }

  const html = await res.text();

  // 尝试多种方式提取正文
  let content = '';

  // 1. 尝试提取 RichContent 或 RichText
  const richContentMatch = html.match(/<div[^\u003e]*class="[^"]*RichContent[^"]*"[^\u003e]*>([\s\S]*?)\u003c\/div>\s*(?:\u003cdiv[^\u003e]*class="[^"]*ContentItem-actions|\u003c\/div>\s*\u003c\/div>)/i);
  const richTextMatch = html.match(/<div[^\u003e]*class="[^"]*RichText[^"]*"[^\u003e]*>([\s\S]*?)\u003c\/div>/i);
  const postMatch = html.match(/<div[^\u003e]*class="[^"]*Post-RichTextContainer[^"]*"[^\u003e]*>([\s\S]*?)\u003c\/div>/i);

  const rawHtml = richContentMatch?.[1] || richTextMatch?.[1] || postMatch?.[1] || '';

  if (rawHtml) {
    const paragraphs: string[] = [];
    const pRegex = /<p[^\u003e]*>([\s\S]*?)\u003c\/p>/gi;
    let match;
    while ((match = pRegex.exec(rawHtml)) !== null) {
      const text = match[1]
        .replace(/<[^\u003e]+>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .trim();
      if (text.length > 0) {
        paragraphs.push(text);
      }
    }
    content = paragraphs.join('\n\n');
  }

  // 2. fallback: 从整个 HTML 提取段落
  if (!content || content.length < 50) {
    const cleanedHtml = html
      .replace(/<script[\s\S]*?\u003c\/script>/gi, '')
      .replace(/<style[\s\S]*?\u003c\/style>/gi, '');

    const allParagraphs: string[] = [];
    const pRegex = /<p[^\u003e]*>([\s\S]*?)\u003c\/p>/gi;
    let match;
    while ((match = pRegex.exec(cleanedHtml)) !== null) {
      const text = match[1]
        .replace(/<[^\u003e]+>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .trim();
      if (text.length > 20) {
        allParagraphs.push(text);
      }
    }
    content = allParagraphs.join('\n\n');
  }

  if (!content || content.length < 50) {
    throw new Error('未能从知乎页面提取到有效内容，请直接粘贴回答文本');
  }

  return content
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, 8000);
}

/**
 * 尝试从知乎链接获取内容
 * 失败时返回错误信息
 */
export async function extractContentFromInput(input: string): Promise<{ text: string; isLink: boolean }> {
  if (isZhihuLink(input)) {
    try {
      const text = await fetchZhihuContent(input);
      return { text, isLink: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '抓取失败';
      throw new Error(`知乎内容抓取失败：${errorMsg}`);
    }
  }

  return { text: input, isLink: false };
}
