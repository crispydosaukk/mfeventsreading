'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  DEFAULT_HERO_CONTENT,
  DEFAULT_FAQS,
  DEFAULT_HIGHLIGHT_METRICS,
  HeroContent,
  FaqItem,
  MetricItem,
} from '@/app/data/defaultContent';

interface WebsiteContentUIProps {
  onNotify?: (msg: string, type: 'success' | 'error') => void;
}

export default function WebsiteContentUI({ onNotify }: WebsiteContentUIProps) {
  const [activeTab, setActiveTab] = useState<'hero' | 'metrics' | 'faqs'>('hero');

  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO_CONTENT);
  const [isSavingHero, setIsSavingHero] = useState(false);

  const [metrics, setMetrics] = useState<MetricItem[]>(DEFAULT_HIGHLIGHT_METRICS);
  const [isSavingMetrics, setIsSavingMetrics] = useState(false);

  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [isSavingFaqs, setIsSavingFaqs] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    const unsubHero = onSnapshot(
      doc(db, 'site_data', 'hero_content'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setHero({
            badgeText: data.badgeText !== undefined ? data.badgeText : DEFAULT_HERO_CONTENT.badgeText,
            titleLine1: data.titleLine1 !== undefined ? data.titleLine1 : DEFAULT_HERO_CONTENT.titleLine1,
            titleHighlight: data.titleHighlight !== undefined ? data.titleHighlight : DEFAULT_HERO_CONTENT.titleHighlight,
            subtitle: data.subtitle !== undefined ? data.subtitle : DEFAULT_HERO_CONTENT.subtitle,
            tags: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : DEFAULT_HERO_CONTENT.tags,
            primaryBtnText: data.primaryBtnText !== undefined ? data.primaryBtnText : DEFAULT_HERO_CONTENT.primaryBtnText,
            secondaryBtnText: data.secondaryBtnText !== undefined ? data.secondaryBtnText : DEFAULT_HERO_CONTENT.secondaryBtnText,
          });
        }
      },
      (err) => console.warn('WebsiteContentUI hero notice:', err.message)
    );

    const unsubFaqs = onSnapshot(
      doc(db, 'site_data', 'faqs'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.list) && data.list.length > 0) {
            setFaqs(data.list);
          }
        }
      },
      (err) => console.warn('WebsiteContentUI faqs notice:', err.message)
    );

    const unsubMetrics = onSnapshot(
      doc(db, 'site_data', 'highlight_metrics'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.metrics) && data.metrics.length > 0) {
            setMetrics(data.metrics);
          }
        }
      },
      (err) => console.warn('WebsiteContentUI highlight_metrics notice:', err.message)
    );

    return () => {
      unsubHero();
      unsubMetrics();
      unsubFaqs();
    };
  }, []);

  const handleSaveHero = async () => {
    setIsSavingHero(true);
    try {
      await setDoc(doc(db, 'site_data', 'hero_content'), hero, { merge: true });
      if (onNotify) {
        onNotify('Hero section content updated successfully!', 'success');
      } else {
        alert('Hero section content updated successfully!');
      }
    } catch (err: any) {
      console.error('Error saving hero content:', err);
      if (onNotify) {
        onNotify('Failed to save hero content: ' + (err.message || String(err)), 'error');
      } else {
        alert('Failed to save hero content: ' + (err.message || String(err)));
      }
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleSaveFaqs = async () => {
    setIsSavingFaqs(true);
    try {
      await setDoc(doc(db, 'site_data', 'faqs'), { list: faqs }, { merge: true });
      if (onNotify) {
        onNotify('FAQs updated successfully on the website!', 'success');
      } else {
        alert('FAQs updated successfully!');
      }
    } catch (err: any) {
      console.error('Error saving FAQs:', err);
      if (onNotify) {
        onNotify('Failed to save FAQs: ' + (err.message || String(err)), 'error');
      } else {
        alert('Failed to save FAQs: ' + (err.message || String(err)));
      }
    } finally {
      setIsSavingFaqs(false);
    }
  };

  const handleAddTag = () => {
    setHero((prev) => ({
      ...prev,
      tags: [...prev.tags, { icon: '✨', text: 'New Feature' }],
    }));
  };

  const handleUpdateTag = (idx: number, field: 'icon' | 'text', val: string) => {
    setHero((prev) => {
      const updated = [...prev.tags];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, tags: updated };
    });
  };

  const handleDeleteTag = (idx: number) => {
    setHero((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== idx),
    }));
  };

  const handleAddFaq = () => {
    setFaqs((prev) => [
      ...prev,
      { question: 'New Question?', answer: 'Enter answer details here...' },
    ]);
  };

  const handleUpdateFaq = (idx: number, field: 'question' | 'answer', val: string) => {
    setFaqs((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const handleDeleteFaq = (idx: number) => {
    setConfirmModal({
      title: 'Delete FAQ Item',
      message: 'Are you sure you want to delete this FAQ item?',
      confirmLabel: 'Delete',
      isDanger: true,
      onConfirm: () => {
        setFaqs((prev) => prev.filter((_, i) => i !== idx));
        setConfirmModal(null);
      },
    });
  };

  const handleResetFaqs = () => {
    setConfirmModal({
      title: 'Reset All FAQs',
      message: 'Are you sure you want to reset all FAQs back to their default initial values?',
      confirmLabel: 'Reset Defaults',
      isDanger: true,
      onConfirm: () => {
        setFaqs(DEFAULT_FAQS);
        setConfirmModal(null);
      },
    });
  };

  const handleResetHero = () => {
    setConfirmModal({
      title: 'Reset Hero Content',
      message: 'Are you sure you want to reset hero content back to default values?',
      confirmLabel: 'Reset Defaults',
      isDanger: true,
      onConfirm: () => {
        setHero(DEFAULT_HERO_CONTENT);
        setConfirmModal(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Icon name="DocumentTextIcon" size={22} className="text-[#ED1C24]" />
            Website Dynamic Content Manager
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Update your homepage Hero section and FAQs in real-time for Madras Flavours Events Reading.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('hero')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'hero'
                ? 'bg-white text-gray-900 shadow-sm font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>✨ Hero Section</span>
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'metrics'
                ? 'bg-white text-gray-900 shadow-sm font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>📊 Highlight Metrics</span>
            <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {metrics.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'faqs'
                ? 'bg-white text-gray-900 shadow-sm font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>❓ FAQs Manager</span>
            <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {faqs.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'hero' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span>Edit Hero Text &amp; CTAs</span>
              </h3>
              <button
                onClick={handleResetHero}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
                title="Reset to default text"
              >
                <Icon name="ArrowPathIcon" size={13} />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Top Highlight Badge Text
                </label>
                <input
                  type="text"
                  value={hero.badgeText}
                  onChange={(e) => setHero({ ...hero, badgeText: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-500 bg-white font-medium shadow-2xs"
                  placeholder="e.g. 100% PURE VEGETARIAN CATERING • READING & BERKSHIRE"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Main Headline (Line 1)
                </label>
                <input
                  type="text"
                  value={hero.titleLine1}
                  onChange={(e) => setHero({ ...hero, titleLine1: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-500 bg-white font-medium shadow-2xs"
                  placeholder="e.g. Elevate Your Celebration With Authentic"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Highlighted Brand Title (Gold Gradient)
                </label>
                <input
                  type="text"
                  value={hero.titleHighlight}
                  onChange={(e) => setHero({ ...hero, titleHighlight: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-500 bg-white font-medium shadow-2xs"
                  placeholder="e.g. Madras Flavours Events Reading"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Subheading Description
                </label>
                <textarea
                  rows={3}
                  value={hero.subtitle}
                  onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-3.5 text-sm text-gray-900 focus:outline-none focus:border-amber-500 bg-white font-medium shadow-2xs resize-none"
                  placeholder="Brief story highlighting heritage, live counters, guest capacity..."
                />
              </div>

              {/* Tags Editor */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Feature Highlights / Pill Tags ({hero.tags.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <Icon name="PlusCircleIcon" size={15} />
                    <span>Add Tag</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {hero.tags.map((tag, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                      <input
                        type="text"
                        value={tag.icon}
                        onChange={(e) => handleUpdateTag(idx, 'icon', e.target.value)}
                        className="w-12 text-center border border-gray-300 rounded-lg py-1.5 text-base bg-white text-gray-900"
                        title="Emoji / Icon"
                      />
                      <input
                        type="text"
                        value={tag.text}
                        onChange={(e) => handleUpdateTag(idx, 'text', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 bg-white font-medium"
                        placeholder="Tag label..."
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteTag(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove tag"
                      >
                        <Icon name="TrashIcon" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Primary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={hero.primaryBtnText}
                    onChange={(e) => setHero({ ...hero, primaryBtnText: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Secondary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={hero.secondaryBtnText}
                    onChange={(e) => setHero({ ...hero, secondaryBtnText: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none bg-white font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={handleSaveHero}
                disabled={isSavingHero}
                className="px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #ED1C24 0%, #F5A623 100%)' }}
              >
                {isSavingHero ? (
                  <>
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                    <span>Saving Hero...</span>
                  </>
                ) : (
                  <>
                    <Icon name="CloudArrowUpIcon" size={16} />
                    <span>Publish Hero Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#1C1208] rounded-2xl p-6 border border-amber-500/20 text-white shadow-xl relative overflow-hidden">
              <div className="text-[10px] font-bold tracking-wider uppercase text-amber-400/80 mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Hero Preview</span>
              </div>

              <div className="space-y-4">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {hero.badgeText || 'HIGHLIGHT BADGE'}
                </span>

                <h1 className="text-2xl font-extrabold text-white leading-tight">
                  {hero.titleLine1}{' '}
                  {hero.titleHighlight ? (
                    <span className="text-amber-400">{hero.titleHighlight}</span>
                  ) : null}
                </h1>

                <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                  {hero.subtitle}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {hero.tags.map((t, i) => (
                    <span key={i} className="text-[10px] px-2.5 py-1 rounded-lg bg-white/10 text-gray-200 border border-white/10">
                      {t.icon} {t.text}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <span className="text-[11px] font-bold px-4 py-2 rounded-lg text-white" style={{ background: 'linear-gradient(135deg, #ED1C24, #F5A623)' }}>
                    {hero.primaryBtnText}
                  </span>
                  <span className="text-[11px] font-semibold px-4 py-2 rounded-lg border border-white/20 text-gray-300">
                    {hero.secondaryBtnText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span>Frequently Asked Questions ({faqs.length})</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Add, edit, or remove customer FAQs displayed on the website.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFaqs}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Icon name="ArrowPathIcon" size={13} />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                onClick={handleAddFaq}
                className="text-xs font-bold text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #ED1C24 0%, #F5A623 100%)' }}
              >
                <Icon name="PlusCircleIcon" size={15} />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-gray-200 hover:border-amber-300 transition-all bg-gray-50/50 space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 font-bold bg-white focus:outline-none focus:border-amber-500"
                        placeholder="e.g. Do you bring cooking equipment?"
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={faq.answer}
                      onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 text-xs text-gray-800 bg-white focus:outline-none focus:border-amber-500 font-medium resize-none"
                      placeholder="Detailed answer text..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteFaq(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-1"
                    title="Delete this FAQ"
                  >
                    <Icon name="TrashIcon" size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={handleSaveFaqs}
              disabled={isSavingFaqs}
              className="px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #ED1C24 0%, #F5A623 100%)' }}
            >
              {isSavingFaqs ? (
                <>
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  <span>Saving FAQs...</span>
                </>
              ) : (
                <>
                  <Icon name="CloudArrowUpIcon" size={16} />
                  <span>Publish All FAQs</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── CENTERED CONFIRMATION MODAL ─── */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 flex flex-col items-center text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmModal.isDanger ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
              <Icon name={confirmModal.isDanger ? 'TrashIcon' : 'ArrowPathIcon'} size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">{confirmModal.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm cursor-pointer ${
                  confirmModal.isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmModal.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
