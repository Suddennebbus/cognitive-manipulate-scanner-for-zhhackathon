'use client';

import { ScanInput } from './ScanInput';
import Image from 'next/image';

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Right side — LiuKanShan 3D character */}
      <div className="absolute right-[-5%] bottom-0 w-[72%] h-full pointer-events-none z-0">
        {/* Blue glow ring base */}
        <div
          className="absolute bottom-[5%] left-[30%] -translate-x-1/2 w-[55%] h-[12%] rounded-[50%]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,140,255,0.45) 0%, rgba(0,80,180,0.15) 40%, transparent 75%)',
            filter: 'blur(20px)',
          }}
        />
        {/* Bright inner ring */}
        <div
          className="absolute bottom-[6%] left-[30%] -translate-x-1/2 w-[35%] h-[3%] rounded-[50%]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,200,255,0.8) 0%, transparent 65%)',
            filter: 'blur(6px)',
          }}
        />

        <img
          src="/images/action1.png?v=2"
          alt="刘看山"
          className="absolute inset-0 w-full h-full object-contain object-right-bottom"
        />
      </div>

      {/* Content — positioned left-center */}
      <div className="relative z-10 min-h-screen flex items-center px-16 lg:px-24">
        <div className="max-w-2xl ml-[8%] mt-20">
          {/* Main title */}
          <h1 className="text-[60px] leading-[1.1] font-black tracking-wide mb-4">
            <span className="text-white">高赞之下，</span>
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(90deg, #22d3ee, #3b82f6)',
              }}
            >
              未必真实
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-[18px] text-cyan-400 tracking-[0.25em] text-center mb-12">
            你的防认知操控守护神
          </p>

          {/* Input box */}
          <ScanInput />

          {/* Disclaimer with decorative lines */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="w-6 h-px bg-cyan-400/30" />
            <p className="text-[12px] text-cyan-300/80 tracking-wide">
              AI 不判断对错，只分析表达如何影响你
            </p>
            <div className="w-6 h-px bg-cyan-400/30" />
          </div>
        </div>
      </div>

      {/* Bottom-left corner credits */}
      <div className="absolute bottom-6 left-16 lg:left-24 z-10">
        <p className="text-[9px] text-gray-700 tracking-wider">
          INSPIRED BY ZHIHU
        </p>
        <p className="text-[9px] text-gray-700 tracking-wider">
          DESIGNED BY ZHAOYJING TEAM
        </p>
      </div>
    </section>
  );
}
