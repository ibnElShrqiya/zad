import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { AGE_TRACKS, BARAEM_LESSONS, INITIAL_BADGES } from '../../data/learning/baraemData';
import { AgeTrackId, ChildLearningProfile, Lesson, QuizQuestion } from '../../domain/learning/types';
import { AppSettings } from '../../domain/settings/types';
import { storageAdapter } from '../../data/storage/storageAdapter';
import { notificationService } from '../../platform/notifications/notificationService';
import confetti from 'canvas-confetti';

interface BaraemZadViewProps {
  settings: AppSettings;
}

export const BaraemZadView: React.FC<BaraemZadViewProps> = ({ settings }) => {
  const [childProfile, setChildProfile] = useState<ChildLearningProfile>(() =>
    storageAdapter.getChildProfile()
  );
  const [selectedTrack, setSelectedTrack] = useState<AgeTrackId>(childProfile.selectedTrack || 'track_6_8');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState<number>(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [showParentModal, setShowParentModal] = useState<boolean>(false);
  const [parentPin, setParentPin] = useState<string>('');
  const [parentUnlocked, setParentUnlocked] = useState<boolean>(false);

  // Lessons for current track
  const trackLessons = BARAEM_LESSONS.filter((l) => l.trackId === selectedTrack);

  const handleStartLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setCurrentQuizQuestionIndex(0);
    setSelectedQuizOption(null);
    setIsAnswerSubmitted(false);
    setQuizScore(0);
    if (settings.soundEffects) {
      notificationService.playHapticClick();
    }
  };

  const handleSelectQuizOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedQuizOption(index);
    if (settings.soundEffects) {
      notificationService.playHapticClick();
    }
  };

  const handleSubmitQuizAnswer = (currentQuestion: QuizQuestion) => {
    if (selectedQuizOption === null) return;
    setIsAnswerSubmitted(true);

    const isCorrect = selectedQuizOption === currentQuestion.correctIndex;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
      if (settings.soundEffects) notificationService.playCelebrationChime();
    } else {
      if (settings.soundEffects) notificationService.playHapticClick();
    }
  };

  const handleNextQuizQuestion = () => {
    if (!activeLesson || !activeLesson.quiz) return;

    if (currentQuizQuestionIndex + 1 < activeLesson.quiz.length) {
      setCurrentQuizQuestionIndex((prev) => prev + 1);
      setSelectedQuizOption(null);
      setIsAnswerSubmitted(false);
    } else {
      // Quiz complete!
      const totalQuestions = activeLesson.quiz.length;
      const finalScore = quizScore + (selectedQuizOption === activeLesson.quiz[currentQuizQuestionIndex].correctIndex ? 1 : 0);
      const earnedStars = Math.round((finalScore / totalQuestions) * activeLesson.points);

      const alreadyCompleted = childProfile.completedLessonIds.includes(activeLesson.id);
      const updatedCompleted = alreadyCompleted
        ? childProfile.completedLessonIds
        : [...childProfile.completedLessonIds, activeLesson.id];

      const updatedProfile: ChildLearningProfile = {
        ...childProfile,
        totalStars: childProfile.totalStars + (alreadyCompleted ? 5 : earnedStars),
        completedLessonIds: updatedCompleted,
        quizScores: {
          ...childProfile.quizScores,
          [activeLesson.id]: Math.round((finalScore / totalQuestions) * 100),
        },
      };

      setChildProfile(updatedProfile);
      storageAdapter.saveChildProfile(updatedProfile);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Header & Child Profile Summary */}
      <div className="bg-gradient-to-r from-[#064E3B] to-[#043629] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-2xl shadow-inner">
            🌱
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-arabic tracking-tight">براعم زاد</h1>
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                للأطفال والناشئة
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-1">
              مرحباً يا <span className="font-bold text-amber-300">{childProfile.childName}</span>! تعلم دينك ببهجة وأمان.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Star Counter */}
          <div className="px-4 py-2 rounded-xl bg-black/20 border border-white/10 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="text-xl font-extrabold font-latin tabular-nums text-amber-300">
              {childProfile.totalStars}
            </span>
            <span className="text-xs text-emerald-200">نجمة</span>
          </div>

          {/* Parent Zone Trigger */}
          <button
            onClick={() => setShowParentModal(true)}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
            title="بوابة ولي الأمر"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Age Track Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {AGE_TRACKS.map((track) => {
          const isSelected = selectedTrack === track.id;
          return (
            <button
              key={track.id}
              onClick={() => {
                setSelectedTrack(track.id);
                setChildProfile({ ...childProfile, selectedTrack: track.id });
                storageAdapter.saveChildProfile({ ...childProfile, selectedTrack: track.id });
              }}
              className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-[#064E3B] dark:border-[#10B981] bg-white dark:bg-[#11221D] shadow-md ring-2 ring-[#064E3B]/20'
                  : 'border-[#E8E2D8] dark:border-[#1B352E] bg-[#FAF8F5] dark:bg-[#0A1411] hover:border-slate-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-latin px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    سن {track.ageRange}
                  </span>
                  {isSelected && <span className="text-xs text-[#064E3B] font-bold">✓ المختار</span>}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-arabic">
                  {track.titleAr}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {track.subtitleAr}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Lessons Grid for Selected Track */}
      <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-arabic">
              الدروس والأنشطة التفاعلية
            </h2>
            <p className="text-xs text-slate-500">
              اختر درساً للبدء في القراءة والتحدي واكتساب النجوم!
            </p>
          </div>

          <span className="text-xs font-semibold text-[#064E3B] dark:text-[#10B981]">
            {childProfile.completedLessonIds.length} دروس مكتملة
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trackLessons.map((lesson) => {
            const isCompleted = childProfile.completedLessonIds.includes(lesson.id);
            const score = childProfile.quizScores[lesson.id];

            return (
              <div
                key={lesson.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-[#E8E2D8] dark:border-[#1B352E] bg-[#FAF8F5] dark:bg-[#0A1411]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-500 font-latin">
                      ⏳ {lesson.durationMinutes} دقائق · ⭐ {lesson.points} نقطة
                    </span>
                    {isCompleted && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>مكتمل {score !== undefined ? `(${score}%)` : ''}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-arabic mb-1">
                    {lesson.titleAr}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {lesson.summaryAr}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E8E2D8] dark:border-[#1B352E]">
                  <span className="text-[11px] text-slate-400">
                    {lesson.quiz ? `${lesson.quiz.length} أسئلة تحدي` : 'نشاط قراءة وتأمل'}
                  </span>

                  <button
                    onClick={() => handleStartLesson(lesson)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#064E3B] text-white hover:bg-[#043629] text-xs font-semibold cursor-pointer transition-transform active:scale-95"
                  >
                    <span>{isCompleted ? 'إعادة الدرس' : 'ابدأ الدرس'}</span>
                    <Play className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Active Lesson & Quiz Interactive Modal */}
      {activeLesson && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-[#11221D] rounded-3xl border border-[#E8E2D8] dark:border-[#1B352E] p-6 shadow-2xl max-h-[90vh] overflow-y-auto my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] dark:border-[#1B352E] mb-6">
              <div>
                <span className="text-xs font-bold text-[#064E3B] dark:text-[#10B981]">
                  درس تفاعلي
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-arabic">
                  {activeLesson.titleAr}
                </h3>
              </div>
              <button
                onClick={() => setActiveLesson(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lesson Story Content */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E]">
                <p className="text-base text-slate-800 dark:text-slate-200 font-arabic leading-loose">
                  {activeLesson.contentAr}
                </p>

                {activeLesson.ayahOrHadithProof && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-center">
                    <p className="font-quran text-lg text-slate-900 dark:text-white leading-loose">
                      « {activeLesson.ayahOrHadithProof.arabic} »
                    </p>
                    <span className="text-xs text-amber-800 dark:text-amber-300 block mt-1">
                      {activeLesson.ayahOrHadithProof.reference}
                    </span>
                  </div>
                )}
              </div>

              {/* Key Takeaways */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 font-arabic">
                  ماذا تعلمنا اليوم يا بطل؟
                </h4>
                <div className="space-y-1.5">
                  {activeLesson.keyTakeawaysAr.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Quiz Section */}
              {activeLesson.quiz && activeLesson.quiz.length > 0 && (
                <div className="pt-6 border-t border-[#E8E2D8] dark:border-[#1B352E]">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white font-arabic">
                      تحدي الإجابة الذكية ({currentQuizQuestionIndex + 1} من {activeLesson.quiz.length})
                    </h4>
                    <span className="text-xs text-amber-600 font-bold">
                      النتيجة الحالية: {quizScore}
                    </span>
                  </div>

                  {(() => {
                    const q = activeLesson.quiz[currentQuizQuestionIndex];
                    return (
                      <div className="space-y-4">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 font-arabic">
                          {q.questionAr}
                        </p>

                        <div className="space-y-2">
                          {q.optionsAr.map((opt, optIdx) => {
                            let btnStyle =
                              'bg-[#FAF8F5] dark:bg-[#0A1411] border-[#E8E2D8] dark:border-[#1B352E] text-slate-800 dark:text-slate-200';

                            if (selectedQuizOption === optIdx) {
                              btnStyle = 'border-[#064E3B] bg-[#064E3B]/10 font-bold';
                            }

                            if (isAnswerSubmitted) {
                              if (optIdx === q.correctIndex) {
                                btnStyle = 'border-emerald-500 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 font-bold';
                              } else if (selectedQuizOption === optIdx) {
                                btnStyle = 'border-red-500 bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100';
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleSelectQuizOption(optIdx)}
                                className={`w-full p-3 rounded-xl border text-right text-xs transition-all cursor-pointer ${btnStyle}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation after submitting */}
                        {isAnswerSubmitted && (
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-300">
                            {q.explanationAr}
                          </div>
                        )}

                        {/* Quiz Navigation Buttons */}
                        <div className="flex justify-end pt-2">
                          {!isAnswerSubmitted ? (
                            <button
                              onClick={() => handleSubmitQuizAnswer(q)}
                              disabled={selectedQuizOption === null}
                              className="px-6 py-2.5 rounded-xl bg-[#064E3B] text-white hover:bg-[#043629] text-xs font-bold disabled:opacity-50 cursor-pointer"
                            >
                              تأكيد الإجابة
                            </button>
                          ) : (
                            <button
                              onClick={handleNextQuizQuestion}
                              className="px-6 py-2.5 rounded-xl bg-[#064E3B] text-white hover:bg-[#043629] text-xs font-bold cursor-pointer"
                            >
                              {currentQuizQuestionIndex + 1 < activeLesson.quiz.length
                                ? 'السؤال التالي'
                                : 'إنهاء واستلام النجوم 🎉'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Parent / Guardian Dashboard Modal */}
      {showParentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#11221D] rounded-2xl border border-[#E8E2D8] dark:border-[#1B352E] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#1B352E] mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#064E3B] dark:text-[#10B981]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-arabic">
                  بوابة ولي الأمر والمتابعة
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowParentModal(false);
                  setParentUnlocked(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!parentUnlocked ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  يرجى حل المسألة الرياضية البسيطة للتأكد من هوية ولي الأمر:
                </p>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-center font-bold text-sm font-latin">
                  7 × 8 = ؟
                </div>
                <input
                  type="number"
                  placeholder="اكتب الناتج هنا..."
                  value={parentPin}
                  onChange={(e) => setParentPin(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#1B352E] text-center text-sm font-bold bg-[#FAF8F5] dark:bg-[#0A1411]"
                />
                <button
                  onClick={() => {
                    if (parentPin.trim() === '56') {
                      setParentUnlocked(true);
                    } else {
                      alert('إجابة غير صحيحة.');
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#064E3B] text-white text-xs font-bold cursor-pointer"
                >
                  الدخول لبوابة المتابعة
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    اسم الطفل:
                  </label>
                  <input
                    type="text"
                    value={childProfile.childName}
                    onChange={(e) => {
                      const updated = { ...childProfile, childName: e.target.value };
                      setChildProfile(updated);
                      storageAdapter.saveChildProfile(updated);
                    }}
                    className="w-full p-2 rounded-xl border border-[#E8E2D8] dark:border-[#1B352E] text-xs font-bold bg-[#FAF8F5] dark:bg-[#0A1411]"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>إجمالي النجوم المكتسبة:</span>
                    <span className="font-bold font-latin">{childProfile.totalStars} ⭐</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الدروس المنجزة:</span>
                    <span className="font-bold font-latin">
                      {childProfile.completedLessonIds.length} من {BARAEM_LESSONS.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>مستوى الأمان وحماية الخصوصية:</span>
                    <span className="text-emerald-600 font-bold">100% بدون إعلانات أو شات</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowParentModal(false);
                    setParentUnlocked(false);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold cursor-pointer"
                >
                  حفظ والإغلاق
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
