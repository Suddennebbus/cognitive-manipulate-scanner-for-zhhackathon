import puppeteer from 'puppeteer-core';

const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/google-chrome';

/**
 * 判断输入是否是知乎链接
 */
export function isZhihuLink(input: string): boolean {
  return /^https?:\/\/(www\.)?zhihu\.com/.test(input) || /^https?:\/\/zhuanlan\.zhihu\.com/.test(input);
}

/**
 * 使用 puppeteer 抓取知乎回答/文章正文
 */
export async function fetchZhihuContent(url: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,800',
    ],
  });

  try {
    const page = await browser.newPage();

    // 设置 User-Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    // 设置额外 headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Referer': 'https://www.zhihu.com/',
    });

    // 访问页面，等待网络空闲
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // 等待内容加载
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 提取正文内容
    const content = await page.evaluate(() => {
      // 尝试多种选择器来提取内容
      const selectors = [
        '.RichContent-inner',      // 回答正文
        '.RichText',               // 富文本内容
        '.Post-RichTextContainer', // 文章正文
        '.AnswerCard-mainContent',
        '[data-zop-question] .RichContent',
        '.QuestionAnswer-content .RichContent',
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent || '';
          if (text.trim().length > 50) {
            return text.trim();
          }
        }
      }

      // Fallback: 尝试提取所有段落
      const paragraphs = document.querySelectorAll('p, .RichText');
      let text = '';
      for (const p of paragraphs) {
        const t = p.textContent || '';
        if (t.trim()) {
          text += t.trim() + '\n';
        }
      }
      return text.trim();
    });

    if (!content || content.length < 50) {
      throw new Error('未能从知乎页面提取到有效内容，请直接粘贴回答文本');
    }

    // 清理内容：去除多余空白、限制长度
    return content
      .replace(/\n{3,}/g, '\n\n')
      .slice(0, 8000); // 限制长度，避免超出模型上下文
  } finally {
    await browser.close();
  }
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
      // 抓取失败，返回提示
      const errorMsg = err instanceof Error ? err.message : '抓取失败';
      throw new Error(`知乎内容抓取失败：${errorMsg}`);
    }
  }

  return { text: input, isLink: false };
}
