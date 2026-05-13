import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete('zhihu_token');
  cookieStore.delete('zhihu_user');
  return NextResponse.redirect(new URL('/', 'https://sudden-cms.vercel.app'));
}
