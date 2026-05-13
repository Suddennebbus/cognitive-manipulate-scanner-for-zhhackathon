import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ZHIHU_APP_ID = process.env.ZHIHU_APP_ID || '';
// 兼容多种环境变量命名
const ZHIHU_APP_KEY = process.env.ZHIHU_APP_KEY || process.env.ZHIHU_CLIENT_SECRET || process.env.ZHIHU_ACCESS_SECRET || '';
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
    // 接口: POST https://openapi.zhihu.com/access_token
    const tokenRes = await fetch('https://openapi.zhihu.com/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        app_id: ZHIHU_APP_ID,
        app_key: ZHIHU_APP_KEY,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[知乎 OAuth] token 交换失败:', errText);
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenRes.json() as Record<string, unknown>;
    const accessToken = tokenData.access_token as string | undefined;

    if (!accessToken) {
      console.error('[知乎 OAuth] token 响应无 access_token:', JSON.stringify(tokenData));
      return NextResponse.redirect(new URL('/?error=no_access_token', request.url));
    }

    // 2. 获取用户信息
    // 接口: GET https://openapi.zhihu.com/user
    // Header: Authorization: Bearer {access_token}
    const meRes = await fetch('https://openapi.zhihu.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meData = (await meRes.json()) as Record<string, unknown>;

    // 知乎错误响应: { code: 401/403/404, data: "..." }
    if (meData.code !== undefined && meData.code !== 0 && meData.code !== 200) {
      console.error('[知乎 OAuth] 获取用户信息失败:', JSON.stringify(meData));
      return NextResponse.redirect(new URL('/?error=me_api_failed', request.url));
    }

    const user = {
      name: String(meData.fullname || meData.uid || '知乎用户'),
      avatar: String(meData.avatar_path || ''),
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
