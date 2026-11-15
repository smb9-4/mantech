import React, { useState } from 'react';
import {
  MessageSquare,
  Calendar,
  Award,
  Clock,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Search,
  BellRing,
  Filter
} from 'lucide-react';

interface ParentSmsMessage {
  id: string;
  sender: string;
  category: 'PTM' | 'Results' | 'Exams' | 'Attendance' | 'General';
  categoryLabel: string;
  title: string;
  date: string;
  time: string;
  body: string;
  recipientPhone: string;
}

const PARENT_SMS_MOCK: ParentSmsMessage[] = [
  {
    id: 'sms-01',
    sender: 'SIRMV-COLLEGE',
    category: 'PTM',
    categoryLabel: 'Parent Meeting (PTM)',
    title: 'Term 1 Parent-Teacher Meeting (PTM) Scheduled',
    date: '14 Nov 2026',
    time: '05:30 PM',
    body: 'Dear Parent, The Term 1 Parent-Teacher Meeting (PTM) for I PU & II PU students is scheduled on Saturday, 21st Nov 2026 from 10:00 AM to 01:00 PM at the SIR MV Campus Auditorium. You are requested to attend to discuss your ward\'s academic progress, test marks, and faculty feedback.',
    recipientPhone: '+91-9845012345'
  },
  {
    id: 'sms-02',
    sender: 'SIRMV-COLLEGE',
    category: 'Results',
    categoryLabel: 'Board Exam Results',
    title: 'Mid-Term Board Assessment Results Announced',
    date: '12 Nov 2026',
    time: '04:15 PM',
    body: 'Dear Parent, Mid-Term Board Examination results have been announced. Your ward Bhoomika Naik has secured 94.8% (379/400 - Distinction) with Rank 3 in Class. You can view and download the complete subject scorecard in the Results section.',
    recipientPhone: '+91-9845012345'
  },
  {
    id: 'sms-03',
    sender: 'SIRMV-COLLEGE',
    category: 'Exams',
    categoryLabel: 'Exam Timetable',
    title: 'Unit Test 3 & Preparatory Exam Schedule Released',
    date: '10 Nov 2026',
    time: '11:00 AM',
    body: 'Dear Parent, Unit Test 3 assessments will commence from Monday, 23rd Nov 2026. Detailed timetable for Physics, Chemistry, Maths & CS/Bio has been published. Please ensure your ward prepares according to schedule.',
    recipientPhone: '+91-9845012345'
  },
  {
    id: 'sms-04',
    sender: 'SIRMV-COLLEGE',
    category: 'Attendance',
    categoryLabel: 'Attendance Alert',
    title: 'Monthly Attendance Status: 96.4%',
    date: '05 Nov 2026',
    time: '06:00 PM',
    body: 'Dear Parent, Monthly attendance alert: Your ward Bhoomika Naik has maintained 96.4% attendance in the current academic month. Board minimum requirement is 75%. Keep up the excellent regularity.',
    recipientPhone: '+91-9845012345'
  },
  {
    id: 'sms-05',
    sender: 'SIRMV-COLLEGE',
    category: 'PTM',
    categoryLabel: 'Special PTM',
    title: 'NEET / JEE Coaching & Board Strategy PTM Session',
    date: '28 Oct 2026',
    time: '02:30 PM',
    body: 'Dear Parent, Special preparatory orientation meeting regarding PU Board examinations & NEET/JEE foundation strategy will be held on Saturday 5th Dec 2026 at 11:00 AM. Principal and Department Heads will address the session.',
    recipientPhone: '+91-9845012345'
  },
  {
    id: 'sms-06',
    sender: 'SIRMV-COLLEGE',
    category: 'General',
    categoryLabel: 'Annual Day Invitation',
    title: 'Invitation: 18th Annual Day & Prize Distribution',
    date: '20 Oct 2026',
    time: '10:00 AM',
    body: 'Dear Parent, You are cordially invited to the SIR MV PU College Annual Day and Academic Excellence Award Ceremony on 28th Nov 2026 at 09:30 AM. Kindly grace the occasion and encourage our students.',
    recipientPhone: '+91-9845012345'
  }
];

export const ParentSmsView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMessages = PARENT_SMS_MOCK.filter((sms) => {
    if (selectedCategory !== 'ALL' && sms.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        sms.title.toLowerCase().includes(q) ||
        sms.body.toLowerCase().includes(q) ||
        sms.categoryLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-1 select-none">
      {/* ── Verified Phone Banner ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#8C1118]/10 text-[#8C1118] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900">Registered Parent Mobile Number</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                <ShieldCheck className="w-3 h-3" /> Verified Link
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Receiving official broadcast alerts at <span className="font-mono font-bold text-slate-800">+91-9845012345</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 self-start sm:self-auto">
          <BellRing className="w-4 h-4 text-amber-500" />
          <span>Real-time SMS Push Active</span>
        </div>
      </div>

      {/* ── Category Filter Pills & Search ── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'ALL'
                ? 'bg-[#8C1118] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All SMS ({PARENT_SMS_MOCK.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('PTM')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'PTM'
                ? 'bg-[#8C1118] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Parents Meetings (PTM)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('Results')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'Results'
                ? 'bg-[#8C1118] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Result Announcements
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('Exams')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'Exams'
                ? 'bg-[#8C1118] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Exam Schedules
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('Attendance')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'Attendance'
                ? 'bg-[#8C1118] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Attendance Alerts
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SMS notices by keyword (e.g. meeting, results, timetable)..."
            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8C1118]/20 focus:border-[#8C1118]"
          />
        </div>
      </div>

      {/* ── SMS Cards Feed ── */}
      <div className="space-y-4">
        {filteredMessages.map((sms) => {
          const isPtm = sms.category === 'PTM';
          const isResult = sms.category === 'Results';

          return (
            <div
              key={sms.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-3 transition hover:shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                    {sms.sender}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      isPtm
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : isResult
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        : 'bg-blue-100 text-blue-900 border border-blue-200'
                    }`}
                  >
                    {sms.categoryLabel}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {sms.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sms.date} • {sms.time}</span>
                </div>
              </div>

              {/* Message Content */}
              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 font-sans text-xs leading-relaxed text-slate-800">
                {sms.body}
              </div>

              {/* Delivery Receipt Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Delivered to {sms.recipientPhone}
                </span>
                <span className="text-slate-400 font-mono text-[10px]">SMS ID: {sms.id.toUpperCase()}</span>
              </div>
            </div>
          );
        })}

        {filteredMessages.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 text-xs">
            No SMS messages found matching your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentSmsView;

