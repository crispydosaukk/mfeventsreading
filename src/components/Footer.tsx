import React from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/AppIcon';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#080503] border-t border-white/10 text-gray-400 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Col 1: Brand */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/images/logomf.png"
              alt="Madras Flavours Events Reading logo"
              width={170}
              height={62}
              className="object-contain filter drop-shadow-md"
              style={{ maxHeight: '62px', width: 'auto' }}
            />
          </div>
          <p className="text-sm text-gray-400 max-w-md leading-relaxed">
            Premier authentic South Indian pure vegetarian catering for weddings, corporate celebrations, birthday parties, and bespoke live dosa counters in Reading &amp; Berkshire.
          </p>
          <div className="flex items-center gap-3 text-xs text-amber-400 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Booking Enquiries Open for 2026 &amp; 2027 Events
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-widest text-white font-bold">Quick Navigation</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#menus" className="hover:text-amber-400 transition-colors">Catering Packages</a></li>
            <li><a href="#menus" className="hover:text-amber-400 transition-colors">Live Dosa Counter</a></li>
            <li><a href="#book" className="hover:text-amber-400 transition-colors">Book Now / Enquire</a></li>
            <li><a href="#faqs" className="hover:text-amber-400 transition-colors">Frequently Asked Questions</a></li>
          </ul>
        </div>

        {/* Col 3: Contact & Legal */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-widest text-white font-bold">Connect &amp; Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="mailto:madrasflavoursreading@gmail.com" className="hover:text-amber-400 transition-colors flex items-center gap-2"><Icon name="EnvelopeIcon" size={14} /> madrasflavoursreading@gmail.com</a></li>
            <li><a href="tel:+447507271890" className="hover:text-amber-400 transition-colors flex items-center gap-2"><Icon name="PhoneIcon" size={14} /> +44 7507 271890</a></li>
            <li><a href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</a></li>
            <li><a href="/admin" className="text-amber-500/80 hover:text-amber-400 transition-colors font-medium">Admin Staff Login →</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Madras Flavours Events Reading. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Crafted with authentic tradition &amp; visual excellence.
        </p>
      </div>
    </footer>
  );
};

export default Footer;