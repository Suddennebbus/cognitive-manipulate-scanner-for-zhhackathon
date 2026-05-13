'use client';

import Image from 'next/image';
import Link from 'next/link';

interface HeaderProps {
  variant?: 'landing' | 'app';
}

export function Header({ variant = 'app' }: HeaderProps) {
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
      </div>
    </header>
  );
}
