import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('zhihu_user');

  if (!userCookie?.value) {
    return NextResponse.json({ loggedIn: false });
  }

  try {
    const user = JSON.parse(userCookie.value);
    return NextResponse.json({ loggedIn: true, user });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}
