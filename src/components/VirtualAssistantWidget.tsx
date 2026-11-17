import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Home, Minus, Send, X } from 'lucide-react';
import { useFirebasePermit } from '../context/FirebasePermitContext';

interface ServiceCard {
  id: string;
  title: string;
  reply: string;
  iconType: 'badge' | 'doc' | 'network' | 'pen' | 'plus';
}

const SERVICE_CARDS: ServiceCard[] = [
  {
    id: 'establishments_contract',
    title: 'خدمة التعاقد بين المنشآت',
    reply: 'تم اختيار خدمة "التعاقد بين المنشآت". كيف يمكنني مساعدتك؟',
    iconType: 'badge',
  },
  {
    id: 'portal_gate',
    title: 'بوابة التصاريح',
    reply: 'تم اختيار خدمة "بوابة التصاريح". كيف يمكنني مساعدتك؟',
    iconType: 'doc',
  },
  {
    id: 'workforce_contract',
    title: 'خدمة التعاقد مع القوى العاملة',
    reply: 'تم اختيار خدمة "خدمة التعاقد مع القوى العاملة". كيف يمكنني مساعدتك؟',
    iconType: 'pen',
  },
  {
    id: 'ajeer_contract',
    title: 'تعاقد أجير',
    reply: 'تم اختيار خدمة "تعاقد أجير". كيف يمكنني مساعدتك؟',
    iconType: 'network',
  },
  {
    id: 'other_services',
    title: 'خدمات أخرى',
    reply: 'تم اختيار خدمة "خدمات أخرى". كيف يمكنني مساعدتك؟',
    iconType: 'plus',
  },
];

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timeLabel: string;
}

const ChatBubbleSvg: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M16 5C9.925 5 5 9.142 5 14.25c0 2.385 1.073 4.558 2.838 6.197L6.5 25.5l4.98-1.66A12.3 12.3 0 0 0 16 24.7c6.075 0 11-4.142 11-9.25S22.075 5 16 5Z" />
    <path d="M12.5 14.25a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0Z" />
  </svg>
);

const ServiceCardIcon: React.FC<{ type: ServiceCard['iconType'] }> = ({ type }) => {
  switch (type) {
    case 'badge':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11 mx-auto" aria-hidden="true">
          <rect x="11" y="10" width="26" height="32" rx="2" stroke="#0B2240" strokeWidth="2.2" />
          <path d="M21 6h6v4h-6z" stroke="#0B2240" strokeWidth="2" />
          <circle cx="24" cy="24" r="6" stroke="#0B2240" strokeWidth="2" />
          <circle cx="24" cy="22.5" r="2.2" stroke="#0B2240" strokeWidth="1.8" />
          <path d="M20.5 28c.8-1.5 2-2 3.5-2s2.7.5 3.5 2" stroke="#0B2240" strokeWidth="1.8" />
          <path d="M15 35h18" stroke="#389E5C" strokeWidth="2" strokeDasharray="2 2.5" />
          <path d="M15 15h18" stroke="#389E5C" strokeWidth="2" strokeDasharray="2 2.5" />
        </svg>
      );
    case 'doc':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11 mx-auto" aria-hidden="true">
          <path
            d="M14 8h14l8 8v24a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z"
            stroke="#0B2240"
            strokeWidth="2.2"
          />
          <circle cx="24" cy="23" r="4" stroke="#389E5C" strokeWidth="2" />
          <path d="M17.5 34c1.2-3.5 3.5-5 6.5-5s5.3 1.5 6.5 5" stroke="#389E5C" strokeWidth="2" />
          <path d="M16 14h6" stroke="#0B2240" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'pen':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11 mx-auto" aria-hidden="true">
          <path
            d="M12 8h16l6 6v26H12V8Z"
            stroke="#0B2240"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M16 18h10M16 24h10M16 30h6" stroke="#389E5C" strokeWidth="2" strokeLinecap="round" />
          <path d="M35 19l5 5-10 10-5 1 1-5 9-11Z" fill="#ffffff" stroke="#0B2240" strokeWidth="2" />
        </svg>
      );
    case 'network':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11 mx-auto" aria-hidden="true">
          <circle cx="24" cy="13" r="4" stroke="#0B2240" strokeWidth="2" />
          <circle cx="14" cy="32" r="4" stroke="#0B2240" strokeWidth="2" />
          <circle cx="34" cy="32" r="4" stroke="#0B2240" strokeWidth="2" />
          <path
            d="M17 17c-2.5 2-4 5-4 8.5M31 17c2.5 2 4 5 4 8.5M19 35h10"
            stroke="#389E5C"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'plus':
    default:
      return (
        <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11 mx-auto" aria-hidden="true">
          <circle cx="24" cy="24" r="14" stroke="#0B2240" strokeWidth="2.2" />
          <path d="M24 17v14M17 24h14" stroke="#389E5C" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
  }
};

function createInitialMessages(): ChatMessage[] {
  return [
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'مرحبًا، أنا مساعدك الافتراضي من ميثاق. يسرني خدمتك والإجابة عن استفساراتك 👍',
      timeLabel: 'bot - الآن',
    },
    {
      id: 'welcome-2',
      sender: 'bot',
      text: 'يرجى اختيار إحدى الخدمات ليتم مساعدتك',
      timeLabel: 'bot - الآن',
    },
  ];
}

export const VirtualAssistantWidget: React.FC = () => {
  const { user, submitSupportInquiry } = useFirebasePermit();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('استفسار عام');
  const [messages, setMessages] = useState<ChatMessage[]>(createInitialMessages);
  const [inputText, setInputText] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleSelectService = (card: ServiceCard) => {
    const nowTime = new Date().toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setSelectedService(card.title);
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: card.title,
        timeLabel: nowTime,
      },
      {
        id: `bot-${Date.now() + 1}`,
        sender: 'bot',
        text: card.reply,
        timeLabel: `bot - ${nowTime}`,
      },
    ]);
    scrollToBottom();
  };

  const handleResetHome = () => {
    setSelectedService('استفسار عام');
    setMessages(createInitialMessages());
    setActiveSlide(0);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const nowTime = new Date().toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: trimmed,
        timeLabel: nowTime,
      },
    ]);
    setInputText('');

    let savedToCloud = false;
    if (user && user.emailVerified) {
      try {
        savedToCloud = await submitSupportInquiry(selectedService, trimmed);
      } catch {
        savedToCloud = false;
      }
    }

    const lower = trimmed.toLowerCase();
    let botReply =
      'شكراً لتواصلك عبر المساعد الافتراضي. تم تسجيل استفسارك ضمن المحادثة وسنساعدك في أقرب وقت.';

    if (lower.includes('pdf') || trimmed.includes('طباعة') || trimmed.includes('حفظ')) {
      botReply =
        'لحفظ التصريح كملف PDF، اضغط على زر الطباعة أسفل يمين الصفحة ثم اختر «حفظ بتنسيق PDF».';
    } else if (trimmed.includes('تعديل') || trimmed.includes('لوحة') || trimmed.includes('شعار')) {
      botReply =
        'يمكنك تعديل جميع البيانات والشعار عبر فتح لوحة التحكم من أيقونة الإعدادات أسفل يمين الشاشة.';
    } else if (savedToCloud) {
      botReply = 'تم استلام استفسارك وحفظه بنجاح. كيف يمكنني مساعدتك أيضاً؟';
    }

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now() + 2}`,
          sender: 'bot',
          text: botReply,
          timeLabel: `bot - ${nowTime}`,
        },
      ]);
      scrollToBottom();
    }, 220);
  };

  const handleSlideMove = (direction: 'prev' | 'next') => {
    const nextIndex =
      direction === 'next'
        ? Math.min(SERVICE_CARDS.length - 1, activeSlide + 1)
        : Math.max(0, activeSlide - 1);
    setActiveSlide(nextIndex);
    if (carouselRef.current) {
      const cardEl = carouselRef.current.children[nextIndex] as HTMLElement | undefined;
      cardEl?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  return (
    <>
      {/* Green Floating Chat Launcher (Bottom-Left, exact match to screenshot) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'إغلاق المساعد الافتراضي' : 'فتح المساعد الافتراضي'}
        aria-expanded={isOpen}
        className="no-print fixed bottom-5 left-5 z-40 w-14 h-14 rounded-full bg-[#389E5C] hover:bg-[#2E854C] text-white shadow-lg flex items-center justify-center transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
      >
        <ChatBubbleSvg className="w-7 h-7" />
      </button>

      {/* Virtual Assistant Drawer / Modal matching the 4 reference chat screenshots */}
      {isOpen && (
        <section
          dir="rtl"
          aria-label="مساعدك الافتراضي من ميثاق"
          className="no-print fixed bottom-22 left-3 right-3 sm:right-auto sm:left-5 sm:w-[390px] max-h-[82vh] z-50 flex flex-col rounded-2xl overflow-hidden bg-[#f5f7f6] border border-gray-200 shadow-2xl"
        >
          {/* Header Bar */}
          <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#389E5C] text-white flex items-center justify-center shrink-0">
                <ChatBubbleSvg className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#111827] truncate">
                مساعدك الافتراضي من ميثاق
              </h3>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleResetHome}
                title="الرئيسية"
                aria-label="العودة لبداية المحادثة"
                className="w-8 h-8 rounded-full text-[#0B2240] hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="تصغير"
                aria-label="تصغير المحادثة"
                className="w-8 h-8 rounded-full bg-[#0B2240] text-white hover:bg-[#13325c] flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="إغلاق"
                aria-label="إغلاق المحادثة"
                className="w-8 h-8 rounded-full bg-[#0B2240] text-white hover:bg-[#13325c] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.slice(0, 2).map((msg) => (
              <div key={msg.id} className="flex flex-col items-end">
                <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-xs max-w-[90%] leading-relaxed">
                  {msg.text}
                </div>
                <span className="text-[11px] text-gray-400 mt-1 px-1">{msg.timeLabel}</span>
              </div>
            ))}

            {/* Horizontal Service Cards Carousel */}
            <div className="pt-1 pb-2">
              <div
                ref={carouselRef}
                className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
              >
                {SERVICE_CARDS.map((card, idx) => (
                  <div
                    key={card.id}
                    onClick={() => setActiveSlide(idx)}
                    className="snap-center shrink-0 w-[160px] bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-col items-center justify-between text-center gap-3"
                  >
                    <ServiceCardIcon type={card.iconType} />
                    <p className="text-xs font-bold text-gray-900 leading-snug min-h-[34px] flex items-center justify-center">
                      {card.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectService(card)}
                      className="w-full py-1.5 text-xs font-semibold text-gray-500 hover:text-[#0B2240] hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      اختر
                    </button>
                  </div>
                ))}
              </div>

              {/* Carousel Pagination Controls */}
              <div className="flex items-center justify-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => handleSlideMove('prev')}
                  aria-label="الخدمة السابقة"
                  className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30"
                  disabled={activeSlide === 0}
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <div className="flex items-center gap-1.5">
                  {SERVICE_CARDS.map((c, idx) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-label={`الانتقال للبطاقة ${idx + 1}`}
                      onClick={() => {
                        setActiveSlide(idx);
                        const cardEl = carouselRef.current?.children[idx] as
                          | HTMLElement
                          | undefined;
                        cardEl?.scrollIntoView({
                          behavior: 'smooth',
                          inline: 'center',
                          block: 'nearest',
                        });
                      }}
                      className={`h-1.5 rounded-full transition-all ${
                        activeSlide === idx ? 'w-3 bg-[#0B2240]' : 'w-1.5 bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleSlideMove('next')}
                  aria-label="الخدمة التالية"
                  className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30"
                  disabled={activeSlide === SERVICE_CARDS.length - 1}
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Interactive Conversation Thread */}
            {messages.slice(2).map((msg) =>
              msg.sender === 'user' ? (
                <div key={msg.id} className="flex flex-col items-start">
                  <div className="bg-[#0B2240] text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-xs max-w-[88%] leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex flex-col items-end">
                  <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-xs max-w-[90%] leading-relaxed">
                    {msg.text}
                  </div>
                  <span className="text-[11px] text-gray-400 mt-1 px-1">{msg.timeLabel}</span>
                </div>
              ),
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="bg-white border-t border-gray-200 p-2.5 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب استفسارك هنا..."
              maxLength={400}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#389E5C]"
            />
            <button
              type="submit"
              aria-label="إرسال"
              className="min-h-[40px] min-w-[40px] rounded-lg bg-[#389E5C] hover:bg-[#2E854C] text-white flex items-center justify-center transition-colors shrink-0"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}
    </>
  );
};
