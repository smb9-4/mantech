import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  Plus,
  X,
  Edit2,
  Check,
  ChevronDown,
  Printer,
  Sparkles,
  Award,
  Users,
  CheckCircle2
} from 'lucide-react';
import { portraitUrl } from '../utils/portrait';
import { guessGender } from '../utils/userPortrait';

export interface BoardStudentMark {
  id: string;
  name: string;
  roll: string;
  puYear: 'I PU' | 'II PU';
  stream: 'PCMB' | 'PCMC' | 'PCMS';
  fourthSubject: 'Biology' | 'Computer Science' | 'Statistics';
  physics: number;
  chemistry: number;
  maths: number;
  fourthMarks: number;
}

const DEFAULT_BOARD_MARKS_DATA: BoardStudentMark[] = [
  // ── I PU STUDENTS (20 students) ──
  { id: '1pu-01', name: 'Bhoomika Naik', roll: '25PUC101', puYear: 'I PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 94, chemistry: 91, maths: 98, fourthMarks: 96 },
  { id: '1pu-02', name: 'Rahul Sharma', roll: '25PUC102', puYear: 'I PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 89, chemistry: 92, maths: 96, fourthMarks: 95 },
  { id: '1pu-03', name: 'Ananya Hegde', roll: '25PUC103', puYear: 'I PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 95, chemistry: 94, maths: 92, fourthMarks: 98 },
  { id: '1pu-04', name: 'Aditya Patil', roll: '25PUC104', puYear: 'I PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 87, chemistry: 85, maths: 94, fourthMarks: 91 },
  { id: '1pu-05', name: 'Bhavana Gowda', roll: '25PUC105', puYear: 'I PU', stream: 'PCMS', fourthSubject: 'Statistics', physics: 86, chemistry: 88, maths: 90, fourthMarks: 93 },
  { id: '1pu-06', name: 'Chetan Kumar', roll: '25PUC106', puYear: 'I PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 82, chemistry: 84, maths: 88, fourthMarks: 85 },
  { id: '1pu-07', name: 'Deepa Kulkarni', roll: '25PUC107', puYear: 'I PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 92, chemistry: 90, maths: 99, fourthMarks: 97 },
  { id: '1pu-08', name: 'Farhan Ahmed', roll: '25PUC108', puYear: 'I PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 85, chemistry: 87, maths: 91, fourthMarks: 88 },
  { id: '1pu-09', name: 'Girish Murthy', roll: '25PUC109', puYear: 'I PU', stream: 'PCMS', fourthSubject: 'Statistics', physics: 84, chemistry: 82, maths: 93, fourthMarks: 89 },
  { id: '1pu-10', name: 'Harshita Rao', roll: '25PUC110', puYear: 'I PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 96, chemistry: 95, maths: 100, fourthMarks: 99 },
  { id: '1pu-11', name: 'Ishaan Joshi', roll: '25PUC111', puYear: 'I PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 88, chemistry: 86, maths: 92, fourthMarks: 90 },
  { id: '1pu-12', name: 'Jyothi Prasad', roll: '25PUC112', puYear: 'I PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 89, chemistry: 88, maths: 95, fourthMarks: 92 },
  { id: '1pu-13', name: 'Karthik Bhat', roll: '25PUC113', puYear: 'I PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 81, chemistry: 83, maths: 86, fourthMarks: 84 },
  { id: '1pu-14', name: 'Lavanya S', roll: '25PUC114', puYear: 'I PU', stream: 'PCMS', fourthSubject: 'Statistics', physics: 90, chemistry: 91, maths: 97, fourthMarks: 95 },
  { id: '1pu-15', name: 'Manoj Deshpande', roll: '25PUC115', puYear: 'I PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 83, chemistry: 85, maths: 89, fourthMarks: 88 },
  { id: '1pu-16', name: 'Nandini Shenoy', roll: '25PUC116', puYear: 'I PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 91, chemistry: 93, maths: 96, fourthMarks: 94 },
  { id: '1pu-17', name: 'Praveen Nayak', roll: '25PUC117', puYear: 'I PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 87, chemistry: 89, maths: 92, fourthMarks: 93 },
  { id: '1pu-18', name: 'Rakshita Shetty', roll: '25PUC118', puYear: 'I PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 93, chemistry: 95, maths: 98, fourthMarks: 97 },
  { id: '1pu-19', name: 'Sachin Poojary', roll: '25PUC119', puYear: 'I PU', stream: 'PCMS', fourthSubject: 'Statistics', physics: 79, chemistry: 81, maths: 85, fourthMarks: 86 },
  { id: '1pu-20', name: 'Tanvi Kulkarni', roll: '25PUC120', puYear: 'I PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 94, chemistry: 92, maths: 97, fourthMarks: 98 },

  // ── II PU STUDENTS (20 students) ──
  { id: '2pu-01', name: 'Abhinav Reddy', roll: '24PUC201', puYear: 'II PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 95, chemistry: 93, maths: 99, fourthMarks: 96 },
  { id: '2pu-02', name: 'Bindu Shree', roll: '24PUC202', puYear: 'II PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 97, chemistry: 96, maths: 98, fourthMarks: 99 },
  { id: '2pu-03', name: 'Chirag Gowda', roll: '24PUC203', puYear: 'II PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 84, chemistry: 86, maths: 90, fourthMarks: 88 },
  { id: '2pu-04', name: 'Divya Acharya', roll: '24PUC204', puYear: 'II PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 93, chemistry: 92, maths: 98, fourthMarks: 97 },
  { id: '2pu-05', name: 'Eashan Prabhu', roll: '24PUC205', puYear: 'II PU', stream: 'PCMS', fourthSubject: 'Statistics', physics: 89, chemistry: 87, maths: 95, fourthMarks: 94 },
  { id: '2pu-06', name: 'Fiza Khan', roll: '24PUC206', puYear: 'II PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 88, chemistry: 90, maths: 93, fourthMarks: 92 },
  { id: '2pu-07', name: 'Ganesh Pai', roll: '24PUC207', puYear: 'II PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 86, chemistry: 85, maths: 91, fourthMarks: 90 },
  { id: '2pu-08', name: 'Hamsini R', roll: '24PUC208', puYear: 'II PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 91, chemistry: 93, maths: 96, fourthMarks: 95 },
  { id: '2pu-09', name: 'Jagadish Holla', roll: '24PUC209', puYear: 'II PU', stream: 'PCMS', fourthSubject: 'Statistics', physics: 82, chemistry: 80, maths: 88, fourthMarks: 87 },
  { id: '2pu-10', name: 'Keerthana Mohan', roll: '24PUC210', puYear: 'II PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 96, chemistry: 97, maths: 100, fourthMarks: 99 },
  { id: '2pu-11', name: 'Likith Gowda', roll: '24PUC211', puYear: 'II PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 83, chemistry: 85, maths: 89, fourthMarks: 86 },
  { id: '2pu-12', name: 'Megha Kamath', roll: '24PUC212', puYear: 'II PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 94, chemistry: 95, maths: 98, fourthMarks: 97 },
  { id: '2pu-13', name: 'Nikhil Nayak', roll: '24PUC213', puYear: 'II PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 90, chemistry: 88, maths: 93, fourthMarks: 94 },
  { id: '2pu-14', name: 'Pooja Hegde', roll: '24PUC214', puYear: 'II PU', stream: 'PCMS', fourthSubject: 'Statistics', physics: 92, chemistry: 91, maths: 97, fourthMarks: 96 },
  { id: '2pu-15', name: 'Roshan D\'Souza', roll: '24PUC215', puYear: 'II PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 85, chemistry: 87, maths: 90, fourthMarks: 89 },
  { id: '2pu-16', name: 'Sahana K', roll: '24PUC216', puYear: 'II PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 95, chemistry: 94, maths: 99, fourthMarks: 98 },
  { id: '2pu-17', name: 'Tejas Kumar', roll: '24PUC217', puYear: 'II PU', stream: 'PCMB', fourthSubject: 'Biology', physics: 80, chemistry: 82, maths: 87, fourthMarks: 85 },
  { id: '2pu-18', name: 'Uma Maheshwari', roll: '24PUC218', puYear: 'II PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 92, chemistry: 93, maths: 97, fourthMarks: 96 },
  { id: '2pu-19', name: 'Varun Shastri', roll: '24PUC219', puYear: 'II PU', stream: 'PCMS', fourthSubject: 'Statistics', physics: 86, chemistry: 85, maths: 92, fourthMarks: 91 },
  { id: '2pu-20', name: 'Yashaswini Bhat', roll: '24PUC220', puYear: 'II PU', stream: 'PCMC', fourthSubject: 'Computer Science', physics: 98, chemistry: 99, maths: 100, fourthMarks: 100 },
];

export const BoardMarksPage: React.FC = () => {
  const [selectedPuYear, setSelectedPuYear] = useState<'I PU' | 'II PU'>('I PU');
  const [selectedStream, setSelectedStream] = useState<string>('ALL');
  const [selectedCycle, setSelectedCycle] = useState<string>('Cycle 1 - Mid Term Assessment');
  const [searchQuery, setSearchQuery] = useState('');
  const [marksList, setMarksList] = useState<BoardStudentMark[]>(DEFAULT_BOARD_MARKS_DATA);
  const [editingStudent, setEditingStudent] = useState<BoardStudentMark | null>(null);
  const [showAddCycleModal, setShowAddCycleModal] = useState(false);
  const [newCycleName, setNewCycleName] = useState('');

  // Filter records based on selected PU Year, Stream and Search Query
  const filteredRecords = useMemo(() => {
    return marksList.filter((record) => {
      if (record.puYear !== selectedPuYear) return false;
      if (selectedStream !== 'ALL' && record.stream !== selectedStream) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          record.name.toLowerCase().includes(q) ||
          record.roll.toLowerCase().includes(q) ||
          record.stream.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [marksList, selectedPuYear, selectedStream, searchQuery]);

  // Compute stats
  const totalCount = filteredRecords.length;
  const avgPct = totalCount > 0
    ? (filteredRecords.reduce((acc, r) => acc + (r.physics + r.chemistry + r.maths + r.fourthMarks) / 4, 0) / totalCount).toFixed(1)
    : '0.0';
  const distinctionCount = filteredRecords.filter((r) => ((r.physics + r.chemistry + r.maths + r.fourthMarks) / 4) >= 85).length;
  const passCount = filteredRecords.filter((r) => r.physics >= 35 && r.chemistry >= 35 && r.maths >= 35 && r.fourthMarks >= 35).length;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setMarksList((prev) =>
      prev.map((item) => (item.id === editingStudent.id ? editingStudent : item))
    );
    setEditingStudent(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-1 select-none">
      {/* ── Control Bar & Filters ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* 1. Drop down menu to select I PU or II PU */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Class:</label>
              <div className="relative">
                <select
                  value={selectedPuYear}
                  onChange={(e) => setSelectedPuYear(e.target.value as 'I PU' | 'II PU')}
                  className="appearance-none bg-[#8C1118] text-white font-black text-xs px-4 py-2 pr-9 rounded-xl shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8C1118]/40 transition"
                >
                  <option value="I PU">I PU (First Year PUC)</option>
                  <option value="II PU">II PU (Second Year PUC)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-white/90 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 2. Stream Filter Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Stream:</label>
              <div className="relative">
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
                >
                  <option value="ALL">All Streams (PCMB / PCMC / PCMS)</option>
                  <option value="PCMB">PCMB (Biology)</option>
                  <option value="PCMC">PCMC (Computer Science)</option>
                  <option value="PCMS">PCMS (Statistics)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 3. Cycle Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Exam:</label>
              <div className="relative">
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
                >
                  <option value="Cycle 1 - Mid Term Assessment">Cycle 1 (Mid-Term Assessment)</option>
                  <option value="Cycle 2 - Preparatory Board Exam">Cycle 2 (Preparatory Board Exam)</option>
                  <option value="Cycle 3 - Annual PU Board Mock">Cycle 3 (Annual PU Board Mock)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Add Cycle and Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setShowAddCycleModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Cycle</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Tabulation</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates by name, roll number, or combination (PCMB / PCMC)..."
            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8C1118]/20 focus:border-[#8C1118] transition"
          />
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Candidates</span>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1.5">
            {totalCount}
            <span className="text-[11px] font-semibold text-slate-400">in {selectedPuYear}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Class Average</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {avgPct}%
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Distinction (&ge;85%)</span>
          <div className="text-2xl font-black text-[#8C1118] mt-1 flex items-baseline gap-1.5">
            {distinctionCount}
            <span className="text-[11px] font-semibold text-slate-400">students</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Pass Rate</span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* ── Board Marks Registry Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 font-black uppercase tracking-wider text-[10px] w-14">Photo</th>
                <th className="py-3 px-4 font-black uppercase tracking-wider text-[10px]">Student Details</th>
                <th className="py-3 px-3 font-black uppercase tracking-wider text-[10px]">Roll No</th>
                <th className="py-3 px-3 font-black uppercase tracking-wider text-[10px]">Stream</th>
                <th className="py-3 px-3 font-black uppercase tracking-wider text-[10px] text-center bg-indigo-50/40 text-indigo-900">
                  Physics <span className="text-[9px] block text-slate-400 font-normal">/ 100</span>
                </th>
                <th className="py-3 px-3 font-black uppercase tracking-wider text-[10px] text-center bg-blue-50/40 text-blue-900">
                  Chemistry <span className="text-[9px] block text-slate-400 font-normal">/ 100</span>
                </th>
                <th className="py-3 px-3 font-black uppercase tracking-wider text-[10px] text-center bg-amber-50/40 text-amber-900">
                  Maths <span className="text-[9px] block text-slate-400 font-normal">/ 100</span>
                </th>
                <th className="py-3 px-3 font-black uppercase tracking-wider text-[10px] text-center bg-emerald-50/40 text-emerald-900">
                  CS / BIO / STAT <span className="text-[9px] block text-slate-400 font-normal">/ 100</span>
                </th>
                <th className="py-3 px-3 font-black uppercase tracking-wider text-[10px] text-center">
                  Total <span className="text-[9px] block text-slate-400 font-normal">/ 400</span>
                </th>
                <th className="py-3 px-3 font-black uppercase tracking-wider text-[10px] text-center">%</th>
                <th className="py-3 px-4 font-black uppercase tracking-wider text-[10px] text-center">Grade</th>
                <th className="py-3 px-3 font-black uppercase tracking-wider text-[10px] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => {
                const total = record.physics + record.chemistry + record.maths + record.fourthMarks;
                const pct = (total / 4).toFixed(1);
                const isDistinction = Number(pct) >= 85;
                const isFirstClass = Number(pct) >= 60 && Number(pct) < 85;
                const gender = guessGender(record.name);
                const photoSrc = portraitUrl({ seed: record.roll || record.id, gender, age: 17, role: 'student' });

                return (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student Image */}
                    <td className="py-2.5 px-4">
                      <img
                        src={photoSrc}
                        alt={record.name}
                        className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-2xs bg-slate-100"
                      />
                    </td>

                    {/* Student Name */}
                    <td className="py-2.5 px-4 font-black text-slate-900 whitespace-nowrap">
                      {record.name}
                      <span className="block text-[11px] font-normal text-slate-400">{record.puYear} Candidate</span>
                    </td>

                    {/* Roll Number */}
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {record.roll}
                    </td>

                    {/* Stream */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                        {record.stream}
                      </span>
                    </td>

                    {/* Physics */}
                    <td className="py-2.5 px-3 text-center font-bold text-indigo-950 bg-indigo-50/20">
                      {record.physics}
                    </td>

                    {/* Chemistry */}
                    <td className="py-2.5 px-3 text-center font-bold text-blue-950 bg-blue-50/20">
                      {record.chemistry}
                    </td>

                    {/* Maths */}
                    <td className="py-2.5 px-3 text-center font-bold text-amber-950 bg-amber-50/20">
                      {record.maths}
                    </td>

                    {/* 4th Subject (CS / BIO / STAT) */}
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-950 bg-emerald-50/20 whitespace-nowrap">
                      {record.fourthMarks}
                      <span className="block text-[9px] font-semibold text-emerald-700">
                        {record.fourthSubject === 'Computer Science'
                          ? 'CS'
                          : record.fourthSubject === 'Biology'
                          ? 'BIO'
                          : 'STAT'}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-2.5 px-3 text-center font-black text-slate-900">
                      {total}
                    </td>

                    {/* % */}
                    <td className="py-2.5 px-3 text-center font-black text-slate-900">
                      {pct}%
                    </td>

                    {/* Grade */}
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          isDistinction
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isFirstClass
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isDistinction ? 'Distinction' : isFirstClass ? 'First Class' : 'Second Class'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setEditingStudent({ ...record })}
                        title="Edit Marks"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#8C1118] hover:bg-red-50 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-sm text-slate-400">
                    No student records found matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit Marks Modal ── */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">Edit Board Marks</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {editingStudent.name} • {editingStudent.roll} ({editingStudent.puYear})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Physics (/100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingStudent.physics}
                    onChange={(e) => setEditingStudent({ ...editingStudent, physics: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[#8C1118]/20"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Chemistry (/100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingStudent.chemistry}
                    onChange={(e) => setEditingStudent({ ...editingStudent, chemistry: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[#8C1118]/20"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Mathematics (/100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingStudent.maths}
                    onChange={(e) => setEditingStudent({ ...editingStudent, maths: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[#8C1118]/20"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    {editingStudent.fourthSubject} (/100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingStudent.fourthMarks}
                    onChange={(e) => setEditingStudent({ ...editingStudent, fourthMarks: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[#8C1118]/20"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#8C1118] text-white text-xs font-bold shadow-xs hover:bg-[#720e14] transition"
                >
                  Save Marks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Cycle Modal ── */}
      {showAddCycleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900">Add Exam Assessment Cycle</h3>
              <button
                type="button"
                onClick={() => setShowAddCycleModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-[11px] font-bold text-slate-600">
                Cycle Name
                <input
                  type="text"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  placeholder="e.g. Cycle 4 - Special Preparatory"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium outline-none focus:ring-2 focus:ring-[#8C1118]/20"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (newCycleName.trim()) {
                    setSelectedCycle(newCycleName.trim());
                    setNewCycleName('');
                    setShowAddCycleModal(false);
                  }
                }}
                className="w-full py-2.5 bg-[#8C1118] text-white font-bold rounded-xl text-xs transition"
              >
                Create Cycle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardMarksPage;
