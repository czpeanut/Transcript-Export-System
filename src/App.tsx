import React, { useState } from 'react';
import { Subject, Grade, examData, abilityDescriptions } from './data';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function App() {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState<Subject>('math');
  const [grade, setGrade] = useState<Grade>('4');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentExam = examData[subject][grade];

  const handleAnswerChange = (id: number, value: string) => {
    const upperValue = value.toUpperCase();
    const finalValue = upperValue.slice(-1); // Take the last character typed
    
    setAnswers(prev => ({ ...prev, [id]: finalValue }));

    // Auto jump if it's A, B, C, or D
    if (['A', 'B', 'C', 'D'].includes(finalValue)) {
      setTimeout(() => {
        const nextInput = document.getElementById(`input-${id + 1}`);
        if (nextInput) {
          nextInput.focus();
        }
      }, 10);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setAnswers({});
  };

  if (isSubmitted) {
    return <ReportCard name={name} subject={subject} grade={grade} answers={answers} onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen bg-[#f8f5f1] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">學力檢測成績單產生器</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">姓名</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">科目</label>
                <select
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value as Subject);
                    setAnswers({});
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                  <option value="math">數學科</option>
                  <option value="english">英文科</option>
                  <option value="chinese">國文科</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">年級</label>
                <select
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value as Grade);
                    setAnswers({});
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                  <option value="4">四年級</option>
                  <option value="5">五年級</option>
                  <option value="6">六年級</option>
                </select>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">輸入答案</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {currentExam.map((q) => (
                  <div key={q.id} className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 w-6">{q.id}.</label>
                    <input
                      id={`input-${q.id}`}
                      type="text"
                      required
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-center"
                      maxLength={10}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  產生報告
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ name, subject, grade, answers, onReset }: { name: string, subject: Subject, grade: Grade, answers: Record<number, string>, onReset: () => void }) {
  const currentExam = examData[subject][grade];
  
  // Calculate Score
  let correctCount = 0;
  currentExam.forEach(q => {
    if (answers[q.id] === q.answer) {
      correctCount++;
    }
  });
  const score = Math.round((correctCount / currentExam.length) * 100);

  // Calculate Abilities
  const abilityStats: Record<string, { total: number, correct: number }> = {};
  currentExam.forEach(q => {
    const isCorrect = answers[q.id] === q.answer;
    q.abilities.forEach(ability => {
      if (!abilityStats[ability]) {
        abilityStats[ability] = { total: 0, correct: 0 };
      }
      abilityStats[ability].total++;
      if (isCorrect) {
        abilityStats[ability].correct++;
      }
    });
  });

  const radarData = Object.keys(abilityStats).map(ability => ({
    subject: ability,
    A: Math.round((abilityStats[ability].correct / abilityStats[ability].total) * 100),
    fullMark: 100,
  }));

  // Calculate Scope (Knowledge Dimensions)
  const scopeStats: Record<string, { total: number, correct: number, incorrect: number }> = {};
  currentExam.forEach(q => {
    const isCorrect = answers[q.id] === q.answer;
    if (!scopeStats[q.scope]) {
      scopeStats[q.scope] = { total: 0, correct: 0, incorrect: 0 };
    }
    scopeStats[q.scope].total++;
    if (isCorrect) {
      scopeStats[q.scope].correct++;
    } else {
      scopeStats[q.scope].incorrect++;
    }
  });

  const barData = Object.keys(scopeStats).map(scope => {
    const stat = scopeStats[scope];
    return {
      name: scope,
      '答對率': Math.round((stat.correct / stat.total) * 100),
      '答錯率': Math.round((stat.incorrect / stat.total) * 100),
      correctCount: stat.correct,
      incorrectCount: stat.incorrect,
    };
  });

  const subjectName = subject === 'math' ? '數學科' : subject === 'english' ? '英文科' : '國文科';
  const gradeName = grade === '4' ? '四年級' : grade === '5' ? '五年級' : '六年級';

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-card');
    if (!element) return;
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${name}_${subjectName}_學力檢測報告.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#f8f5f1] py-8 print:py-0 print:bg-[#ffffff]">
      <div className="max-w-4xl mx-auto shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] print:shadow-none print:max-w-full">
        <div id="report-card" className="bg-[#ffffff] aspect-[1/1.4141] flex flex-col">
          {/* Header */}
          <div className="w-full h-32 bg-[#7a5c5e] flex-shrink-0 print:bg-[#7a5c5e]">
            <svg width="100%" height="100%" viewBox="0 0 896 128" xmlns="http://www.w3.org/2000/svg">
              {/* Logo */}
              <circle cx="72" cy="64" r="32" fill="#dfd3c3" />
              <text x="72" y="73" fontFamily="sans-serif" fontSize="24" fontWeight="bold" fill="#7a5c5e" textAnchor="middle">粹學</text>
              
              {/* Title */}
              <text x="128" y="76" fontFamily="sans-serif" fontSize="36" fontWeight="bold" fill="#ffffff" textAnchor="start">學力檢測分析報告</text>
              
              {/* Subject Pill */}
              <rect x="440" y="44" width="100" height="40" rx="20" fill="#dfd3c3" />
              <text x="490" y="71" fontFamily="sans-serif" fontSize="20" fontWeight="bold" fill="#7a5c5e" textAnchor="middle">{subjectName}</text>
              
              {/* Score Box */}
              <rect x="740" y="24" width="120" height="80" rx="8" fill="#dfd3c3" />
              <text x="800" y="80" fontFamily="sans-serif" fontSize="56" fontWeight="bold" fill="#7a5c5e" textAnchor="middle">{score}</text>
            </svg>
          </div>

          {/* Info Bar */}
          <div className="grid grid-cols-3 bg-[#dfd3c3] py-4 text-xl font-bold text-[#7a5c5e] border-b-4 border-[#7a5c5e] text-center">
            <div>2026年</div>
            <div>{gradeName}</div>
            <div>姓名: <span className="ml-2">{name}</span></div>
          </div>

          <div className="p-8 flex-grow flex flex-col justify-evenly gap-4">
            {/* Section 1: 五力指標 */}
            <section>
              <div className="mb-4 -ml-8">
                <svg width="160" height="48" viewBox="0 0 160 48">
                  <path d="M0,0 L136,0 A24,24 0 0,1 160,24 A24,24 0 0,1 136,48 L0,48 Z" fill="#7a5c5e" />
                  <text x="88" y="32" fontFamily="sans-serif" fontSize="24" fontWeight="bold" fill="#ffffff" textAnchor="middle">五力指標</text>
                </svg>
              </div>
              <p className="text-base text-[#374151] mb-6 leading-relaxed">
                「五力檢測」旨在全面評估學生在各學科的核心能力表現。除了檢視各單元的學習成效外，更著重於分析學生在解題過程中所展現的各項關鍵能力。本報告將詳細呈現各項指標的達成狀況，幫助學生精準掌握自身的優勢與弱點。建議同學可根據報告中的分析結果，調整未來的學習策略與時間分配，打造最適合自己的專屬複習計畫。
              </p>
              
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-5/12 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#4a5568', fontSize: 14 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fontSize: 12}} />
                      <Radar name="能力值" dataKey="A" stroke="#7a5c5e" fill="#7a5c5e" fillOpacity={0.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-7/12">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#7a5c5e] text-[#ffffff]">
                        <th className="px-3 py-2 border border-[#ffffff] text-left w-1/3">五力指標</th>
                        <th className="px-3 py-2 border border-[#ffffff] text-left">說明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(abilityStats).map((ability, idx) => (
                        <tr key={ability} className={idx % 2 === 0 ? 'bg-[#f8f5f1]' : 'bg-[#ffffff]'}>
                          <td className="px-3 py-2 border border-[#dfd3c3] font-bold text-[#7a5c5e]">{ability}</td>
                          <td className="px-3 py-2 border border-[#dfd3c3] text-[#374151]">{abilityDescriptions[ability] || '無說明'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Section 2: 知識向度 */}
            <section>
              <div className="mb-4 -ml-8">
                <svg width="160" height="48" viewBox="0 0 160 48">
                  <path d="M0,0 L136,0 A24,24 0 0,1 160,24 A24,24 0 0,1 136,48 L0,48 Z" fill="#7a5c5e" />
                  <text x="88" y="32" fontFamily="sans-serif" fontSize="24" fontWeight="bold" fill="#ffffff" textAnchor="middle">知識向度</text>
                </svg>
              </div>
              <p className="text-base text-[#374151] mb-6 leading-relaxed">
                「知識向度」顯示出各科在各冊各單元的通過狀況。依照各主題的答對狀況，可以找出自己需要強化的單元。
              </p>

              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-1/2 h-64">
                  <h3 className="text-center font-bold text-[#374151] mb-4 text-lg">各單元答對率分析</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={barData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 13}} interval={0} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend verticalAlign="top" height={30} wrapperStyle={{fontSize: '13px'}}/>
                      <Bar dataKey="答對率" stackId="a" fill="#7a5c5e" barSize={20} />
                      <Bar dataKey="答錯率" stackId="a" fill="#dfd3c3" barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2">
                  <table className="w-full text-sm border-collapse text-center">
                    <thead>
                      <tr className="bg-[#7a5c5e] text-[#ffffff]">
                        <th className="px-3 py-2 border border-[#ffffff]">單元出處</th>
                        <th className="px-3 py-2 border border-[#ffffff]">答對題數</th>
                        <th className="px-3 py-2 border border-[#ffffff]">答錯題數</th>
                      </tr>
                    </thead>
                    <tbody>
                      {barData.map((item, idx) => (
                        <tr key={item.name} className={idx % 2 === 0 ? 'bg-[#f8f5f1]' : 'bg-[#ffffff]'}>
                          <td className="px-3 py-2 border border-[#dfd3c3] text-left">{item.name}</td>
                          <td className="px-3 py-2 border border-[#dfd3c3]">{item.correctCount || ''}</td>
                          <td className="px-3 py-2 border border-[#dfd3c3]">{item.incorrectCount || ''}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#7a5c5e] text-[#ffffff] font-bold">
                        <td className="px-3 py-2 border border-[#ffffff] text-left">總計</td>
                        <td className="px-3 py-2 border border-[#ffffff]">{correctCount}</td>
                        <td className="px-3 py-2 border border-[#ffffff]">{currentExam.length - correctCount}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="text-right text-xs text-[#6b7280] p-4 border-t border-[#dfd3c3] mt-auto">
            學力檢測分析報告版權屬於粹學文理 ©
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 print:hidden">
        <button
          onClick={handleDownloadPDF}
          className="bg-[#7a5c5e] text-white p-4 rounded-full shadow-lg hover:bg-[#5a4244] transition-colors"
          title="下載 PDF"
        >
          <Download size={24} />
        </button>
        <button
          onClick={onReset}
          className="bg-gray-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        >
          重新輸入
        </button>
      </div>
    </div>
  );
}
