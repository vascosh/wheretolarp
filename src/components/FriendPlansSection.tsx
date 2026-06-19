'use client';

import { useState, useMemo } from 'react';

interface Plan {
  id: string;
  spot_name: string;
  spot_neighborhood: string | null;
  spot_category: string | null;
  plan_date: string;
  plan_time: string | null;
  notes: string | null;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const CATEGORY_COLORS: Record<string, string> = {
  'Old Money': '#a8c8e8', 'Intellectual': '#c8c07a', 'Art World': '#d4a0b8',
  'Continental': '#90b8d8', 'Luxury Retail': '#d4a870', 'Power Lunch': '#90c8a8',
  'Weekend Aristocrat': '#b8a8d8', 'Hotel Lobby': '#c8a8e8', 'Rooftop Bar': '#a8d4a0',
  'Art & Galleries': '#d4a0b8', 'Dining & Nightlife': '#90b8d8', 'Hotel Bars & Lounges': '#c8a8e8',
  'Cultural': '#c8c07a', 'Members Clubs': '#a8c8e8', 'Rooftop & Outdoor': '#a8d4a0',
};

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const p = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}${m > 0 ? `:${String(m).padStart(2,'0')}` : ''} ${p}`;
}

function formatDate(dateStr: string) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return `${MONTHS[mo - 1]} ${d}, ${y}`;
}

export default function FriendPlansSection({ plans, firstName }: { plans: Plan[]; firstName: string }) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const planDates = useMemo(() => new Set(plans.map(p => p.plan_date)), [plans]);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function prev() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function next() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const visiblePlans = selectedDate
    ? plans.filter(p => p.plan_date === selectedDate)
    : plans.filter(p => p.plan_date >= todayStr).sort((a, b) => a.plan_date.localeCompare(b.plan_date));

  if (plans.length === 0) {
    return (
      <div className="p-6 text-center border border-champagne/15"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <p className="font-display italic text-cream/30 text-sm">No plans yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="p-5 select-none border border-champagne/15"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="flex items-center justify-between mb-5">
          <button onClick={prev} className="w-8 h-8 flex items-center justify-center text-cream/40 hover:text-champagne hover:bg-white/[0.06] transition-all">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h3 className="font-display text-cream text-lg">
            {MONTHS[viewMonth]} <span className="numeral text-sm">{viewYear}</span>
          </h3>
          <button onClick={next} className="w-8 h-8 flex items-center justify-center text-cream/40 hover:text-champagne hover:bg-white/[0.06] transition-all">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center font-sans text-[10px] tracking-wider uppercase text-cream/20 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-0.5">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isToday = dateStr === todayStr;
            const hasPlan = planDates.has(dateStr);
            const isSelected = selectedDate === dateStr;

            return (
              <button key={day}
                onClick={() => hasPlan ? setSelectedDate(isSelected ? null : dateStr) : undefined}
                className={[
                  'relative flex flex-col items-center justify-center h-9 rounded-lg font-sans text-sm transition-all duration-150',
                  isSelected ? 'bg-champagne/20 text-champagne border border-champagne/35'
                  : isToday ? 'text-champagne border border-champagne/15 bg-champagne/[0.06]'
                  : hasPlan ? 'text-cream/70 hover:bg-white/[0.06] border border-transparent cursor-pointer'
                  : 'text-cream/30 border border-transparent cursor-default',
                ].join(' ')}>
                <span className="leading-none">{day}</span>
                {hasPlan && (
                  <span className={[
                    'absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                    isSelected ? 'bg-champagne' : 'bg-champagne/50',
                  ].join(' ')} />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-champagne/50 inline-block" />
            <span className="font-sans text-[10px] text-cream/25 tracking-wide">Plan saved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm border border-champagne/15 bg-champagne/[0.06] inline-block" />
            <span className="font-sans text-[10px] text-cream/25 tracking-wide">Today</span>
          </div>
        </div>
      </div>

      {/* Plans list */}
      {visiblePlans.length > 0 ? (
        <div className="space-y-2">
          <p className="eyebrow-muted text-cream/30 px-1">
            {selectedDate ? formatDate(selectedDate) : `Upcoming · ${firstName}`}
          </p>
          {visiblePlans.map(plan => {
            const color = plan.spot_category ? (CATEGORY_COLORS[plan.spot_category] ?? '#C9A96E') : '#C9A96E';
            return (
              <div key={plan.id} className="flex items-start gap-3 p-4 border border-champagne/12"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-1 self-stretch shrink-0 mt-0.5" style={{ background: color, opacity: 0.7 }} />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-cream/85 text-base truncate">{plan.spot_name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {plan.spot_neighborhood && (
                      <span className="font-sans text-[11px] text-cream/30">{plan.spot_neighborhood}</span>
                    )}
                    {plan.spot_category && (
                      <span className="font-sans text-[9px] tracking-[0.15em] uppercase px-2 py-0.5"
                        style={{ background: `${color}15`, color: `${color}cc`, border: `1px solid ${color}25` }}>
                        {plan.spot_category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="font-sans text-[11px] text-cream/40">{formatDate(plan.plan_date)}</span>
                    {plan.plan_time && (
                      <span className="font-sans text-[11px] text-champagne/50">{formatTime(plan.plan_time)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : selectedDate ? (
        <p className="font-sans text-xs text-cream/20 text-center py-2">No plans on this day</p>
      ) : null}
    </div>
  );
}
