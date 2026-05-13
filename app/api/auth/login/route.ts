import { NextResponse } from 'next/server';

const ZHIHU_APP_ID = process.env.ZHIHU_APP_ID || '';
const REDIRECT_URI = process.env.ZHIHU_REDIRECT_URI || 'https://sudden-cms.vercel.app/api/auth/callback/zhihu';

export function GET() {
  if (!ZHIHU_APP_ID) {
    return NextResponse.json({ error: '未配置 ZHIHU_APP_ID' }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: ZHIHU_APP_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'read',
  });

  return NextResponse.redirect(`https://www.zhihu.com/oauth2/authorize?${params.toString()}`);
}
