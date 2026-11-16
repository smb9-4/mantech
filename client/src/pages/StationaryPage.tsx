import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CircleDollarSign,
  PackageCheck,
  Search,
  X,
  XCircle
} from 'lucide-react';
import { INITIAL_STUDENTS } from '../data/mockInstitutionalData';
import { portraitSvg } from '../utils/portrait';

const MATERIALS = [
  { key: 'pen', label: 'Pen' },
  { key: 'tab', label: 'Tab' },
  { key: 'bag', label: 'Bag' },
  { key: 'books', label: 'Books' },
  { key: 'studyMaterials', label: 'Study materials' },
  { key: 'uniform', label: 'Uniform' }
] as const;

type MaterialKey = (typeof MATERIALS)[number]['key'];

type StationaryStudent = {
  id: string;
  name: string;
  registerNumber: string;
  photoUrl?: string;
  className: string;
  sectionName: string;
  totalFee: number;
  paidFee: number;
  materials: Record<MaterialKey, boolean>;
};

const TOTAL_FEE = 48000;
const FEE_PAID = [48000, 36000, 48000, 24000, 0, 48000, 32000, 48000, 16000, 48000, 40000, 0];

const STUDENTS: StationaryStudent[] = INITIAL_STUDENTS.slice(0, 12).map((student, index) => ({
  id: student.id,
  name: student.name,
  registerNumber: student.register_number,
  photoUrl: `data:image/svg+xml;utf8,${encodeURIComponent(portraitSvg({
    seed: student.id,
    gender: student.gender === 'Female' ? 'Female' : 'Male',
    age: 17,
    role: 'student'
  }))}`,
  className: student.class_name || '2 PUC',
  sectionName: student.section_name || 'A',
  totalFee: TOTAL_FEE,
  paidFee: FEE_PAID[index % FEE_PAID.length],
  materials: {
    pen: index % 5 !== 2,
    tab: index % 4 !== 1,
    bag: index % 6 !== 3,
    books: index % 5 !== 4,
    studyMaterials: index % 3 !== 1,
    uniform: index % 4 !== 2
  }
}));

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const initials = (name: string) =>
  name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

function StudentAvatar({ student, size = 'normal' }: { student: StationaryStudent; size?: 'normal' | 'large' }) {
  const [imageFailed, setImageFailed] = useState(false);
  const dimensions = size === 'large' ? 'w-16 h-16 text-lg' : 'w-10 h-10 text-xs';

  return (
    <span className={`${dimensions} relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f3e8d8] font-bold text-[#8c4c28] ring-2 ring-white`}>
      {!imageFailed && student.photoUrl && (
        <img
          src={student.photoUrl}
          alt={`${student.name} profile`}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      )}
      {(!student.photoUrl || imageFailed) && initials(student.name)}
    </span>
  );
}

function ProgressRing({ value, color, label, detail }: { value: number; color: string; label: string; detail: string }) {
  const percentage = Math.max(0, Math.min(100, value));

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div
        role="img"
        aria-label={`${label}: ${percentage}%`}
        className="relative flex h-32 w-32 items-center justify-center rounded-full p-2"
        style={{ background: `conic-gradient(${color} ${percentage}%, #e7e5e4 ${percentage}% 100%)` }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
          <span className="text-2xl font-black text-slate-900">{percentage}%</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-600">{detail}</p>
    </div>
  );
}

export const StationaryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StationaryStudent | null>(null);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return STUDENTS;
    return STUDENTS.filter((student) =>
      `${student.name} ${student.registerNumber} ${student.className} ${student.sectionName}`.toLowerCase().includes(query)
    );
  }, [search]);

  const paidCount = STUDENTS.filter((student) => student.paidFee >= student.totalFee).length;
  const distributedCount = STUDENTS.filter((student) => MATERIALS.every((material) => student.materials[material.key])).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="group flex items-center gap-4 rounded-2xl border border-[#ded9cf] bg-[#fdfcfb] p-5 transition-all hover:-translate-y-0.5 hover:border-[#c9a879] hover:shadow-md">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CircleDollarSign className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-500">Fees fully paid</p>
            <p className="text-2xl font-black text-slate-900">{paidCount}<span className="ml-1 text-sm font-semibold text-slate-400">/ {STUDENTS.length}</span></p>
          </div>
        </div>
        <div className="group flex items-center gap-4 rounded-2xl border border-[#ded9cf] bg-[#fdfcfb] p-5 transition-all hover:-translate-y-0.5 hover:border-[#c9a879] hover:shadow-md">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <PackageCheck className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-500">All materials distributed</p>
            <p className="text-2xl font-black text-slate-900">{distributedCount}<span className="ml-1 text-sm font-semibold text-slate-400">/ {STUDENTS.length}</span></p>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#ded9cf] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Student stationery register</h2>
            <p className="mt-1 text-xs text-slate-500">Select a student to view fee and supply progress.</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students..."
              className="w-full rounded-xl border border-stone-200 bg-[#fdfcfb] py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#a41419] focus:ring-2 focus:ring-[#a41419]/10"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-[#faf8f4] text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-[#faf8f4] px-4 py-3 sm:px-5">Student</th>
                <th scope="col" className="px-3 py-3">Fee</th>
                {MATERIALS.map((material) => <th scope="col" key={material.key} className="px-3 py-3 text-center">{material.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredStudents.map((student) => {
                const feePaid = student.paidFee >= student.totalFee;
                return (
                  <tr
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedStudent(student); } }}
                    tabIndex={0}
                    aria-label={`View ${student.name} stationery and fees`}
                    className="group cursor-pointer transition-colors hover:bg-[#fcf8f2] focus:bg-[#fcf8f2] focus:outline-none"
                  >
                    <td className="sticky left-0 bg-white px-4 py-3 transition-colors group-hover:bg-[#fcf8f2] sm:px-5">
                      <div className="flex items-center gap-3">
                        <StudentAvatar student={student} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">{student.name}</p>
                          <p className="text-[11px] text-slate-500">{student.registerNumber} · {student.className} {student.sectionName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${feePaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {feePaid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                        {feePaid ? 'Paid' : 'Due'}
                      </span>
                    </td>
                    {MATERIALS.map((material) => (
                      <td className="px-3 py-3 text-center" key={material.key}>
                        {student.materials[material.key]
                          ? <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Received" />
                          : <X className="mx-auto h-4 w-4 text-slate-300" aria-label="Not received" />}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={MATERIALS.length + 2} className="px-5 py-12 text-center text-sm text-slate-500">No students match “{search}”.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-stone-100 px-5 py-3 text-[11px] font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Received</span>
          <span className="inline-flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 text-slate-300" /> Pending</span>
          <span className="ml-auto">{filteredStudents.length} students</span>
        </div>
      </section>

      {selectedStudent && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedStudent(null); }}
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="stationary-student-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/60 bg-[#fdfcfb] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <header className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-4">
                <StudentAvatar student={selectedStudent} size="large" />
                <div>
                  <h2 id="stationary-student-title" className="text-lg font-black text-slate-900">{selectedStudent.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">{selectedStudent.registerNumber} · {selectedStudent.className} {selectedStudent.sectionName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                aria-label="Close student details"
                className="rounded-xl p-2 text-slate-500 transition hover:bg-stone-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-6 p-5 sm:p-7">
              <div className="grid gap-6 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2 sm:p-6">
                <ProgressRing
                  value={Math.round((selectedStudent.paidFee / selectedStudent.totalFee) * 100)}
                  color={selectedStudent.paidFee >= selectedStudent.totalFee ? '#059669' : '#d97706'}
                  label={selectedStudent.paidFee >= selectedStudent.totalFee ? 'Paid' : 'Fee paid'}
                  detail={`${formatCurrency(selectedStudent.paidFee)} of ${formatCurrency(selectedStudent.totalFee)}`}
                />
                <ProgressRing
                  value={Math.round((MATERIALS.filter((material) => selectedStudent.materials[material.key]).length / MATERIALS.length) * 100)}
                  color="#2563eb"
                  label="Materials"
                  detail={`${MATERIALS.filter((material) => selectedStudent.materials[material.key]).length} of ${MATERIALS.length} received`}
                />
              </div>

              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Distribution checklist</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {MATERIALS.map((material) => {
                    const received = selectedStudent.materials[material.key];
                    return (
                      <div key={material.key} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3">
                        <span className="text-sm font-semibold text-slate-700">{material.label}</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${received ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {received ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {received ? 'Received' : 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
