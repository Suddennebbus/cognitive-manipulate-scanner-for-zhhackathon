import { NextRequest, NextResponse } from 'next/server';
import { analyzeContent } from '@/lib/analyzer';
import { extractContentFromInput } from '@/lib/zhihu';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, inputType } = body as { input: string; inputType: 'link' | 'text' };

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: '输入不能为空' },
        { status: 400 }
      );
    }

    // 提取内容（如果是链接则抓取）
    const { text, isLink } = await extractContentFromInput(input);

    // 调用 Kimi AI 进行分析（内部已包含 fallback）
    const result = await analyzeContent(text);

    // 更新 inputType
    result.input = input;
    result.inputType = inputType || (isLink ? 'link' : 'text');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analyze API error:', error);
    const message = error instanceof Error ? error.message : '分析失败';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
