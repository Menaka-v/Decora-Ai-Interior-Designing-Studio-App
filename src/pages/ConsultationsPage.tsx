import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Loader2, Star } from 'lucide-react';
import { ROOM_TYPES } from '../data/catalog';
import { useAuth } from '../hooks/useAuth';
import { useCatalog } from '../hooks/useCatalog';
import { useToast } from '../hooks/useToast';
import {
  generateBookingRef,
  insertPublicConsultation,
} from '../services/supabaseData';
import type { RoomType } from '../types/decora';

interface LocalSubmittedBooking {
  id: string;
  booking_ref: string;
  designer: string;
  room_type: RoomType;
  preferred_date: string;
  preferred_time: string;
  status: 'pending';
}

const SESSION_BOOKINGS_KEY = 'decoraai_public_session_bookings';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getLocalTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ConsultationsPage() {
  const { user } = useAuth();
  const { designers, loadingCatalog } = useCatalog();
  const { showToast } = useToast();

  const [selectedDesignerId, setSelectedDesignerId] = useState(
    designers[0]?.id || '',
  );
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('Living Room');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('11:00 AM');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] =
    useState<LocalSubmittedBooking | null>(null);
  const [recentBookings, setRecentBookings] = useState<LocalSubmittedBooking[]>(
    () => {
      try {
        const raw = localStorage.getItem(SESSION_BOOKINGS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
  );

  const todayIso = useMemo(() => getLocalTodayIso(), []);

  useEffect(() => {
    if (designers.length > 0 && !designers.some((d) => d.id === selectedDesignerId)) {
      setSelectedDesignerId(designers[0].id);
    }
  }, [designers, selectedDesignerId]);

  const selectedDesigner =
    designers.find((d) => d.id === selectedDesignerId) || designers[0];

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name);
      setEmail((prev) => prev || user.email);
    }
  }, [user]);

  const persistLocalBooking = (item: LocalSubmittedBooking) => {
    setRecentBookings((prev) => {
      const next = [item, ...prev].slice(0, 10);
      try {
        localStorage.setItem(SESSION_BOOKINGS_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Hidden honeypot check against automated spam bots
    if (honeypot.trim().length > 0) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const phoneDigits = phone.replace(/\D/g, '');

    if (trimmedName.length < 2) {
      showToast('Please enter your full name (at least 2 characters).', 'error');
      return;
    }

    if (!EMAIL_RE.test(trimmedEmail)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    if (phoneDigits.length !== 10) {
      showToast('Please enter a valid 10-digit phone number.', 'error');
      return;
    }

    if (!preferredDate || preferredDate < todayIso) {
      showToast('Preferred date cannot be in the past.', 'error');
      return;
    }

    if (!preferredTime || !roomType || !selectedDesigner) {
      showToast('Please choose a designer, room type, and preferred time.', 'error');
      return;
    }

    const bookingRef = generateBookingRef();
    setSubmitting(true);

    try {
      await insertPublicConsultation({
        booking_ref: bookingRef,
        name: trimmedName,
        email: trimmedEmail,
        phone: phoneDigits,
        room_type: roomType,
        designer: selectedDesigner.name,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        message: message.trim(),
      });

      const localConfirmation: LocalSubmittedBooking = {
        id: `local-${Date.now()}`,
        booking_ref: bookingRef,
        designer: selectedDesigner.name,
        room_type: roomType,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        status: 'pending',
      };

      setConfirmedBooking(localConfirmation);
      persistLocalBooking(localConfirmation);
      showToast(`Consultation requested! Ref: ${bookingRef}`, 'success');
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Unable to schedule consultation right now. Please try again.',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-slate-200 pb-5 dark:border-slate-800">
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Book an Interior Consultation
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Pair your DecoraAI studio concepts with a 1-on-1 video session with a
          senior interior architect.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Designer Roster (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <h2 className="font-sans text-base font-semibold text-slate-900 dark:text-white">
            01. Choose Your Interior Designer
          </h2>

          <div className="space-y-4">
            {loadingCatalog ? (
              <div className="space-y-3">
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="h-28 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-3 w-64 rounded bg-slate-100 dark:bg-slate-800/70" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : designers.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                No designers available yet. Check back shortly.
              </div>
            ) : (
              designers.map((designer) => {
                const selected = designer.id === selectedDesigner?.id;
                return (
                  <button
                    key={designer.id}
                    type="button"
                    onClick={() => setSelectedDesignerId(designer.id)}
                    className={`flex w-full cursor-pointer flex-col gap-4 rounded-2xl border p-5 text-left transition-all sm:flex-row sm:items-center ${
                      selected
                        ? 'border-[#0D9488] bg-teal-50/40 ring-2 ring-[#0D9488]/30 dark:border-teal-500 dark:bg-teal-950/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={designer.avatarUrl}
                      alt={designer.name}
                      referrerPolicy="no-referrer"
                      className="h-20 w-20 shrink-0 rounded-2xl bg-slate-100 object-cover dark:bg-slate-800"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            {designer.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {designer.title} · {designer.experienceYears} yrs exp
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>{Number(designer.rating).toFixed(1)}</span>
                          <span className="font-normal text-slate-400">
                            ({designer.reviewCount})
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {designer.bio}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-[#0D9488] dark:text-teal-400">
                          {designer.specialty}
                        </span>
                        <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                          {designer.hourlyRate}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Locally Booked Requests Summary */}
          {recentBookings.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 font-sans text-sm font-semibold text-slate-900 dark:text-white">
                Your Recent Consultation Requests
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {b.designer} · {b.room_type}
                      </div>
                      <div className="mt-0.5 tabular-nums text-slate-500 dark:text-slate-400">
                        {b.preferred_date} at {b.preferred_time} · Ref:{' '}
                        <span className="font-mono font-semibold">{b.booking_ref}</span>
                      </div>
                    </div>
                    <span className="font-semibold capitalize text-amber-600 dark:text-amber-400">
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Booking Form or Confirmation Screen (5 cols) */}
        <div className="lg:col-span-5">
          {confirmedBooking ? (
            <div className="rounded-2xl border border-teal-200 bg-white p-7 shadow-sm dark:border-teal-900/60 dark:bg-slate-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Consultation Request Received
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Your session with {confirmedBooking.designer} has been submitted.
                Save your booking reference below.
              </p>

              <dl className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-950">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Booking Reference</dt>
                  <dd className="font-mono text-sm font-bold text-[#0D9488] dark:text-teal-400">
                    {confirmedBooking.booking_ref}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Designer</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">
                    {confirmedBooking.designer}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Room Type</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">
                    {confirmedBooking.room_type}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Date &amp; Time</dt>
                  <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                    {confirmedBooking.preferred_date} · {confirmedBooking.preferred_time}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-semibold capitalize text-amber-600 dark:text-amber-400">
                    {confirmedBooking.status}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => {
                  setConfirmedBooking(null);
                  setMessage('');
                }}
                className="mt-6 w-full cursor-pointer rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Book Another Session
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="font-sans text-base font-semibold text-slate-900 dark:text-white">
                02. Session Details{' '}
                {selectedDesigner ? `with ${selectedDesigner.name}` : ''}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {selectedDesigner?.hourlyRate || '$95 / session'} · Video walkthrough &amp; material list
              </p>

              {/* Hidden Honeypot Anti-Bot Field */}
              <div aria-hidden="true" className="hidden">
                <label htmlFor="booking-company-website">Company Website</label>
                <input
                  id="booking-company-website"
                  name="company_website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="booking-name"
                    className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Full Name
                  </label>
                  <input
                    id="booking-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="booking-email"
                      className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Email
                    </label>
                    <input
                      id="booking-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="booking-phone"
                      className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Phone Number (10 digits)
                    </label>
                    <input
                      id="booking-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="5552345678"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm tabular-nums text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="booking-room"
                    className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Room Type
                  </label>
                  <select
                    id="booking-room"
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as RoomType)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {ROOM_TYPES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="booking-date"
                      className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Preferred Date</span>
                    </label>
                    <input
                      id="booking-date"
                      type="date"
                      required
                      min={todayIso}
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm tabular-nums text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="booking-time"
                      className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>Preferred Time</span>
                    </label>
                    <select
                      id="booking-time"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {[
                        '09:30 AM',
                        '11:00 AM',
                        '01:30 PM',
                        '03:30 PM',
                        '05:00 PM',
                      ].map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="booking-message"
                    className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Project Goals &amp; Notes
                  </label>
                  <textarea
                    id="booking-message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share room dimensions, budget range, or saved design notes..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedDesigner}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B5B] via-[#F59E0B] to-[#0D9488] py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>
                    {submitting ? 'Submitting Booking...' : 'Confirm Consultation'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
