'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/AppIcon';

interface HeaderProps {
  onOpenModal?: () => void;
}

const Header: React.FC<HeaderProps> = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#F2EDE3]/95 border-b border-amber-950/10 shadow-xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3">
          <Image
            src="/assets/images/logomf.png"
            alt="Madras Flavours Events Reading"
            width={180}
            height={64}
            className="object-contain filter drop-shadow-sm"
            style={{ maxHeight: '60px', width: 'auto' }}
            priority
          />
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-7 text-sm font-semibold">
          <a href="#menus" className="text-gray-800 hover:text-amber-700 transition-colors">Menus &amp; Packages</a>
          <a href="#faqs" className="text-gray-800 hover:text-amber-700 transition-colors">FAQs</a>
          <a href="/admin" className="text-amber-900 hover:text-black px-3.5 py-1.5 rounded-lg border border-amber-800/20 bg-amber-500/10 hover:bg-amber-500/20 transition-all text-xs font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
            Admin Portal
          </a>
          <a
            href="#book"
            className="text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #ED1C24 0%, #F5A623 100%)' }}
          >
            <span>Book Now</span>
            <Icon name="ArrowRightIcon" size={14} />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-gray-800 p-2 rounded-lg bg-black/5 hover:bg-black/10 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <Icon name={menuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={22} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden backdrop-blur-2xl bg-[#F2EDE3] border-t border-amber-950/10 px-6 py-5 flex flex-col gap-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <a href="#menus" className="text-gray-900 hover:text-amber-700 text-sm font-semibold py-1" onClick={() => setMenuOpen(false)}>Menus &amp; Packages</a>
          <a href="#faqs" className="text-gray-900 hover:text-amber-700 text-sm font-semibold py-1" onClick={() => setMenuOpen(false)}>FAQs</a>
          <a href="/admin" className="text-amber-900 hover:text-black text-sm font-bold py-1 flex items-center gap-2" onClick={() => setMenuOpen(false)}>
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            Admin Portal
          </a>
          <a
            href="#book"
            className="text-white font-semibold px-5 py-3 rounded-xl text-sm text-center shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #ED1C24 0%, #F5A623 100%)' }}
            onClick={() => setMenuOpen(false)}
          >
            Get a Quote / Book Now
          </a>
        </div>
      )}
    </nav>
  );
};

export default Header;