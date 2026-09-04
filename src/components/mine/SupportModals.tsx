import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  HelpCircle,
  Headphones,
  ChevronDown,
  ChevronUp,
  Send,
  MessageCircle,
  Mail,
  CheckCircle2,
  ExternalLink,
  SendHorizontal,
  Copy,
  Check
} from 'lucide-react';
import { PlatformNotice } from '../../types';

interface SupportModalProps {
  type?: 'announcements' | 'help' | 'contact';
  modalType?: 'announcements' | 'help' | 'contact';
  isOpen: boolean;
  onClose: () => void;
  notices: PlatformNotice[];
}

export const SupportModal: React.FC<SupportModalProps> = ({
  type,
  modalType,
  isOpen,
  onClose,
  notices
}) => {
  const activeType = type || modalType || 'contact';
  const [currentTab, setCurrentTab] = useState<'contact' | 'help' | 'announcements'>(activeType);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [supportMessage, setSupportMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'support'; text: string; time: string }>>([
    {
      sender: 'support',
      text: 'Hello! Welcome to JAMBASE 24/7 VIP Support. Our official Telegram customer support manager is online 24/7.',
      time: 'Just now'
    }
  ]);
  const [sending, setSending] = useState(false);
  const [copiedTg, setCopiedTg] = useState(false);

  // Telegram configuration
  const [telegramConfig, setTelegramConfig] = useState({
    username: '@Camila85260',
    link: 'https://t.me/Camila85260',
    channelUsername: '',
    channelLink: ''
  });

  useEffect(() => {
    setCurrentTab(type || modalType || 'contact');
  }, [type, modalType, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/support/telegram')
        .then(res => res.json())
        .then(data => {
          if (data.telegram) {
            setTelegramConfig({
              username: data.telegram.username || '@Camila85260',
              link: data.telegram.link || 'https://t.me/Camila85260',
              channelUsername: data.telegram.channelUsername || '',
              channelLink: data.telegram.channelLink || ''
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyTelegram = () => {
    navigator.clipboard.writeText(telegramConfig.username);
    setCopiedTg(true);
    setTimeout(() => setCopiedTg(false), 2000);
  };

  const faqs = [
    {
      q: 'How is daily income calculated?',
      a: 'Daily income is calculated automatically at 00:00 UTC based on your Total Assets (Available + Frozen) multiplied by your active VIP Tier rate (1.9% for VIP 1 up to 6.0% for VIP 6).'
    },
    {
      q: 'What is the $30 minimum balance rule?',
      a: 'To prevent idle accounts from generating yield, accounts must maintain at least $30.00 in total assets. If your balance drops below $30, daily income is automatically paused until recharged.'
    },
    {
      q: 'How do multi-tier referral commissions work?',
      a: 'You receive multi-tier subordinate rebate commissions daily: Level 1 (Direct) earns 16%, Level 2 earns 8%, and Level 3 earns 4% of their daily yield dividends.'
    },
    {
      q: 'What makes a direct member "Valid"?',
      a: 'A direct member qualifies as a valid investor once they register via your invitation link, verify their account, and hold a minimum deposit/balance of at least 2,000 ETB.'
    },
    {
      q: 'What are the withdrawal limits and fees?',
      a: 'The minimum withdrawal is 500 ETB via Commercial Bank of Ethiopia (CBE). Standard platform service fee is 5%. Funds are processed rapidly following administrative audit.'
    }
  ];

  const handleSendSupportMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    const userText = supportMessage.trim();
    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: userText, time: 'Just now' }
    ]);
    setSupportMessage('');
    setSending(true);

    setTimeout(() => {
      setSending(false);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'support',
          text: `Thank you for contacting JAMBASE Support. Our specialist is reviewing your inquiry regarding "${userText.slice(0, 30)}..." and will assist you immediately.`,
          time: 'Just now'
        }
      ]);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="support-modal"
        className="w-full max-w-lg bg-[#0f1015] border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center font-bold">
              {currentTab === 'announcements' && <Volume2 size={16} className="text-[#00D26A]" />}
              {currentTab === 'help' && <HelpCircle size={16} className="text-[#00D26A]" />}
              {currentTab === 'contact' && <Headphones size={16} className="text-[#00D26A]" />}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                {currentTab === 'announcements' && 'Platform Announcements'}
                {currentTab === 'help' && 'Help Center & FAQ'}
                {currentTab === 'contact' && '24/7 VIP Customer Support'}
              </h2>
              <p className="text-[10px] text-neutral-400">Official JAMBASE assistance & Telegram support</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selector Buttons */}
        <div className="px-4 pt-3 flex items-center gap-2 border-b border-neutral-800/60 pb-2.5">
          <button
            onClick={() => setCurrentTab('contact')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentTab === 'contact'
                ? 'bg-[#0088cc] text-white shadow-md shadow-[#0088cc]/25'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Headphones size={13} />
            <span>VIP Support</span>
          </button>

          <button
            onClick={() => setCurrentTab('help')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentTab === 'help'
                ? 'bg-[#00D26A] text-black shadow-md shadow-[#00D26A]/20'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <HelpCircle size={13} />
            <span>FAQ & Rules</span>
          </button>

          <button
            onClick={() => setCurrentTab('announcements')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentTab === 'announcements'
                ? 'bg-[#00D26A] text-black shadow-md shadow-[#00D26A]/20'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Volume2 size={13} />
            <span>Announcements</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {/* ANNOUNCEMENTS */}
          {currentTab === 'announcements' && (
            <div className="space-y-3">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-4 rounded-2xl bg-[#14161f] border border-neutral-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#00D26A]/15 text-[#00D26A] border border-[#00D26A]/30">
                      {notice.type}
                    </span>
                    <span className="text-[10px] text-neutral-500">{notice.date}</span>
                  </div>
                  <h4 className="font-extrabold text-white text-xs">{notice.title}</h4>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">{notice.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* HELP CENTER & FAQ */}
          {currentTab === 'help' && (
            <div className="space-y-2.5">
              {faqs.map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#14161f] border border-neutral-800 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                      className="w-full p-3.5 flex items-center justify-between text-left font-bold text-white hover:text-[#00D26A] transition-colors"
                    >
                      <span className="pr-2">{faq.q}</span>
                      {isExpanded ? <ChevronUp size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0 text-neutral-400" />}
                    </button>
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-0 text-[11px] text-neutral-400 leading-relaxed border-t border-neutral-850">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 24/7 TELEGRAM CUSTOMER SUPPORT */}
          {currentTab === 'contact' && (
            <div className="flex flex-col h-[460px] space-y-3">
              {/* Telegram Support Spotlight Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0088cc]/25 via-[#0088cc]/15 to-[#14161f] border border-[#0088cc]/50 space-y-3 shadow-lg shadow-[#0088cc]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-[#0088cc] text-white flex items-center justify-center font-black shadow-lg shadow-[#0088cc]/40">
                      <SendHorizontal size={22} />
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">VIP Telegram Support</h4>
                      <p className="text-xs text-sky-400 font-bold">{telegramConfig.username}</p>
                    </div>
                  </div>
                  <a
                    href={telegramConfig.link}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#0088cc] hover:bg-[#0099e6] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-[#0088cc]/30 transition-transform active:scale-95"
                  >
                    <span>Open Telegram</span>
                    <ExternalLink size={13} />
                  </a>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#0088cc]/20 text-[11px]">
                  <span className="text-neutral-300">
                    Official Telegram: <strong className="text-white font-mono">{telegramConfig.username}</strong>
                  </span>
                  <button
                    onClick={handleCopyTelegram}
                    className="px-2.5 py-1 rounded-lg bg-[#0088cc]/20 hover:bg-[#0088cc]/40 text-sky-200 hover:text-white flex items-center gap-1.5 font-bold transition-colors"
                  >
                    {copiedTg ? <Check size={12} className="text-[#00D26A]" /> : <Copy size={12} />}
                    {copiedTg ? 'Copied' : 'Copy Username'}
                  </button>
                </div>
              </div>

              {/* Quick Direct Link Action Button */}
              <a
                href={telegramConfig.link}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-[#0088cc]/15 hover:bg-[#0088cc]/30 border border-[#0088cc]/50 hover:border-[#0088cc] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm"
              >
                <SendHorizontal size={16} className="text-[#0088cc]" />
                <span>Direct Chat with {telegramConfig.username} on Telegram</span>
              </a>

              {/* Optional Telegram Channel Button if configured */}
              {telegramConfig.channelLink && (
                <a
                  href={telegramConfig.channelLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <Volume2 size={14} className="text-[#00D26A]" />
                  <span>Join Official Telegram Channel: {telegramConfig.channelUsername}</span>
                </a>
              )}

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto py-2 space-y-2.5">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#00D26A] text-black font-semibold rounded-br-none'
                          : 'bg-[#14161f] border border-neutral-800 text-neutral-200 rounded-bl-none'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span
                        className={`text-[9px] block mt-1 ${
                          msg.sender === 'user' ? 'text-black/70' : 'text-neutral-500'
                        }`}
                      >
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-[#14161f] border border-neutral-800 p-2.5 rounded-2xl text-[10px] text-neutral-400">
                      Support typing...
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendSupportMessage} className="pt-2 border-t border-neutral-800 flex items-center gap-2">
                <input
                  type="text"
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder={`Type message or ask for ${telegramConfig.username}...`}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-[#00D26A] text-xs"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black transition-transform active:scale-95 shrink-0"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
