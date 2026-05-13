import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ZHIHU_APP_ID = process.env.ZHIHU_APP_ID || '';
const ZHIHU_CLIENT_SECRET = process.env.ZHIHU_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.ZHIHU_REDIRECT_URI || 'https://sudden-cms.vercel.app/api/auth/callback/zhihu';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/?error=zhihu_auth_denied', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    // 1. 用 code 换 access_token
    const tokenRes = await fetch('https://www.zhihu.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: ZHIHU_APP_ID,
        client_secret: ZHIHU_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[知乎 OAuth] token 交换失败:', errText);
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token as string | undefined;

    if (!accessToken) {
      return NextResponse.redirect(new URL('/?error=no_access_token', request.url));
    }

    // 2. 获取用户信息
    const meRes = await fetch(`https://www.zhihu.com/api/v4/me?access_token=${accessToken}`);
    const meData = (await meRes.json()) as Record<string, unknown>;

    const user = {
      name: String(meData.name || meData.id || '知乎用户'),
      avatar: String(meData.avatar_url || meData.avatar || ''),
      headline: String(meData.headline || ''),
    };

    // 3. 写 cookie
    const cookieStore = await cookies();
    cookieStore.set('zhihu_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    cookieStore.set('zhihu_user', JSON.stringify(user), {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.redirect(new URL('/', request.url));
  } catch (err) {
    console.error('[知乎 OAuth] 回调处理异常:', err);
    return NextResponse.redirect(new URL('/?error=auth_exception', request.url));
  }
}
