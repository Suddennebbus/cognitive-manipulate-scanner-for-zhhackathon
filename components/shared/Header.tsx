'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface HeaderProps {
  variant?: 'landing' | 'app';
}

interface ZhihuUser {
  name: string;
  avatar: string;
  headline?: string;
}

export function Header({ variant = 'app' }: HeaderProps) {
  const [user, setUser] = useState<ZhihuUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-7 py-5">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10"
            style={{ boxShadow: '0 0 12px rgba(0,200,255,0.2)' }}
          >
            <Image
              src="/images/icon.png"
              alt="照妖镜"
              fill
              className="object-cover"
              sizes="32px"
              priority
            />
          </div>
          <div>
            <div className="text-[15px] font-bold text-white tracking-wide">照妖镜</div>
            {variant === 'landing' ? (
              <div className="text-[10px] text-gray-500">Cognitive Manipulation Scanner v0.1</div>
            ) : (
              <div className="text-[10px] text-gray-500">CMS v0.1</div>
            )}
          </div>
        </Link>

        {/* 知乎登录状态 */}
        <div className="flex items-center gap-3">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  {user.avatar ? (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/10">
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        fill
                        className="object-cover"
                        sizes="24px"
                      />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-[10px] text-cyan-400">
                      {user.name.slice(0, 1)}
                    </div>
                  )}
                  <span className="text-xs text-gray-300 hidden sm:inline">{user.name}</span>
                  <a
                    href="/api/auth/logout"
                    className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors ml-1"
                  >
                    退出
                  </a>
                </div>
              ) : (
                <a
                  href="/api/auth/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-cyan-500/30 transition-all"
                >
                  <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.721 0C2.251 0 0 2.25 0 5.719V18.28C0 21.751 2.252 24 5.721 24h12.56C21.751 24 24 21.75 24 18.281V5.72C24 2.249 21.75 0 18.281 0zm1.964 4.078c-.271.73-.5 1.434-.68 2.11h4.587c.545-.006.445 1.168.445 1.168H6.283c-.036.46-.065.874-.065 1.227v.34h4.883c.596-.006.496 1.168.496 1.168H6.158c.034.655.123 1.05.246 1.304.189.396.546.593 1.072.593.775 0 1.558-.375 2.35-1.125.158-.15.325-.22.5-.21.256.014.472.15.648.405l.56.84c.166.25.174.51.024.78-.31.54-.815.996-1.515 1.368-.7.37-1.49.557-2.37.557-1.455 0-2.535-.44-3.24-1.32-.705-.88-1.058-2.19-1.058-3.93V7.315c0-1.28.22-2.35.66-3.21.44-.86 1.1-1.48 1.98-1.86.88-.38 1.97-.565 3.27-.555.16 0 .29.05.39.15.1.1.15.23.15.39v1.36c0 .23-.07.41-.21.54-.14.13-.32.18-.54.15-.8-.05-1.44.03-1.92.24-.48.21-.84.55-1.08 1.02h4.06c.16 0 .29.05.39.15.1.1.15.23.15.39v1.36c0 .23-.07.41-.21.54-.14.13-.32.18-.54.15h-2.2c.18.68.41 1.38.68 2.11.13.35.04.6-.26.76-.3.16-.59.11-.87-.15z" />
                  </svg>
                  <span className="text-xs text-gray-300">知乎登录</span>
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
