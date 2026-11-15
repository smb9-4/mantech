import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  BookOpen,
  AlertCircle,
  Play,
  RotateCcw,
  Check,
  Send,
  Download,
  Calendar,
  Phone,
  MessageSquare,
  FileText,
  User,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  BarChart2,
  HelpCircle
} from 'lucide-react';
import AnimatedCounter from '../tabManagement/AnimatedCounter';
import ExpandableDashboardCard, { DashboardCardConfig } from '../tabManagement/ExpandableDashboardCard';
import ExamMCQReviewModal from '../tabManagement/ExamMCQReviewModal';
import {
  PUC_ANNOUNCEMENTS,
  MOCK_EXAM_RESULTS,
  PUC_TOPICS_BY_SUBJECT,
  PUCYear,
  PUCSubject,
  ExamCategory,
  PastExamRecord,
  PUCAnnouncement
} from '../tabManagement/pucAcademicData';
import { DEMO_ATTENDANCE_RECORDS, DEMO_MCQ_QUESTIONS, DEMO_TIMETABLE } from '../tabManagement/data';
import { useAuth } from '../context/AuthContext';

interface StudentTabViewProps {
  activeModule?: string;
  onNavigate?: (tab: string) => void;
}

export const StudentTabView: React.FC<StudentTabViewProps> = ({
  activeModule: externalModule,
  onNavigate
}) => {
  const { user } = useAuth();

  // Internal module state when navigated from cards
  const [internalModule, setInternalModule] = useState<string>('dashboard');

  useEffect(() => {
    if (externalModule) {
      setInternalModule(externalModule === 'dashboard-home' ? 'dashboard' : externalModule);
    }
  }, [externalModule]);

  const activeModule = (externalModule && externalModule === 'dashboard-home') ? 'dashboard' : (externalModule || internalModule);

  const navigateTo = (mod: string) => {
    setInternalModule(mod);
    if (onNavigate) {
      if (mod === 'dashboard') onNavigate('dashboard-home');
      else onNavigate(mod);
    }
  };

  // PUC Academic Stream State (I PU / II PU)
  const [pucYear, setPucYear] = useState<PUCYear>('II PU');

  // Student Persona Gender Toggle (defaults to Female matching user's uploaded portrait)
  const [studentGender, setStudentGender] = useState<'Female' | 'Male'>('Female');
  const studentName = studentGender === 'Female' ? 'Bhoomika Naik' : 'Rahul Sharma';
  const studentRoll = studentGender === 'Female' ? '24PUC101' : '24PUC102';
  const studentPhoto = studentGender === 'Female' ? '/student-profile.png' : '/portraits/ms18.webp';

  // Card hover expansion state
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Announcements Category & Subject Filters
  const [announcementCategoryFilter, setAnnouncementCategoryFilter] = useState<'All' | 'Principal' | 'HOD' | 'Teacher'>('All');
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<PUCAnnouncement | null>(null);

  // Exams View Mode (Live vs Practice)
  const [examViewMode, setExamViewMode] = useState<'live' | 'practice'>('live');

  // Live Exam Taking Engine State
  const [liveExamActive, setLiveExamActive] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState<number | null>(null);

  // Practice Exam State
  const [practiceTrack, setPracticeTrack] = useState<ExamCategory>('JEE');
  const [practiceSubject, setPracticeSubject] = useState<PUCSubject>('Physics');
  const [practiceTopic, setPracticeTopic] = useState('Electrostatics & Gauss Law');
  const [practiceQCount, setPracticeQCount] = useState(25);
  const [practiceDifficulty, setPracticeDifficulty] = useState<'Foundation' | 'Moderate' | 'Advanced'>('Moderate');
  const [practiceActive, setPracticeActive] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});

  // Deep Diagnostic Results Review Modal State
  const [reviewExamModal, setReviewExamModal] = useState<PastExamRecord | null>(null);
  const [examArchiveFilter, setExamArchiveFilter] = useState<'all' | ExamCategory>('all');

  // Attendance Period Tab State
  const [attendancePeriod, setAttendancePeriod] = useState<'overall' | 'monthly' | 'weekly' | 'daily'>('overall');

  // Complaints State
  const [complaintCategory, setComplaintCategory] = useState('Academic');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintsList, setComplaintsList] = useState([
    {
      id: 'c1',
      ref: 'SIR-MV-2026-0062',
      cat: 'Classroom Infrastructure',
      title: 'Classroom Projector Replacement – Room 204',
      date: '02 Nov, 2026',
      status: 'Under Review'
    },
    {
      id: 'c2',
      ref: 'SIR-MV-2026-0045',
      cat: 'Academic Laboratory',
      title: 'Oscilloscope Calibration in Electronics Lab',
      date: '25 Oct, 2026',
      status: 'Resolved'
    }
  ]);
  const [complaintSuccess, setComplaintSuccess] = useState(false);

  const handleStartLiveExam = () => {
    setLiveExamActive(true);
    setActiveQuestionIdx(0);
    setSelectedAnswers({});
    setExamSubmitted(false);
    setExamScore(null);
  };

  const handleSubmitLiveExam = () => {
    let score = 0;
    DEMO_MCQ_QUESTIONS.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctOptionId) {
        score += 4;
      } else if (selectedAnswers[idx] && selectedAnswers[idx] !== q.correctOptionId) {
        score -= 1;
      }
    });
    setExamScore(score);
    setExamSubmitted(true);
    setLiveExamActive(false);
  };

  const handlePostComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTitle.trim() || !complaintDesc.trim()) return;
    const newCase = {
      id: `c_${Date.now()}`,
      ref: `SIR-MV-2026-00${complaintsList.length + 65}`,
      cat: complaintCategory,
      title: complaintTitle.trim(),
      date: 'Today, Just now',
      status: 'Under Review'
    };
    setComplaintsList([newCase, ...complaintsList]);
    setComplaintTitle('');
    setComplaintDesc('');
    setComplaintSuccess(true);
    setTimeout(() => setComplaintSuccess(false), 3500);
  };

  // 10 Interactive Student Dashboard Cards (Exact configuration from sirmv_updated)
  const STUDENT_DASHBOARD_CARDS: DashboardCardConfig[] = [
    {
      id: 'announcements',
      title: 'Announcements',
      iconSrc: '/student-section-icons/announcements.png',
      desc: 'Official circulars from Principal, HOD, and faculty.',
      count: '3 New Notices',
      badgeBg: '#FFE59A',
      badgeColor: '#650000',
      previews: [
        { label: 'Principal Notice', value: 'IA-2 Exam Schedule Commencing Nov 18' },
        { label: 'Last Updated', value: '2 hours ago' },
      ],
      onAction: () => navigateTo('announcements'),
    },
    {
      id: 'exams',
      title: 'Exams',
      iconSrc: '/student-section-icons/exams.png',
      desc: 'Live examinations & competitive mock test series.',
      count: '3 Available',
      badgeBg: '#E5BD55',
      badgeColor: '#500000',
      previews: [
        { label: 'Live Assessment', value: 'JEE Mock Test Series 03 [DEMO]', highlight: true },
        { label: 'Recent Score', value: '212 / 300 Marks (70.7%)' },
      ],
      onAction: () => navigateTo('tests'),
    },
    {
      id: 'notes',
      title: 'Notes',
      iconSrc: '/student-section-icons/notes.png',
      desc: 'Curated subject notes, chapter slides & PDF guides.',
      count: '8 Documents',
      badgeBg: '#FFFFFF',
      badgeColor: '#343434',
      previews: [
        { label: 'Latest Upload', value: 'Physics Wave Optics Derivations', highlight: true },
        { label: 'Faculty', value: 'Dr. Mahendra V (HOD Physics)' },
      ],
      onAction: () => navigateTo('notes'),
    },
    {
      id: 'materials',
      title: 'Study Materials',
      iconSrc: '/student-section-icons/materials.png',
      desc: 'Videos, worksheets, question banks & prep kits.',
      count: '14 Resources',
      badgeBg: '#FFFFFF',
      badgeColor: '#343434',
      previews: [
        { label: 'Exam Tracks', value: 'JEE Main, KCET, NEET, PU Board' },
        { label: 'Interactive Player', value: 'Available with full resolution' },
      ],
      onAction: () => navigateTo('materials'),
    },
    {
      id: 'results',
      title: 'Results',
      iconSrc: '/student-section-icons/results.png',
      desc: 'Performance analytics, scores & question-by-question review.',
      count: '70.7% Recent',
      badgeBg: '#FFE59A',
      badgeColor: '#650000',
      previews: [
        { label: 'Latest Exam', value: 'JEE Mock Test 02: 212 / 300', highlight: true },
        { label: 'Accuracy', value: '58 Correct • 14 Incorrect • 18 Left' },
      ],
      onAction: () => navigateTo('reports'),
    },
    {
      id: 'timetable',
      title: 'Timetable',
      iconSrc: '/student-section-icons/timetable.png',
      desc: 'Daily lectures, practical periods, and subject schedule.',
      count: 'Weekly Schedule',
      badgeBg: '#FFFFFF',
      badgeColor: '#343434',
      previews: [
        { label: 'Subjects', value: 'Physics, Chemistry, Maths & CS/Bio', highlight: true },
        { label: 'Schedule', value: 'Theory classes and practical periods' },
      ],
      onAction: () => navigateTo('timetable'),
    },
    {
      id: 'calendar',
      title: 'Calendar',
      iconSrc: '/student-section-icons/calendar.png',
      desc: 'Monthly JEE, NEET, and theory exam schedule.',
      count: 'Weekly Exams',
      badgeBg: '#FFFFFF',
      badgeColor: '#343434',
      previews: [
        { label: 'Sunday Exams', value: 'JEE and NEET alternate weekly', highlight: true },
        { label: 'Theory Exams', value: 'Every Wednesday and Saturday' },
      ],
      onAction: () => navigateTo('college-calendar'),
    },
    {
      id: 'complaints',
      title: 'Complaint Box',
      iconSrc: '/student-section-icons/complaints.png',
      desc: 'Grievance redressal cell for academic & facility issues.',
      count: `${complaintsList.filter(c => c.status !== 'Resolved').length} Active`,
      badgeBg: '#FFFFFF',
      badgeColor: '#343434',
      previews: [
        { label: 'Active Reference', value: complaintsList[0]?.ref || 'None', highlight: true },
        { label: 'Category', value: complaintsList[0]?.cat || 'None' },
      ],
      onAction: () => navigateTo('complaints'),
    },
    {
      id: 'attendance',
      title: 'Attendance',
      iconSrc: '/student-section-icons/attendance.png',
      desc: 'Subject-wise class attendance, logs & warning metrics.',
      count: '86.4% Safe',
      badgeBg: '#DCFCE7',
      badgeColor: '#166534',
      previews: [
        { label: 'Cohort Rate', value: '238 Attended of 276 Conducted', highlight: true },
        { label: 'Statutory Status', value: 'Above 75% State Minimum (Eligible)' },
      ],
      onAction: () => navigateTo('attendance'),
    },
    {
      id: 'parent_connect',
      title: 'Parent Connect',
      iconSrc: '/student-section-icons/parent-connect.png',
      desc: 'A dedicated space for student-parent communication.',
      count: 'Calling Active',
      badgeBg: '#DCFCE7',
      badgeColor: '#166534',
      previews: [
        { label: 'Authorized Contacts', value: 'Father & Mother Verified', highlight: true },
        { label: 'Calling Hours', value: '05:00 PM – 08:30 PM Open' },
      ],
      onAction: () => navigateTo('parent-connect'),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 select-none">
      {/* ─────────────────────────────────────────────────────────────
          1. DASHBOARD VIEW (When activeModule === 'dashboard')
          ───────────────────────────────────────────────────────────── */}
      {activeModule === 'dashboard' && (
        <div className="space-y-6">
          {/* Student Welcome Banner (Exact #991117 design from sirmv_updated) */}
          <div
            className="rounded-2xl p-6 md:p-7 text-white shadow-md relative overflow-hidden"
            style={{ backgroundColor: '#991117' }}
          >
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-[#E5BD55]" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
                    style={{ background: '#FFE59A', color: '#500000' }}
                  >
                    <Sparkles size={13} /> Sir MV PU College • Student Tablet Hub
                  </div>

                  {/* I PU / II PU Toggle */}
                  <div className="inline-flex items-center bg-black/40 rounded-full p-0.5 border border-white/20">
                    {(['I PU', 'II PU'] as const).map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setPucYear(yr)}
                        className={`px-3 py-0.5 text-xs font-extrabold rounded-full transition cursor-pointer ${
                          pucYear === yr ? 'bg-white text-[#650000] shadow-xs' : 'text-white/80 hover:text-white'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>

                  {/* Student Gender / Persona Switcher */}
                  <div className="inline-flex items-center bg-black/40 rounded-full p-0.5 border border-white/20">
                    <button
                      type="button"
                      onClick={() => setStudentGender('Female')}
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full transition cursor-pointer flex items-center gap-1 ${
                        studentGender === 'Female' ? 'bg-[#FFE59A] text-[#500000]' : 'text-white/75 hover:text-white'
                      }`}
                      title="Switch to Female Student Profile"
                    >
                      <span>👩 Bhoomika</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentGender('Male')}
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full transition cursor-pointer flex items-center gap-1 ${
                        studentGender === 'Male' ? 'bg-[#FFE59A] text-[#500000]' : 'text-white/75 hover:text-white'
                      }`}
                      title="Switch to Male Student Profile"
                    >
                      <span>👨 Rahul</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <img
                    src={studentPhoto}
                    alt={studentName}
                    className="w-14 h-14 rounded-full object-cover ring-3 ring-[#FFE59A] shadow-md shrink-0 bg-white"
                  />
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      Welcome, <span className="text-[#FFE59A]">{studentName}</span>
                    </h1>
                    <p className="text-xs text-white/85 font-medium mt-0.5">
                      Roll No: <strong className="text-white">{studentRoll}</strong> • {pucYear} Science (PCMB / PCMC) • Shivamogga PU Campus
                    </p>
                    <p className="text-[11px] text-white/70">
                      Enrolled Tablet ID: <strong className="text-[#FFE59A]">TAB-042</strong> • Kiosk Strict Active
                    </p>
                  </div>
                </div>
              </div>

              {/* Animated Student Quick Metric Badges */}
              <div className="grid grid-cols-3 gap-2.5 shrink-0">
                <div className="bg-black/35 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-center min-w-[95px]">
                  <span className="text-[10px] uppercase font-bold text-white/70 block">Cohort Rank</span>
                  <span className="text-2xl font-black text-[#FFE59A] block mt-0.5">
                    #<AnimatedCounter value={16} duration={900} />
                  </span>
                  <span className="text-[10px] text-white/70 mt-0.5 block">Top 16% in CSE</span>
                </div>

                <div className="bg-black/35 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-center min-w-[95px]">
                  <span className="text-[10px] uppercase font-bold text-white/70 block">Attendance</span>
                  <span className="text-2xl font-black text-emerald-400 block mt-0.5">
                    <AnimatedCounter value={86.4} decimals={1} duration={1100} suffix="%" />
                  </span>
                  <span className="text-[10px] text-white/70 mt-0.5 block">Above 75% Safe</span>
                </div>

                <div className="bg-black/35 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-center min-w-[95px]">
                  <span className="text-[10px] uppercase font-bold text-white/70 block">Mock Score</span>
                  <span className="text-2xl font-black text-[#FFE59A] block mt-0.5">
                    <AnimatedCounter value={212} duration={1200} />
                  </span>
                  <span className="text-[10px] text-white/70 mt-0.5 block">/ 300 Marks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Heading */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
            <div>
              <h2 className="text-lg font-bold text-stone-900 font-heading">
                Your Student Workspace
              </h2>
              <p className="text-xs text-stone-500">
                Select any module below to open its dedicated dashboard and interactive materials.
              </p>
            </div>
            <span className="self-start sm:self-auto rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-bold text-stone-600 shadow-2xs">
              10 Interactive Modules Available
            </span>
          </div>

          {/* 10 Expandable Student Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
            {STUDENT_DASHBOARD_CARDS.map((card) => (
              <ExpandableDashboardCard
                key={card.id}
                card={card}
                isExpanded={expandedCardId === card.id}
                onHoverStart={() => setExpandedCardId(card.id)}
                onHoverEnd={() => setExpandedCardId(null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. EXAMS MODULE (tests)
          ───────────────────────────────────────────────────────────── */}
      {activeModule === 'tests' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { navigateTo('dashboard'); setLiveExamActive(false); }}
                className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="font-black text-xl text-stone-900 tracking-tight">
                  EXAMINATION & ASSESSMENT CENTER
                </h2>
                <p className="text-xs text-stone-500">
                  Live official examinations, timed evaluation terminal & competitive revision studio.
                </p>
              </div>
            </div>

            {/* Live vs Practice Toggle */}
            <div className="inline-flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => { setExamViewMode('live'); setLiveExamActive(false); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  examViewMode === 'live' ? 'bg-[#991117] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🔴 Live Exams (3 Available)
              </button>
              <button
                type="button"
                onClick={() => { setExamViewMode('practice'); setLiveExamActive(false); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  examViewMode === 'practice' ? 'bg-[#991117] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🎯 Practice Studio
              </button>
            </div>
          </div>

          {/* Active Live Exam Taking Terminal */}
          {liveExamActive && !examSubmitted && (
            <div className="bg-white rounded-2xl p-6 border-2 border-[#991117] shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    Kiosk Lockdown Enforced
                  </span>
                  <h3 className="text-lg font-black text-stone-900 mt-1">
                    JEE Main All India Mock Assessment 03 [DEMO]
                  </h3>
                </div>
                <div className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-bold font-mono">
                  <Clock size={14} className="text-amber-400" />
                  <span>Time Left: 54m 32s</span>
                </div>
              </div>

              {/* Question Body */}
              {DEMO_MCQ_QUESTIONS[activeQuestionIdx] && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-500">
                    <span>Question {activeQuestionIdx + 1} of {DEMO_MCQ_QUESTIONS.length}</span>
                    <span className="text-[#991117]">{DEMO_MCQ_QUESTIONS[activeQuestionIdx].subject} • +4 / -1</span>
                  </div>

                  <p className="text-base font-bold text-stone-900 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200">
                    {DEMO_MCQ_QUESTIONS[activeQuestionIdx].questionText}
                  </p>

                  <div className="grid grid-cols-1 gap-2.5 pt-2">
                    {DEMO_MCQ_QUESTIONS[activeQuestionIdx].options.map((opt) => {
                      const isSelected = selectedAnswers[activeQuestionIdx] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedAnswers({ ...selectedAnswers, [activeQuestionIdx]: opt.id })}
                          className={`text-left p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-red-50 border-[#991117] text-[#991117] font-bold shadow-2xs'
                              : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSelected ? 'bg-[#991117] text-white' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {opt.id.toUpperCase()}
                            </span>
                            {opt.text}
                          </span>
                          {isSelected && <Check size={16} className="text-[#991117]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Question Navigation Palette & Submit */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-stone-200">
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {DEMO_MCQ_QUESTIONS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveQuestionIdx(i)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition shrink-0 ${
                        activeQuestionIdx === i
                          ? 'bg-[#991117] text-white ring-2 ring-[#991117]/30'
                          : selectedAnswers[i]
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={activeQuestionIdx === 0}
                    onClick={() => setActiveQuestionIdx(prev => Math.max(0, prev - 1))}
                    className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={activeQuestionIdx === DEMO_MCQ_QUESTIONS.length - 1}
                    onClick={() => setActiveQuestionIdx(prev => Math.min(DEMO_MCQ_QUESTIONS.length - 1, prev + 1))}
                    className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitLiveExam}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition"
                  >
                    Submit Paper
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Exam Result Dialog */}
          {examSubmitted && (
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" /> Assessment Submitted Successfully
                </span>
                <h3 className="text-xl font-black text-emerald-950 mt-1">
                  Evaluation Complete: {examScore} Marks Scored
                </h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Your response sheet has been synced with the institutional examination registry.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setExamSubmitted(false); setLiveExamActive(false); }}
                className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition"
              >
                Back to Exams List
              </button>
            </div>
          )}

          {/* Live Exams List */}
          {examViewMode === 'live' && !liveExamActive && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700">
                    Live Assessment • Mandatory
                  </span>
                  <span className="text-xs font-bold text-stone-500">60 Mins</span>
                </div>
                <div>
                  <h4 className="font-black text-base text-stone-900">
                    JEE Main All India Mock Assessment 03 [DEMO]
                  </h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Physics, Chemistry, Mathematics • 30 Questions • Negative marking active
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-600 font-medium">
                  <span>Starts: Today, 09:00 AM</span>
                  <button
                    type="button"
                    onClick={handleStartLiveExam}
                    className="px-4 py-2 bg-[#991117] hover:bg-[#800e13] text-white text-xs font-bold rounded-xl transition shadow-2xs"
                  >
                    Start Exam Now →
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                    Scheduled Tomorrow
                  </span>
                  <span className="text-xs font-bold text-stone-500">180 Mins</span>
                </div>
                <div>
                  <h4 className="font-black text-base text-stone-900">
                    II PU Physics Unit Test 02 (Wave & Ray Optics)
                  </h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Derivations, Ray Diagrams, Numerical Problems • 70 Marks Theory
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500 font-medium">
                  <span>Starts: Tomorrow, 10:00 AM</span>
                  <span className="px-3 py-1.5 bg-stone-100 text-stone-500 text-xs font-bold rounded-xl">
                    Locked
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Practice Studio */}
          {examViewMode === 'practice' && (
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
              <h3 className="text-base font-black text-stone-900">
                Custom Revision Studio & Diagnostic Practice
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Target Track</label>
                  <select
                    value={practiceTrack}
                    onChange={(e) => setPracticeTrack(e.target.value as ExamCategory)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  >
                    <option value="JEE">JEE Main / Advanced</option>
                    <option value="NEET">NEET UG</option>
                    <option value="CET">KCET State Entrance</option>
                    <option value="PU Board Theory">PU Board Theory</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Subject</label>
                  <select
                    value={practiceSubject}
                    onChange={(e) => setPracticeSubject(e.target.value as PUCSubject)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Questions</label>
                  <select
                    value={practiceQCount}
                    onChange={(e) => setPracticeQCount(Number(e.target.value))}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  >
                    <option value={10}>10 Questions (Quick Quiz)</option>
                    <option value={25}>25 Questions (Chapter Test)</option>
                    <option value={50}>50 Questions (Full Unit Drill)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Difficulty</label>
                  <select
                    value={practiceDifficulty}
                    onChange={(e) => setPracticeDifficulty(e.target.value as any)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  >
                    <option value="Foundation">Foundation</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Advanced">Advanced (High Difficulty)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => alert(`Generated ${practiceQCount} ${practiceDifficulty} questions for ${practiceSubject} (${practiceTrack}). Practice session ready.`)}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-black rounded-xl transition shadow-2xs"
                >
                  Generate Practice Test →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. RESULTS & MARKS MODULE (reports)
          ───────────────────────────────────────────────────────────── */}
      {activeModule === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="font-black text-xl text-stone-900 tracking-tight">
                  ACADEMIC PERFORMANCE & RESULTS
                </h2>
                <p className="text-xs text-stone-500">
                  Performance analytics, test scorecards & detailed question review.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 self-start sm:self-auto">
              ● Recent Benchmark: 70.7% (Rank #16)
            </span>
          </div>

          {/* Spotlight Card: Latest Evaluated Exam */}
          <div className="bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7]/60 to-[#FDE68A]/30 rounded-3xl p-6 border border-[#FCD34D] shadow-sm relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#78350F] text-white">
                    Latest Evaluated Paper
                  </span>
                  <span className="text-xs font-bold text-[#92400E]">Nov 02, 2026</span>
                </div>
                <h3 className="text-2xl font-black text-[#78350F] tracking-tight">
                  JEE Main All India Mock Assessment 02
                </h3>
                <p className="text-xs text-stone-600 max-w-xl">
                  Conducted by Senior Faculty & Examination Board. Overall accuracy: <strong>56 Correct • 12 Incorrect • 7 Unattempted</strong>. Time spent: 168 mins.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewExamModal(MOCK_EXAM_RESULTS[0])}
                    className="px-4 py-2 bg-[#78350F] hover:bg-[#602a0b] text-white text-xs font-black rounded-xl transition shadow-xs flex items-center gap-2"
                  >
                    <span>View Deep Question Breakdown</span>
                    <ArrowLeft size={14} className="rotate-180" />
                  </button>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-3 w-full lg:w-[320px] shrink-0">
                <div className="p-3 bg-white/80 rounded-2xl border border-[#FCD34D] text-center">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Score</span>
                  <span className="text-xl font-black text-[#991117] block mt-0.5">212<span className="text-xs font-normal text-stone-400">/300</span></span>
                  <span className="text-[10px] text-stone-500 block">70.7%</span>
                </div>

                <div className="p-3 bg-white/80 rounded-2xl border border-[#FCD34D] text-center">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Cohort Rank</span>
                  <span className="text-xl font-black text-emerald-700 block mt-0.5">#16</span>
                  <span className="text-[10px] text-stone-500 block">of 100</span>
                </div>

                <div className="p-3 bg-white/80 rounded-2xl border border-[#FCD34D] text-center">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Percentile</span>
                  <span className="text-xl font-black text-blue-700 block mt-0.5">84.2%</span>
                  <span className="text-[10px] text-stone-500 block">Top 16%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Past Exam Records List */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-stone-900">Past Examinations History</h3>
            <div className="divide-y divide-stone-100">
              {MOCK_EXAM_RESULTS.map((exam) => (
                <div key={exam.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 mr-2">
                      {exam.category}
                    </span>
                    <span className="font-bold text-sm text-stone-900">{exam.examName}</span>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {exam.date} • {exam.marksObtained} / {exam.totalMarks} Marks ({exam.percentage}%) • Rank #{exam.cohortRank}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewExamModal(exam)}
                    className="px-3.5 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold transition self-start sm:self-auto"
                  >
                    View Diagnostic Sheet
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. ANNOUNCEMENTS MODULE (announcements)
          ───────────────────────────────────────────────────────────── */}
      {(activeModule === 'announcements' || activeModule === 'noticeboard') && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="font-black text-xl text-stone-900 tracking-tight">
                  OFFICIAL ANNOUNCEMENTS & CIRCULARS
                </h2>
                <p className="text-xs text-stone-500">
                  Direct official broadcasts from Principal, HODs, and subject teachers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(['All', 'Principal', 'HOD', 'Teacher'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAnnouncementCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    announcementCategoryFilter === cat
                      ? 'bg-[#991117] text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {PUC_ANNOUNCEMENTS
              .filter(a => announcementCategoryFilter === 'All' || a.category === announcementCategoryFilter)
              .map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-2 hover:border-[#991117]/40 transition"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        ann.category === 'Principal'
                          ? 'bg-purple-100 text-purple-900'
                          : ann.category === 'HOD'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {ann.category}: {ann.senderName}
                      </span>
                      {ann.isUrgent && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                          Urgent
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-stone-400 font-medium">{ann.date}</span>
                  </div>

                  <h3 className="font-black text-base text-stone-900">{ann.title}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">{ann.message}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. NOTES MODULE (notes)
          ───────────────────────────────────────────────────────────── */}
      {activeModule === 'notes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="font-black text-xl text-stone-900 tracking-tight">VERIFIED LECTURE NOTES</h2>
                <p className="text-xs text-stone-500">Curated unit-wise documents & lecture slides for PU Board & KCET/JEE.</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700">8 Verified Documents</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { sub: 'Physics', title: 'Wave Optics: Huygens Principle & Interference', prof: 'Dr. Mahendra V', size: '4.2 MB', pages: '32 Pages' },
              { sub: 'Physics', title: 'Ray Optics Derivations & Prism Formulae', prof: 'Dr. Mahendra V', size: '5.8 MB', pages: '44 Pages' },
              { sub: 'Chemistry', title: 'Coordination Compounds Nomenclature & CFT', prof: 'Dr. Shobha Rani', size: '3.1 MB', pages: '28 Pages' },
              { sub: 'Chemistry', title: 'Haloalkanes & Haloarenes Reaction Mechanisms', prof: 'Dr. Shobha Rani', size: '4.7 MB', pages: '36 Pages' },
              { sub: 'Mathematics', title: 'Definite Integrals Properties & Proofs', prof: 'Prof. K. N. Sridhar', size: '6.2 MB', pages: '52 Pages' },
              { sub: 'Mathematics', title: 'Differential Equations Linear Form Practice', prof: 'Prof. K. N. Sridhar', size: '3.9 MB', pages: '26 Pages' },
            ].map((note, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                  {note.sub}
                </span>
                <h4 className="font-black text-sm text-stone-900 line-clamp-2">{note.title}</h4>
                <p className="text-[11px] text-stone-500">{note.prof} • {note.pages} • {note.size}</p>
                <button
                  type="button"
                  onClick={() => alert(`Downloading verified document: ${note.title}`)}
                  className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Download size={14} /> Download PDF Note
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. STUDY MATERIALS MODULE (materials)
          ───────────────────────────────────────────────────────────── */}
      {activeModule === 'materials' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="font-black text-xl text-stone-900 tracking-tight">MULTIMEDIA & STUDY MATERIALS</h2>
                <p className="text-xs text-stone-500">Video lectures, question banks, formula sheets and competitive kits.</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700">14 Resources Available</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { type: 'Video Lecture', title: 'Electrostatics Complete Chapter Revision (4K)', duration: '1h 42m', faculty: 'Physics Department' },
              { type: 'Question Bank', title: 'KCET Top 500 Physics & Chemistry MCQs', duration: '500 Qs', faculty: 'Exam Wing' },
              { type: 'Formula Sheet', title: 'Master Formula Handbook for PUC II Mathematics', duration: '18 Pages', faculty: 'Prof. Sridhar' },
              { type: 'Video Lecture', title: 'Organic Chemistry Name Reactions Deep Dive', duration: '2h 10m', faculty: 'Chemistry Department' },
              { type: 'Worksheet', title: 'Calculus Advanced Problem Set #04 with Solutions', duration: '30 Problems', faculty: 'Mathematics Department' },
              { type: 'Video Lecture', title: 'Wave Optics Interference & Diffraction Simulator', duration: '58m', faculty: 'Physics Lab Team' },
            ].map((mat, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                  {mat.type}
                </span>
                <h4 className="font-black text-sm text-stone-900">{mat.title}</h4>
                <p className="text-[11px] text-stone-500">{mat.faculty} • {mat.duration}</p>
                <button
                  type="button"
                  onClick={() => alert(`Opening resource: ${mat.title}`)}
                  className="w-full py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Play size={14} /> Open Resource
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. TIMETABLE MODULE (timetable)
          ───────────────────────────────────────────────────────────── */}
      {activeModule === 'timetable' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="font-black text-xl text-stone-900 tracking-tight">WEEKLY ACADEMIC TIMETABLE</h2>
                <p className="text-xs text-stone-500">Daily lectures, laboratory practical periods & faculty assignments.</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700">Section 24PUC-A</span>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Day</th>
                  <th className="p-3.5">Period</th>
                  <th className="p-3.5">Time</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Faculty</th>
                  <th className="p-3.5">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {DEMO_TIMETABLE.map((t, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/80 transition">
                    <td className="p-3.5 font-bold text-stone-900">{t.day}</td>
                    <td className="p-3.5 font-mono">Period {t.period}</td>
                    <td className="p-3.5 text-stone-600">{t.time}</td>
                    <td className="p-3.5 font-bold text-[#991117]">{t.subject}</td>
                    <td className="p-3.5 text-stone-600">{t.teacherName}</td>
                    <td className="p-3.5 font-mono">{t.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. CALENDAR MODULE (college-calendar)
          ───────────────────────────────────────────────────────────── */}
      {activeModule === 'college-calendar' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="font-black text-xl text-stone-900 tracking-tight">ACADEMIC & EXAMINATION CALENDAR</h2>
                <p className="text-xs text-stone-500">Monthly schedule for examinations, holidays, and college events.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
              <h3 className="font-black text-sm text-stone-900">November 2026 Schedule</h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-red-900 block">Nov 18 – 25, 2026</strong>
                    <span className="text-red-700 text-[11px]">Internal Assessment 02 (IA-2)</span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white">Exam</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-amber-900 block">Nov 28, 2026</strong>
                    <span className="text-amber-800 text-[11px]">Kanakadasa Jayanti (College Holiday)</span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-600 text-white">Holiday</span>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-blue-900 block">Dec 01, 2026</strong>
                    <span className="text-blue-800 text-[11px]">All India Mock JEE Series 04</span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-600 text-white">Sunday Mock</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
              <h3 className="font-black text-sm text-stone-900">Important Academic Deadlines</h3>
              <div className="space-y-2 text-xs text-stone-700">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <strong>Practical Lab Record Submission</strong>
                  <p className="text-[11px] text-stone-500 mt-0.5">Physics & Chemistry lab journals must be submitted by Nov 27.</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <strong>Pre-Board Examination 01</strong>
                  <p className="text-[11px] text-stone-500 mt-0.5">Full syllabus board mock tests commence from January 04, 2027.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          9. ATTENDANCE MODULE (attendance)
          ───────────────────────────────────────────────────────────── */}
      {activeModule === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="font-black text-xl text-stone-900 tracking-tight">LECTURE ATTENDANCE REGISTRY</h2>
                <p className="text-xs text-stone-500">Statutory attendance logs, class presence and eligibility gauge.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                Overall: 86.4% (Eligible for Board Exams)
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Conducted</span>
              <span className="text-2xl font-black text-stone-900 block mt-0.5">276</span>
              <span className="text-[10px] text-stone-500">Total lectures</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Attended</span>
              <span className="text-2xl font-black text-emerald-600 block mt-0.5">238</span>
              <span className="text-[10px] text-stone-500">Present</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Missed</span>
              <span className="text-2xl font-black text-rose-600 block mt-0.5">38</span>
              <span className="text-[10px] text-stone-500">Leaves / Absent</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Minimum Req</span>
              <span className="text-2xl font-black text-blue-600 block mt-0.5">75%</span>
              <span className="text-[10px] text-stone-500">Board Statutory</span>
            </div>
          </div>

          {/* Subject Attendance Breakdown Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200 font-black text-sm text-stone-900">
              Subject-wise Presence & Eligibility Status
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Lectures Conducted</th>
                  <th className="p-3.5">Lectures Attended</th>
                  <th className="p-3.5">Percentage</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {[
                  { sub: 'Physics (Theory + Practical)', total: 64, att: 58, pct: 90.6, status: 'Excellent' },
                  { sub: 'Chemistry (Theory + Practical)', total: 60, att: 51, pct: 85.0, status: 'Safe' },
                  { sub: 'Mathematics', total: 68, att: 62, pct: 91.1, status: 'Excellent' },
                  { sub: 'Computer Science (Theory + Lab)', total: 48, att: 41, pct: 85.4, status: 'Safe' },
                  { sub: 'English & Kannada (Languages)', total: 36, att: 26, pct: 72.2, status: 'Attention Needed' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-stone-50/80 transition">
                    <td className="p-3.5 font-bold text-stone-900">{row.sub}</td>
                    <td className="p-3.5 font-mono">{row.total}</td>
                    <td className="p-3.5 font-mono text-emerald-600 font-bold">{row.att}</td>
                    <td className="p-3.5 font-bold">{row.pct}%</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        row.pct >= 85 ? 'bg-emerald-100 text-emerald-900' : row.pct >= 75 ? 'bg-blue-100 text-blue-900' : 'bg-red-100 text-red-900'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          10. COMPLAINT BOX MODULE (complaints)
          ───────────────────────────────────────────────────────────── */}
      {activeModule === 'complaints' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="font-black text-xl text-stone-900 tracking-tight">CAMPUS GRIEVANCE & COMPLAINTS CELL</h2>
                <p className="text-xs text-stone-500">Submit and track academic, classroom, hostel or transport concerns.</p>
              </div>
            </div>
          </div>

          {complaintSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Grievance submitted successfully. Your reference ticket has been logged with campus administration.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submit Grievance Form */}
            <form onSubmit={handlePostComplaint} className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-stone-900">Submit a New Grievance</h3>

              <div>
                <label className="text-[11px] font-bold text-stone-500 block mb-1">Concern Category</label>
                <select
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                >
                  <option value="Academic">Academic / Faculty Concern</option>
                  <option value="Classroom Infrastructure">Classroom Infrastructure & Equipment</option>
                  <option value="Hostel & Mess">Hostel, Accommodation & Mess</option>
                  <option value="Transport & Bus">College Transport & Bus Route</option>
                  <option value="Tablet & MDM">Student Tablet / Kiosk Technical Issue</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 block mb-1">Subject / Summary</label>
                <input
                  type="text"
                  placeholder="e.g. Projector replacement in Room 204"
                  value={complaintTitle}
                  onChange={(e) => setComplaintTitle(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-stone-200 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 block mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  placeholder="Explain the concern clearly with room numbers and dates..."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-stone-200 bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#991117] hover:bg-[#800e13] text-white text-xs font-black rounded-xl transition shadow-2xs"
              >
                Submit Ticket to Grievance Cell
              </button>
            </form>

            {/* Active & Past Grievance Cases */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-stone-900">Your Submitted Tickets</h3>
              <div className="space-y-3">
                {complaintsList.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-stone-200 space-y-1.5 bg-stone-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-stone-500">{c.ref}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-stone-900">{c.title}</h4>
                    <p className="text-[10px] text-stone-500">{c.cat} • {c.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          11. PARENT CONNECT MODULE (parent-connect)
          ───────────────────────────────────────────────────────────── */}
      {activeModule === 'parent-connect' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="font-black text-xl text-stone-900 tracking-tight">PARENT CONNECT VOICE GATEWAY</h2>
                <p className="text-xs text-stone-500">Student hostel-to-parent telephony gateway & calling window.</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
              ● Voice Telephony Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                Authorized Parent Contacts
              </span>
              <h3 className="text-base font-black text-stone-900">Registered Family Numbers</h3>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl border border-stone-200 flex items-center justify-between bg-stone-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FFE59A] text-[#500000] font-black text-sm flex items-center justify-center">
                      F
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-stone-900">Mr. Suresh Naik (Father)</h4>
                      <p className="text-[10px] text-stone-500 font-mono">+91 98450 12345 • Authorized</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Initiating secure WebRTC voice call to Father (Mr. Suresh Naik)...')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <Phone size={13} /> Call Father
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 flex items-center justify-between bg-stone-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FFE59A] text-[#500000] font-black text-sm flex items-center justify-center">
                      M
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-stone-900">Mrs. Geetha Naik (Mother)</h4>
                      <p className="text-[10px] text-stone-500 font-mono">+91 94480 67890 • Authorized</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Initiating secure WebRTC voice call to Mother (Mrs. Geetha Naik)...')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <Phone size={13} /> Call Mother
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900">
                Calling Window Maintenance
              </span>
              <h3 className="text-base font-black text-stone-900">Permitted Timings & Talk Time</h3>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span className="text-stone-500">Today Calling Window:</span>
                  <strong className="text-stone-900">05:00 PM – 08:30 PM (Evening)</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span className="text-stone-500">Remaining Talk Time:</span>
                  <strong className="text-emerald-700">14 mins 30 secs</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-500">Sunday Special Window:</span>
                  <strong className="text-stone-900">09:00 AM – 09:00 PM (All Day)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          12. DEEP QUESTION DIAGNOSTIC MODAL (ExamMCQReviewModal)
          ───────────────────────────────────────────────────────────── */}
      {reviewExamModal && (
        <ExamMCQReviewModal
          exam={reviewExamModal}
          onClose={() => setReviewExamModal(null)}
          sidebarWidth={86}
        />
      )}
    </div>
  );
};

export default StudentTabView;

