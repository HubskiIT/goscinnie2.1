'use client';

import React, { useState } from 'react';
import { ScreenId } from './types';

interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  occasion: string;
  verified: boolean;
  bookingRef?: string;
  text: string;
  helpfulCount: number;
}

const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: 'Anna K.',
    avatar: 'AK',
    rating: 5,
    date: 'maj 2026',
    occasion: 'Komunia, 60 osób',
    verified: true,
    bookingRef: 'GS-2026-0418',
    text: 'Cena z oferty zgadzała się co do złotówki z fakturą. Po dwóch poprzednich salach to była ulga. Właściciele niezwykle pomocni, ogród przygotowany perfekcyjnie dla dzieci, a brak korkowego przy własnych napojach to rzadkość w okolicach Wrocławia.',
    helpfulCount: 14,
  },
  {
    id: 'rev-2',
    author: 'Michał i Ola',
    avatar: 'MO',
    rating: 5,
    date: 'sierpień 2026',
    occasion: 'Wesele, 120 osób',
    verified: true,
    bookingRef: 'GS-2026-0891',
    text: 'Zorganizowaliśmy wesele z rezerwacją noclegu dla 40 osób z rodziny. Sala balowa robi ogromne wrażenie na żywo, a akustyka jest świetna. Jedzenie z menu podstawowego przeszło nasze oczekiwania.',
    helpfulCount: 22,
  },
  {
    id: 'rev-3',
    author: 'Barbara W.',
    avatar: 'BW',
    rating: 4,
    date: 'marzec 2026',
    occasion: 'Spotkanie rodzinne, 35 osób',
    verified: true,
    bookingRef: 'GS-2026-0112',
    text: 'Szukałam sali z szybkim terminem realizacji. Odpowiedź z Dworu pod Lipami przyszła w 3 godziny przez serwis. Bardzo dyskretna i sprawna obsługa.',
    helpfulCount: 8,
  },
];

interface ReviewsSectionProps {
  navigate: (screen: ScreenId) => void;
  venueName?: string;
}

export function ReviewsSection({ navigate, venueName = 'Dwór pod Lipami' }: ReviewsSectionProps) {
  // User session simulation states
  // 1: 'verified' (Logged in as Anna Kowalska with completed booking)
  // 2: 'unverified' (Logged in, but no completed booking for this venue)
  // 3: 'guest' (Logged out)
  const [userState, setUserState] = useState<'verified' | 'unverified' | 'guest'>('verified');

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [helpfulGiven, setHelpfulGiven] = useState<Record<string, boolean>>({});

  // Form state
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [newOccasion, setNewOccasion] = useState('Komunia');
  const [newText, setNewText] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleHelpful = (id: string) => {
    if (helpfulGiven[id]) return;
    setHelpfulGiven((prev) => ({ ...prev, [id]: true }));
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    );
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      author: 'Anna Kowalska',
      avatar: 'AK',
      rating: newRating,
      date: 'październik 2026',
      occasion: `${newOccasion}, rezerwacja zrealizowana`,
      verified: true,
      bookingRef: 'GS-2026-0418',
      text: newText.trim(),
      helpfulCount: 0,
    };

    setReviews([newRev, ...reviews]);
    setNewText('');
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 5000);
  };

  const displayedReviews = filterVerifiedOnly
    ? reviews.filter((r) => r.verified)
    : reviews;

  const totalReviewsCount = 36 + (reviews.length - INITIAL_REVIEWS.length);
  const averageRating = (
    (reviews.reduce((acc, r) => acc + r.rating, 0) + 33 * 5) /
    (reviews.length + 33)
  ).toFixed(1);

  return (
    <section className="mt-14 pt-10 border-t border-[#E2D5CA]" id="recenzje">
      {/* Section Heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-[13px] font-bold tracking-wider uppercase text-[#5E7360] mb-2">
            Wiarygodność i zaufanie
          </div>
          <h2 className="m-0 font-fraunces font-medium text-[30px] sm:text-[34px] tracking-tight">
            Opinie i recenzje ({totalReviewsCount})
          </h2>
          <p className="m-0 mt-2 text-[15px] text-[#6A5C70] max-w-[65ch]">
            Opinie mogą dodawać wyłącznie zalogowani użytkownicy. Klienci, których rezerwacja odbyła się przez
            Gościnnie, otrzymują certyfikowany status <strong>Zweryfikowanego Klienta</strong>.
          </p>
        </div>

        {/* User state simulator for testing demo */}
        <div className="bg-[#F2E9E2] border border-[#D9CCC2] rounded-xl p-3 flex flex-col gap-1.5 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6A5C70]">
            Symulacja sesji użytkownika:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setUserState('verified')}
              className={`text-[12px] px-2.5 py-1 rounded-md cursor-pointer border-0 transition-colors ${
                userState === 'verified'
                  ? 'bg-[#241C2B] text-white font-bold shadow-xs'
                  : 'bg-white text-[#241C2B] hover:bg-gray-100'
              }`}
            >
              ✓ Zweryfikowany klient
            </button>
            <button
              type="button"
              onClick={() => setUserState('unverified')}
              className={`text-[12px] px-2.5 py-1 rounded-md cursor-pointer border-0 transition-colors ${
                userState === 'unverified'
                  ? 'bg-[#241C2B] text-white font-bold shadow-xs'
                  : 'bg-white text-[#241C2B] hover:bg-gray-100'
              }`}
            >
              Klient bez rezerwacji
            </button>
            <button
              type="button"
              onClick={() => setUserState('guest')}
              className={`text-[12px] px-2.5 py-1 rounded-md cursor-pointer border-0 transition-colors ${
                userState === 'guest'
                  ? 'bg-[#241C2B] text-white font-bold shadow-xs'
                  : 'bg-white text-[#241C2B] hover:bg-gray-100'
              }`}
            >
              Niezalogowany
            </button>
          </div>
        </div>
      </div>

      {/* Rating Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 sm:p-7 bg-white border border-[#E2D5CA] rounded-[18px] mb-8 shadow-sm">
        {/* Score & Stars */}
        <div className="flex flex-col justify-center items-center md:items-start md:border-r border-[#EFE5DD] md:pr-6">
          <div className="flex items-baseline gap-2">
            <span className="font-fraunces text-[52px] font-bold text-[#241C2B] leading-none">
              {averageRating}
            </span>
            <span className="text-[18px] text-[#6A5C70] font-medium">/ 5.0</span>
          </div>

          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="#F0A62E"
                stroke="#F0A62E"
                strokeWidth="1.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <div className="text-[14px] text-[#6A5C70]">Na podstawie {totalReviewsCount} opinii</div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="flex flex-col justify-center gap-2 md:border-r border-[#EFE5DD] md:px-6">
          {[
            { stars: '5 gwiazdek', pct: 86, count: 31 },
            { stars: '4 gwiazdki', pct: 11, count: 4 },
            { stars: '3 gwiazdki', pct: 3, count: 1 },
            { stars: '2 gwiazdki', pct: 0, count: 0 },
            { stars: '1 gwiazdka', pct: 0, count: 0 },
          ].map((row) => (
            <div key={row.stars} className="flex items-center gap-2.5 text-[12px] text-[#55485A]">
              <span className="w-16 shrink-0">{row.stars}</span>
              <div className="grow h-2 bg-[#EFE5DD] rounded-full overflow-hidden">
                <div
                  style={{ width: `${row.pct}%` }}
                  className="h-full bg-[#5E7360] rounded-full"
                />
              </div>
              <span className="w-6 text-right shrink-0 text-[#6A5C70]">{row.count}</span>
            </div>
          ))}
        </div>

        {/* Verification Guarantee */}
        <div className="flex flex-col justify-center gap-3 md:pl-6 bg-[#FBF7F4] md:bg-transparent p-4 md:p-0 rounded-xl">
          <div className="flex items-center gap-2 text-[#3F5142] font-semibold text-[14px]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3F5142"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            100% autentyczności
          </div>
          <p className="m-0 text-[13px] leading-[1.6] text-[#55485A]">
            Nie pozwalamy na anonimowe ani kupione opinie. Każda recenzja z odznaką została zweryfikowana w oparciu o
            fakturę lub potwierdzenie rezerwacji w systemie.
          </p>
          <div className="text-[12px] text-[#6A5C70]">
            Obiekt: <strong className="text-[#241C2B]">{venueName}</strong>
          </div>
        </div>
      </div>

      {/* Review Submission Area based on User Status */}
      <div className="border border-[#E2D5CA] rounded-[18px] bg-white p-6 sm:p-8 mb-10 shadow-sm">
        {userState === 'guest' && (
          <div className="text-center py-6 px-4 max-w-lg mx-auto flex flex-col items-center gap-3.5">
            <span className="w-12 h-12 rounded-full bg-[#F2E9E2] flex items-center justify-center text-[#55485A]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <h3 className="m-0 font-fraunces font-medium text-[22px]">Zaloguj się, aby dodać recenzję</h3>
            <p className="m-0 text-[14px] leading-[1.6] text-[#6A5C70]">
              Dodawanie opinii jest dostępne wyłącznie dla zalogowanych użytkowników serwisu Gościnnie, aby zapewnić
              wiarygodność i chronić lokale przed spamem.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => navigate('Logowanie')}
                className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-[10px] px-6 py-2.5 border-0 cursor-pointer shadow-xs"
              >
                Przejdź do logowania
              </button>
              <button
                type="button"
                onClick={() => setUserState('verified')}
                className="text-[14px] font-semibold text-[#241C2B] bg-white border border-[#241C2B] rounded-[10px] px-4 py-2.5 cursor-pointer hover:bg-gray-50"
              >
                Zaloguj jako Anna K. (Demo)
              </button>
            </div>
          </div>
        )}

        {userState === 'unverified' && (
          <div className="py-4 px-2 max-w-xl mx-auto text-center flex flex-col items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-[#F2E9E2] flex items-center justify-center text-[#8A5405]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <div className="text-[15px] font-bold text-[#241C2B]">
              Jesteś zalogowany, ale nie posiadasz zrealizowanej rezerwacji w tym lokalu
            </div>
            <p className="m-0 text-[14px] leading-[1.6] text-[#6A5C70]">
              Zgodnie z zasadami etyki serwisu, recenzję mogą wystawić klienci, którzy zarezerwowali termin lub wysłali
              potwierdzone zapytanie ofertowe dla obiektu <strong>{venueName}</strong>.
            </p>
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={() => setUserState('verified')}
                className="text-[14px] text-[#8A5405] underline font-semibold cursor-pointer bg-transparent border-0"
              >
                Przełącz na profil ze zrealizowaną rezerwacją (Anna K.)
              </button>
            </div>
          </div>
        )}

        {userState === 'verified' && (
          <form onSubmit={handleAddReview} className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFE5DD]">
              <div>
                <h3 className="m-0 font-fraunces font-medium text-[22px]">Napisz recenzję</h3>
                <p className="m-0 text-[14px] text-[#6A5C70] mt-0.5">
                  Dodajesz opinię jako <strong>Anna Kowalska</strong>
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 bg-[#E7EDE7] border border-[#5E7360]/30 rounded-full px-4 py-1.5 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-[#3F5142] animate-pulse" />
                <span className="text-[13px] font-semibold text-[#3F5142]">
                  ✓ Status: Zweryfikowany klient (Rezerwacja #GS-2026-0418)
                </span>
              </div>
            </div>

            {submitSuccess && (
              <div className="bg-[#E7EDE7] border border-[#5E7360] text-[#3F5142] rounded-xl p-4 text-[14px] font-semibold flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Twoja opinia została pomyślnie dodana z certyfikatem zweryfikowanego klienta!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Star Rating Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-semibold text-[#3E3344]">Twoja ocena ogólna</label>
                <div className="flex items-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || newRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 cursor-pointer bg-transparent border-0 hover:scale-110 transition-transform"
                      >
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill={active ? '#F0A62E' : 'none'}
                          stroke={active ? '#F0A62E' : '#D9CCC2'}
                          strokeWidth="1.7"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    );
                  })}
                  <span className="ml-2 font-bold text-[16px] text-[#241C2B]">
                    {newRating} / 5 {newRating === 5 ? '(Doskonale)' : newRating === 4 ? '(Bardzo dobrze)' : ''}
                  </span>
                </div>
              </div>

              {/* Occasion */}
              <div className="flex flex-col gap-2">
                <label htmlFor="new-occasion" className="text-[14px] font-semibold text-[#3E3344]">
                  Rodzaj zrealizowanego wydarzenia
                </label>
                <select
                  id="new-occasion"
                  value={newOccasion}
                  onChange={(e) => setNewOccasion(e.target.value)}
                  className="border-[1.5px] border-[#D9CCC2] rounded-[10px] p-2.5 text-[15px] font-semibold text-[#241C2B] bg-white cursor-pointer"
                >
                  <option value="Komunia">Komunia</option>
                  <option value="Wesele">Wesele</option>
                  <option value="Chrzciny">Chrzciny</option>
                  <option value="Urodziny">Urodziny</option>
                  <option value="Event firmowy">Event firmowy</option>
                  <option value="Inne przyjęcie">Inne przyjęcie</option>
                </select>
              </div>
            </div>

            {/* Review text */}
            <div className="flex flex-col gap-2">
              <label htmlFor="new-review-text" className="text-[14px] font-semibold text-[#3E3344]">
                Treść opinii i wrażenia ze współpracy
              </label>
              <textarea
                id="new-review-text"
                rows={4}
                required
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Podziel się opinią o lokalu: jak oceniasz jedzenie, kontakt z menedżerem, zgodność kosztów z ofertą, klimat sali oraz obsługę..."
                className="text-[15px] leading-[1.6] text-[#241C2B] border-[1.5px] border-[#D9CCC2] rounded-[10px] p-4 w-full box-border resize-y focus:outline-none focus:border-[#241C2B]"
              />
              <div className="flex justify-between text-[12px] text-[#6A5C70]">
                <span>Rzetelne opinie pomagają innym w wyborze idealnego miejsca.</span>
                <span>{newText.length} znaków</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[13px] text-[#6A5C70] flex items-center gap-1.5">
                <span className="text-[#3F5142] font-bold">✓</span>
                Opinia zostanie oznaczona jako <strong>Zweryfikowany klient</strong>
              </div>

              <button
                type="submit"
                className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[10px] px-6 py-3 cursor-pointer shadow-sm"
              >
                Dodaj opinię
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Filter and Reviews List */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[#241C2B]">Filtruj:</span>
          <button
            type="button"
            onClick={() => setFilterVerifiedOnly(false)}
            className={`text-[13px] px-3.5 py-1.5 rounded-full border cursor-pointer transition-colors ${
              !filterVerifiedOnly
                ? 'bg-[#241C2B] text-white border-[#241C2B] font-semibold'
                : 'bg-white text-[#55485A] border-[#D9CCC2]'
            }`}
          >
            Wszystkie ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterVerifiedOnly(true)}
            className={`text-[13px] px-3.5 py-1.5 rounded-full border cursor-pointer transition-colors ${
              filterVerifiedOnly
                ? 'bg-[#241C2B] text-white border-[#241C2B] font-semibold'
                : 'bg-white text-[#55485A] border-[#D9CCC2]'
            }`}
          >
            ✓ Tylko zweryfikowani klienci ({reviews.filter((r) => r.verified).length})
          </button>
        </div>

        <span className="text-[13px] text-[#6A5C70]">
          Sortowanie: <strong className="text-[#241C2B]">Najnowsze</strong>
        </span>
      </div>

      {/* Reviews Cards List */}
      <div className="flex flex-col gap-4">
        {displayedReviews.map((rev) => (
          <article
            key={rev.id}
            className="border border-[#E2D5CA] rounded-[16px] p-6 bg-white flex flex-col gap-3.5 shadow-xs transition-shadow hover:shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[#E7EDE7] text-[#3F5142] font-bold text-[14px] flex items-center justify-center shrink-0">
                  {rev.avatar}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[16px] text-[#241C2B]">{rev.author}</span>
                    {rev.verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#3F5142] bg-[#E7EDE7] px-2.5 py-0.5 rounded-full">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Zweryfikowany klient
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] text-[#6A5C70]">
                    {rev.occasion} &nbsp;·&nbsp; {rev.date}
                    {rev.bookingRef && (
                      <span className="text-[11px] text-[#8B7F91] ml-1.5 font-mono">
                        (Zlecenie: {rev.bookingRef})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Star rating */}
              <div className="flex items-center gap-1 self-start sm:self-auto">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={i < rev.rating ? '#F0A62E' : '#EFE5DD'}
                    stroke={i < rev.rating ? '#F0A62E' : '#EFE5DD'}
                    strokeWidth="1"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
            </div>

            <p className="m-0 text-[15px] leading-[1.68] text-[#3E3344]">{rev.text}</p>

            <div className="flex items-center justify-between pt-2 border-t border-[#EFE5DD] text-[13px] text-[#6A5C70]">
              <span className="flex items-center gap-1 text-[12px] text-[#5E7360]">
                ✓ Transakcja zrealizowana przez Gościnnie
              </span>
              <button
                type="button"
                onClick={() => handleHelpful(rev.id)}
                className={`flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-[13px] ${
                  helpfulGiven[rev.id] ? 'text-[#3F5142] font-bold' : 'text-[#6A5C70] hover:text-[#241C2B]'
                }`}
              >
                <span>👍</span>
                <span>Pomocna ({rev.helpfulCount})</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
