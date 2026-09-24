'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';
import { collection, addDoc, onSnapshot, doc } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import {
  NEW_PACKAGES as DEFAULT_NEW_PACKAGES,
  MENU_CATEGORIES as DEFAULT_MENU_CATEGORIES,
  LIVE_DOSA_PARTY_MENU as DEFAULT_LIVE_DOSA_PARTY_MENU,
  EXTRAS as DEFAULT_EXTRAS,
  TABLE_SERVICE as DEFAULT_TABLE_SERVICE,
  KIDS_PRICING as DEFAULT_KIDS_PRICING,
  STANDARD_SETUP as DEFAULT_STANDARD_SETUP,
  TERMS_AND_CONDITIONS as DEFAULT_TERMS_AND_CONDITIONS,
  DRY_HIRE_PRICES as DEFAULT_DRY_HIRE_PRICES,
} from '@/app/data/menuData';
import {
  DEFAULT_HERO_CONTENT,
  DEFAULT_FAQS,
  DEFAULT_HIGHLIGHT_METRICS,
  HeroContent,
  FaqItem,
  MetricItem,
} from '@/app/data/defaultContent';

const EVENT_TYPES = ['Wedding', 'Birthday', 'Corporate', 'Anniversary', 'Graduation', 'Other'];

type MenuTab = 'packages' | 'menu' | 'live';

export default function HomePage() {
  const [menus, setMenus] = useState({
    NEW_PACKAGES: DEFAULT_NEW_PACKAGES,
    MENU_CATEGORIES: DEFAULT_MENU_CATEGORIES,
    LIVE_DOSA_PARTY_MENU: DEFAULT_LIVE_DOSA_PARTY_MENU,
    EXTRAS: DEFAULT_EXTRAS,
    TABLE_SERVICE: DEFAULT_TABLE_SERVICE,
    KIDS_PRICING: DEFAULT_KIDS_PRICING,
    STANDARD_SETUP: DEFAULT_STANDARD_SETUP,
    TERMS_AND_CONDITIONS: DEFAULT_TERMS_AND_CONDITIONS,
    DRY_HIRE_PRICES: DEFAULT_DRY_HIRE_PRICES,
  });

  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  const [heroContent, setHeroContent] = useState<HeroContent>(DEFAULT_HERO_CONTENT);
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [highlightMetrics, setHighlightMetrics] = useState<MetricItem[]>(DEFAULT_HIGHLIGHT_METRICS);

  React.useEffect(() => {
    return onSnapshot(
      doc(db, 'site_data', 'highlight_metrics'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.metrics) && data.metrics.length > 0) {
            setHighlightMetrics(data.metrics);
          }
        }
      },
      (err) => console.warn("Firestore highlight_metrics notice:", err.message)
    );
  }, []);

  const [dataLoaded, setDataLoaded] = useState({ hero: false, menus: false });

  React.useEffect(() => {
    return onSnapshot(
      doc(db, 'site_data', 'hero_content'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHeroContent({
            badgeText: data.badgeText !== undefined ? data.badgeText : DEFAULT_HERO_CONTENT.badgeText,
            titleLine1: data.titleLine1 !== undefined ? data.titleLine1 : DEFAULT_HERO_CONTENT.titleLine1,
            titleHighlight: data.titleHighlight !== undefined ? data.titleHighlight : DEFAULT_HERO_CONTENT.titleHighlight,
            subtitle: data.subtitle !== undefined ? data.subtitle : DEFAULT_HERO_CONTENT.subtitle,
            tags: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : DEFAULT_HERO_CONTENT.tags,
            primaryBtnText: data.primaryBtnText !== undefined ? data.primaryBtnText : DEFAULT_HERO_CONTENT.primaryBtnText,
            secondaryBtnText: data.secondaryBtnText !== undefined ? data.secondaryBtnText : DEFAULT_HERO_CONTENT.secondaryBtnText,
          });
        }
        setDataLoaded(prev => ({ ...prev, hero: true }));
      },
      (err) => {
        console.warn("Firestore hero_content notice:", err.message);
        setDataLoaded(prev => ({ ...prev, hero: true }));
      }
    );
  }, []);

  React.useEffect(() => {
    return onSnapshot(
      doc(db, 'site_data', 'faqs'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.list) && data.list.length > 0) {
            setFaqs(data.list);
          }
        }
      },
      (err) => console.warn("Firestore faqs notice:", err.message)
    );
  }, []);

  React.useEffect(() => {
    return onSnapshot(doc(db, 'site_data', 'menus'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMenus({
          NEW_PACKAGES: data.NEW_PACKAGES || DEFAULT_NEW_PACKAGES,
          MENU_CATEGORIES: data.MENU_CATEGORIES || DEFAULT_MENU_CATEGORIES,
          LIVE_DOSA_PARTY_MENU: data.LIVE_DOSA_PARTY_MENU || DEFAULT_LIVE_DOSA_PARTY_MENU,
          EXTRAS: data.EXTRAS || DEFAULT_EXTRAS,
          TABLE_SERVICE: data.TABLE_SERVICE || DEFAULT_TABLE_SERVICE,
          KIDS_PRICING: data.KIDS_PRICING || DEFAULT_KIDS_PRICING,
          STANDARD_SETUP: data.STANDARD_SETUP || DEFAULT_STANDARD_SETUP,
          TERMS_AND_CONDITIONS: data.TERMS_AND_CONDITIONS || DEFAULT_TERMS_AND_CONDITIONS,
          DRY_HIRE_PRICES: data.DRY_HIRE_PRICES || DEFAULT_DRY_HIRE_PRICES,
        });
      }
      setDataLoaded(prev => ({ ...prev, menus: true }));
    }, (err) => {
      console.warn("Firestore menus notice:", err.message);
      setDataLoaded(prev => ({ ...prev, menus: true }));
    });
  }, []);

  const [pricingDetails, setPricingDetails] = useState({
    depositPercentage: 30,
  });

  React.useEffect(() => {
    return onSnapshot(doc(db, 'site_data', 'pricing_details'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPricingDetails({
          depositPercentage: data.depositPercentage !== undefined ? data.depositPercentage : 30,
        });
      }
    });
  }, []);

  const [formSettings, setFormSettings] = useState({
    timeSlots: ['Lunch (12:00pm - 4:00pm)', 'Dinner (6:00pm - 11:30pm)'],
    partyHallTimeSlots: ['Lunch (12:00pm - 4:00pm)', 'Dinner (6:00pm - 11:30pm)'],
    outdoorTimeSlots: ['Lunch (12:00pm - 4:00pm)', 'Dinner (6:00pm - 11:30pm)']
  });

  React.useEffect(() => {
    return onSnapshot(doc(db, 'site_data', 'form_settings'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormSettings({
          timeSlots: data.timeSlots || ['Lunch (12:00pm - 4:00pm)', 'Dinner (6:00pm - 11:30pm)'],
          partyHallTimeSlots: data.partyHallTimeSlots || data.timeSlots || ['Lunch (12:00pm - 4:00pm)', 'Dinner (6:00pm - 11:30pm)'],
          outdoorTimeSlots: data.outdoorTimeSlots || data.timeSlots || ['Lunch (12:00pm - 4:00pm)', 'Dinner (6:00pm - 11:30pm)']
        });
      }
    });
  }, []);

  const [minGuests, setMinGuests] = useState(30);
  React.useEffect(() => {
    return onSnapshot(doc(db, 'site_data', 'venue_details'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMinGuests(Number(data.minGuests) || 30);
      }
    });
  }, []);

  React.useEffect(() => {
    return onSnapshot(collection(db, 'blocked_dates'), (snapshot) => {
      const dates = snapshot.docs.map(doc => doc.id);
      setBlockedDates(dates);
    });
  }, []);

  const { NEW_PACKAGES, MENU_CATEGORIES, LIVE_DOSA_PARTY_MENU, EXTRAS } = menus;

  const [bookingForm, setBookingForm] = useState({
    name: '', email: '', phone: '', eventType: '', serviceType: '', date: '', timeOfDay: '', guests: '', message: '', selectedPackage: '', postCode: '', address: ''
  });

  const handleEnquireNow = (packageName: string) => {
    setBookingForm(prev => ({ ...prev, selectedPackage: packageName }));
    const el = document.getElementById('book');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const [submitted, setSubmitted] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState<MenuTab>('packages');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customHomeAlert, setCustomHomeAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [phoneError, setPhoneError] = useState('');

  const validateUKPhone = (digits: string) => {
    const cleaned = digits.replace(/\s/g, '');
    if (cleaned === '') return true;
    if (/[^\d]/.test(cleaned)) return false;
    return /^(07\d{9}|7\d{9})$/.test(cleaned);
  };

  const handlePhoneChange = (digits: string) => {
    setBookingForm({ ...bookingForm, phone: digits });
    if (digits && !validateUKPhone(digits)) {
      setPhoneError('Enter a valid UK number (e.g. 07700 900000)');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingForm.phone && !validateUKPhone(bookingForm.phone)) {
      setPhoneError('Enter a valid UK number (e.g. 07700 900000)');
      return;
    }
    setIsSubmitting(true);
    if (blockedDates.includes(bookingForm.date)) {
      setCustomHomeAlert({
        message: "This date is unfortunately fully booked or unavailable. Please choose another date.",
        type: 'error'
      });
      setIsSubmitting(false);
      return;
    }
    try {
      const fullPhone = bookingForm.phone ? `+44${bookingForm.phone.replace(/^0/, '').replace(/\s/g, '')}` : '';
      const guestCount = Number(bookingForm.guests) || 0;
      
      if (guestCount < minGuests) {
        setCustomHomeAlert({
          message: `The minimum number of guests required is ${minGuests}. We cannot accept orders below this amount.`,
          type: 'error'
        });
        setIsSubmitting(false);
        return;
      }
      
      const selectedPkg = NEW_PACKAGES.find(p => p.name === bookingForm.selectedPackage);
      const isLiveDosa = bookingForm.selectedPackage === 'Outdoor Live Dosa Party' || bookingForm.selectedPackage.includes('Live Dosa');
      let selectedExtra = null;
      if (!selectedPkg && !isLiveDosa) {
         selectedExtra = EXTRAS?.find((e: any) => e.name === bookingForm.selectedPackage);
      }
      
      let baseAmount = 0;
      if (selectedPkg) {
        baseAmount = selectedPkg.pricePerPerson * guestCount;
      } else if (isLiveDosa) {
        let dosaPrice = 11.00;
        if (bookingForm.date) {
          const d = new Date(bookingForm.date);
          const day = d.getDay();
          if (day === 0 || day === 6) {
            dosaPrice = 12.00;
          }
        }
        baseAmount = dosaPrice * guestCount;
      } else if (selectedExtra) {
        baseAmount = selectedExtra.price;
      }
      
      const deposit = baseAmount > 0 ? Math.min(baseAmount, pricingDetails.depositPercentage) : 0;
      
      const docRef = await addDoc(collection(db, 'booking_requests'), {
        name: bookingForm.name,
        email: bookingForm.email,
        phone: fullPhone,
        eventType: bookingForm.eventType,
        serviceType: bookingForm.serviceType,
        date: bookingForm.date,
        timeOfDay: bookingForm.timeOfDay,
        guests: guestCount,
        message: bookingForm.message,
        package: bookingForm.selectedPackage || 'Not Selected',
        postCode: bookingForm.postCode,
        address: bookingForm.address,
        baseAmount,
        deposit,
        extraCharges: [],
        createdAt: new Date().toISOString()
      });

      try {
        const emailRes = await fetch('/api/send-enquiry-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: docRef.id,
            name: bookingForm.name,
            email: bookingForm.email,
            phone: fullPhone,
            eventType: bookingForm.eventType,
            serviceType: bookingForm.serviceType,
            date: bookingForm.date,
            timeOfDay: bookingForm.timeOfDay,
            guests: guestCount,
            message: bookingForm.message,
            selectedPackage: bookingForm.selectedPackage || 'Not Selected',
            postCode: bookingForm.postCode,
            address: bookingForm.address,
            baseAmount,
            deposit,
          }),
        });
        const emailData = await emailRes.json().catch(() => null);
        if (emailData && !emailData.success) {
          console.warn("Notification email dispatch notice:", emailData.errors || emailData.error || emailData.message);
        }
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
      }

      setSubmitted(true);
      setPhoneError('');
      setBookingForm({ name: '', email: '', phone: '', eventType: '', serviceType: '', date: '', timeOfDay: '', guests: '', message: '', selectedPackage: '', postCode: '', address: '' });
    } catch (error: any) {
      console.error("Error submitting request: ", error);
      setCustomHomeAlert({
        message: "Error submitting: " + (error?.message || "Unknown error"),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSection(prev => prev === key ? null : key);
  };

  const isReady = dataLoaded.hero && dataLoaded.menus;
  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#F2EDE3] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
        <p className="text-amber-800 font-medium animate-pulse text-sm">Loading Madras Flavours...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2EDE3] text-[#1A120B] overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-900">
      <Header onOpenModal={() => {}} />

      {/* ─── HERO WITH WARM HERITAGE SANDSTONE BACKGROUND (#F2EDE3) ─── */}
      <section className="relative pt-32 pb-20 px-6 min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#F2EDE3]">
        {/* Subtle warm ambient glows */}
        <div className="absolute top-10 right-1/4 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-red-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-6">

          {/* ── Left Column: Compelling Narrative ── */}
          <div className="flex-1 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-300 bg-amber-100/90 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-950">
                {heroContent.badgeText}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.12]">
              {heroContent.titleLine1}
              {heroContent.titleHighlight ? (
                <>
                  {' '}
                  <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-amber-600 to-amber-700 font-display">
                    {heroContent.titleHighlight}
                  </span>
                </>
              ) : null}
            </h1>

            <p className="text-base sm:text-lg text-gray-700 max-w-2xl lg:mx-0 mx-auto leading-relaxed font-medium">
              {heroContent.subtitle}
            </p>

            {/* Value Highlights Pill Tags */}
            <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start pt-2">
              {heroContent.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/90 border border-amber-200/80 text-gray-800 shadow-2xs flex items-center gap-1.5"
                >
                  <span className="text-amber-600">{tag.icon}</span> {tag.text}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-3">
              <a
                href="#menus"
                className="text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-md hover:shadow-amber-500/25 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #ED1C24 0%, #F5A623 100%)' }}
              >
                <span>{heroContent.primaryBtnText}</span>
                <Icon name="ArrowDownIcon" size={16} />
              </a>
              <a
                href="#book"
                className="bg-white border border-gray-300 text-gray-900 hover:border-amber-500 font-semibold px-8 py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{heroContent.secondaryBtnText}</span>
                <Icon name="CalendarDaysIcon" size={16} />
              </a>
            </div>
          </div>

          {/* ── Right Column: High-Visibility Booking Form ── */}
          <div id="book" className="w-full lg:w-[490px] flex-shrink-0">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-amber-200/90">
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-2">
                  <span>Request an Event Booking</span>
                </h2>
                <p className="text-xs text-gray-600 mt-1 font-medium">
                  Fill in your details below for Madras Flavours Events Reading.
                </p>
              </div>

              {customHomeAlert && (
                <div className={`mb-4 p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${customHomeAlert.type === 'error' ? 'bg-red-950/70 border-red-500/40 text-red-200' : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'}`}>
                  <Icon name={customHomeAlert.type === 'error' ? 'ExclamationTriangleIcon' : 'CheckCircleIcon'} size={18} />
                  <span>{customHomeAlert.message}</span>
                </div>
              )}

              {submitted ? (
                <div className="text-center py-10 rounded-2xl border border-amber-500/30 bg-amber-950/30 backdrop-blur-md">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <Icon name="CheckIcon" size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Booking Enquiry Received!</h3>
                  <p className="text-xs text-amber-200/80 max-w-xs mx-auto mb-6 leading-relaxed">
                    Thank you for choosing Madras Flavours Events Reading. Our catering team will contact you within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-md cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #ED1C24 0%, #F5A623 100%)' }}
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5 relative z-10">
                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={bookingForm.name}
                        onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                        className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder-gray-400"
                        placeholder="e.g. Ramesh Patel"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">UK Phone *</label>
                      <input
                        type="tel"
                        required
                        value={bookingForm.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className={`w-full bg-white text-gray-900 border rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none transition-all placeholder-gray-400 ${phoneError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'}`}
                        placeholder="07700 900000"
                      />
                      {phoneError && <span className="text-[11px] text-red-400 mt-1 block">{phoneError}</span>}
                    </div>
                  </div>

                  {/* Email & Event Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                        className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder-gray-400"
                        placeholder="ramesh@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Event Type *</label>
                      <select
                        required
                        value={bookingForm.eventType}
                        onChange={(e) => setBookingForm({ ...bookingForm, eventType: e.target.value })}
                        className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      >
                        <option value="">Select type</option>
                        {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Service Type */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Service Type *</label>
                    <select
                      required
                      value={bookingForm.serviceType}
                      onChange={(e) => setBookingForm({ ...bookingForm, serviceType: e.target.value })}
                      className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    >
                      <option value="">Select Service Type</option>
                      <option value="Outdoor Catering">Outdoor Catering (At your home / venue)</option>
                      <option value="Party Hall Booking">In-House Party Hall Booking (Reading)</option>
                    </select>
                  </div>

                  {/* Address & Postcode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Event Address *</label>
                      <input
                        type="text"
                        required
                        value={bookingForm.address}
                        onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                        className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder-gray-400"
                        placeholder="Street / Venue address"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Event Postcode *</label>
                      <input
                        type="text"
                        required
                        value={bookingForm.postCode}
                        onChange={(e) => setBookingForm({ ...bookingForm, postCode: e.target.value })}
                        className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder-gray-400 uppercase"
                        placeholder="e.g. RG1 1AA"
                      />
                    </div>
                  </div>

                  {/* Preferred Package */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                      <span>Preferred Catering Package</span>
                      {bookingForm.selectedPackage && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Selected
                        </span>
                      )}
                    </label>
                    <select
                      value={bookingForm.selectedPackage}
                      onChange={(e) => setBookingForm({ ...bookingForm, selectedPackage: e.target.value })}
                      className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    >
                      <option value="">No specific package – help me choose</option>
                      <optgroup label="── Catering Packages ──">
                        {NEW_PACKAGES.map((pkg) => (
                          <option key={pkg.id} value={pkg.name}>
                            {pkg.name} — £{pkg.pricePerPerson}/guest
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="── Live Dosa Experience ──">
                        <option value="Outdoor Live Dosa Party">Outdoor Live Dosa Party Counter</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Date, Time & Guest Count */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Date *</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                        className={`w-full bg-white text-gray-900 border rounded-xl px-2.5 py-2.5 text-xs font-medium focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all ${blockedDates.includes(bookingForm.date) ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                      />
                      {blockedDates.includes(bookingForm.date) && (
                        <span className="text-red-400 text-[10px] font-bold mt-1 block">Date Unavailable</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Time Slot *</label>
                      <select
                        required
                        value={bookingForm.timeOfDay}
                        onChange={(e) => setBookingForm({ ...bookingForm, timeOfDay: e.target.value })}
                        className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-2 py-2.5 text-xs font-medium focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      >
                        <option value="">Select Time</option>
                        {formSettings.timeSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Guests * (Min {minGuests})</label>
                      <input
                        type="number"
                        required
                        min={minGuests}
                        max={500}
                        value={bookingForm.guests}
                        onChange={(e) => setBookingForm({ ...bookingForm, guests: e.target.value })}
                        className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder-gray-400"
                        placeholder={`Min ${minGuests}`}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Special Preferences / Dietary Notes</label>
                    <textarea
                      rows={2}
                      value={bookingForm.message}
                      onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                      className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder-gray-400 resize-none"
                      placeholder="e.g. Jain dietary preferences, additional dessert stations, spice level..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed text-sm"
                    style={{ background: 'linear-gradient(135deg, #ED1C24 0%, #F5A623 100%)' }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Processing Enquiry...
                      </span>
                    ) : (
                      <>
                        <Icon name="CalendarDaysIcon" size={17} />
                        <span>Submit Booking Enquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ─── HIGHLIGHT METRICS STRIP ─── */}
      <section className="relative z-20 py-8 px-6 border-y border-amber-900/10 bg-[#E8E1D5]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {highlightMetrics.map((stat, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-white/90 border border-amber-200/70 shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-amber-600 to-amber-700">{stat.value}</div>
              <div className="text-xs text-gray-800 font-bold mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>


      {/* ─── MENUS & PACKAGES SHOWCASE ─── */}
      <section id="menus" className="py-20 px-6 bg-[#F2EDE3] border-t border-amber-900/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-900 bg-amber-100 px-4 py-1.5 rounded-full border border-amber-300">
              Transparent Pricing &amp; Menus
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Our Catering Packages</h2>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed font-medium">
              Every package is designed to delight your guests with genuine South Indian gourmet flavours. Select any package to pre-fill your booking enquiry.
            </p>
          </div>

          {/* Interactive Tab Switcher */}
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {([
              { id: 'packages', label: '🎁 Packages' },
              { id: 'menu', label: '🍛 Menu Items' },
              { id: 'live', label: '🥞 Live Dosa Counter' },
            ] as { id: MenuTab; label: string }[]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMenuTab(tab.id)}
                className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeMenuTab === tab.id ? 'text-white shadow-lg scale-105' : 'bg-white border border-amber-200 text-gray-700 hover:text-gray-950 hover:border-amber-400 shadow-xs'}`}
                style={activeMenuTab === tab.id ? { background: 'linear-gradient(135deg, #ED1C24 0%, #F5A623 100%)' } : {}}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: PACKAGES */}
          {activeMenuTab === 'packages' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {NEW_PACKAGES.map((pkg: any) => (
                <div
                  key={pkg.id}
                  className="bg-white border border-amber-200/80 rounded-3xl p-7 flex flex-col justify-between hover:border-amber-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative group shadow-md text-gray-900"
                >
                  {pkg.tag && (
                    <div className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-red-600/90 text-white shadow-md">
                      {pkg.tag}
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-red-500">£{pkg.pricePerPerson}</span>
                      <span className="text-xs text-gray-600 font-semibold">/ person</span>
                      <span className="text-xs text-amber-800 font-bold ml-auto">{pkg.guestLabel}</span>
                    </div>

                    <div className="w-full h-px bg-gray-200 my-4" />

                    <ul className="space-y-2.5 mb-6">
                      {(Array.isArray(pkg.items) ? pkg.items : typeof pkg.items === 'string' ? (pkg.items as string).split('\n').filter(Boolean) : []).map((item: string, i: number) => (
                        <li key={i} className="text-sm text-gray-800 flex items-start gap-2.5 font-medium">
                          <span className="text-emerald-600 font-bold text-sm leading-none mt-1">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    {pkg.complimentary && (
                      <div className="text-xs text-amber-950 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 leading-relaxed font-semibold">
                        🎁 <span className="font-semibold">{pkg.complimentary}</span>
                      </div>
                    )}

                    <button
                      onClick={() => handleEnquireNow(pkg.name)}
                      className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #ED1C24 0%, #F5A623 100%)' }}
                    >
                      <span>Choose {pkg.name}</span>
                      <Icon name="ArrowRightIcon" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: DETAILED MENU ITEMS */}
          {activeMenuTab === 'menu' && (
            <div className="space-y-10">
              <div className="text-center max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-2">A La Carte Dish Selection</h3>
                <p className="text-xs text-gray-700 font-medium">
                  Mix and match your course selections from our authentic Tamil &amp; South Indian vegetarian categories.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'STATERS', items: MENU_CATEGORIES.staters, icon: '🍢' },
                  { title: 'VEG MAINS', items: MENU_CATEGORIES.vegMains, icon: '🥦' },
                  { title: 'PANEER MAINS', items: MENU_CATEGORIES.paneerMains, icon: '🧀' },
                  { title: 'RICE & NOODLES', items: MENU_CATEGORIES.riceAndNoodles, icon: '🍚' },
                  { title: 'BREADS', items: MENU_CATEGORIES.breads, icon: '🫓' },
                  { title: 'DHAL', items: MENU_CATEGORIES.dhal, icon: '🍲' },
                  { title: 'DESSERT', items: MENU_CATEGORIES.dessert, icon: '🍨' },
                ].map((category) => (
                  <div key={category.title} className="bg-white rounded-3xl border border-amber-200 overflow-hidden shadow-md hover:border-amber-400 transition-colors">
                    <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between bg-gradient-to-r from-amber-100 to-red-50">
                      <h4 className="font-bold text-sm tracking-wider text-amber-950 uppercase flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.title}</span>
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-amber-200 text-gray-800">
                        {category.items.length} items
                      </span>
                    </div>
                    <ul className="p-5 space-y-2.5 max-h-72 overflow-y-auto">
                      {category.items.map((item: string, idx: number) => (
                        <li key={idx} className="text-xs text-gray-800 font-medium flex items-center gap-2.5 py-1.5 border-b border-gray-100 last:border-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE DOSA COUNTER */}
          {activeMenuTab === 'live' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl border-2 border-amber-300 p-8 shadow-xl relative overflow-hidden">
                <div className="text-center max-w-xl mx-auto mb-8 space-y-3">
                  <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
                    Live Chef Station
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Outdoor Live Dosa Party Counter</h3>
                  <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-amber-300 pt-1">
                    {LIVE_DOSA_PARTY_MENU.pricing.map((price: string, i: number) => (
                      <span key={i} className="px-4 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold">
                        {price}
                      </span>
                    ))}
                    <span className="px-4 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold">
                      Gazebo Hire (Flat Fee): £100.00
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {LIVE_DOSA_PARTY_MENU.items.map((item: string, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#F2EDE3]/70 border border-amber-200 flex items-center gap-3">
                      <span className="text-xl">🥞</span>
                      <span className="text-sm font-bold text-gray-900">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-amber-100/90 border border-amber-300 text-center text-xs text-amber-950 font-bold mb-6">
                  ⏱️ MINIMUM 2 HOURS CHEF SERVICE INCLUDED
                </div>

                <div className="text-center">
                  <button
                    onClick={() => handleEnquireNow('Outdoor Live Dosa Party')}
                    className="px-8 py-3.5 rounded-xl text-white font-bold text-sm transition-all shadow-xl hover:scale-[1.02] cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #ED1C24 0%, #F5A623 100%)' }}
                  >
                    Enquire Live Dosa Party
                  </button>
                </div>
              </div>

              {/* Extras */}
              <div className="bg-white rounded-3xl border border-amber-200/80 p-7 shadow-md">
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-900 mb-4 text-center">
                  Popular Event Add-Ons &amp; Extras
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {EXTRAS.map((extra: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#F2EDE3]/60 border border-amber-200/80 flex items-center justify-between text-gray-900 font-medium">
                      <span className="font-medium">{extra.name}</span>
                      <span className="font-bold text-amber-400">£{Number(extra.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ─── FAQ SECTION ─── */}
      <section id="faqs" className="py-20 px-6 bg-[#EAE4D8] border-t border-amber-900/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-gray-700 text-sm max-w-xl mx-auto font-medium">
              Everything you need to know about our outdoor live dosa catering and booking policies in Reading.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = expandedSection === `faq-${index}`;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-amber-200/80 bg-white overflow-hidden transition-all duration-200 shadow-xs hover:border-amber-400"
                >
                  <button
                    onClick={() => toggleSection(`faq-${index}`)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-gray-900 hover:text-amber-700 transition-colors cursor-pointer text-sm sm:text-base"
                  >
                    <span>{faq.question}</span>
                    <span className={`transform transition-transform duration-200 text-amber-400 flex-shrink-0 ml-4 ${isOpen ? 'rotate-180 text-red-500' : ''}`}>
                      <Icon name="ChevronDownIcon" size={18} />
                    </span>
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-96 border-t border-white/10' : 'max-h-0'
                    }`}
                  >
                    <div className="px-6 py-5 text-sm text-gray-700 leading-relaxed bg-amber-50/30 border-t border-amber-100">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />

      {/* ─── CUSTOM ALERT MODAL ─── */}
      {customHomeAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm border border-amber-300 flex flex-col items-center text-center text-gray-900">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${customHomeAlert.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              <Icon name={customHomeAlert.type === 'success' ? 'CheckIcon' : 'ExclamationTriangleIcon'} size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{customHomeAlert.type === 'success' ? 'Success' : 'Notice'}</h3>
            <p className="text-sm text-gray-700 mb-6 leading-relaxed font-medium">{customHomeAlert.message}</p>
            <button
              onClick={() => setCustomHomeAlert(null)}
              className="px-8 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg cursor-pointer hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #ED1C24 0%, #F5A623 100%)' }}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}