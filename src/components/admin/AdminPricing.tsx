import React, { useState } from 'react';
import { initialPricingRates } from '../../config/turfConfig';
import { 
  Save, 
  Check, 
  Calculator 
} from 'lucide-react';

export const AdminPricing: React.FC = () => {
  const [rates, setRates] = useState(initialPricingRates);
  const [advanceDepositPercent, setAdvanceDepositPercent] = useState(25);
  const [taxPercent, setTaxPercent] = useState(5);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Live Simulator State
  const [simSportIndex, setSimSportIndex] = useState(0);
  const [simHours, setSimHours] = useState(2);
  const [simIsPeak, setSimIsPeak] = useState(true);
  const [simIsWeekend, setSimIsWeekend] = useState(false);

  const handleRateChange = (index: number, field: 'offPeakRate' | 'peakRate' | 'weekendRate', value: number) => {
    const updated = [...rates];
    updated[index][field] = value;
    setRates(updated);
  };

  const handleSave = () => {
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  // Calculate simulated rate
  const simSport = rates[simSportIndex] || rates[0];
  const simHourlyRate = simIsWeekend ? simSport.weekendRate : simIsPeak ? simSport.peakRate : simSport.offPeakRate;
  const simGroundTotal = simHourlyRate * simHours;
  const simTax = simGroundTotal * (taxPercent / 100);
  const simTotal = simGroundTotal + simTax;
  const simAdvance = simTotal * (advanceDepositPercent / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
            Pricing & Surcharge Management
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#666666' }}>
            Configure sport-specific hourly pricing, floodlight surcharges, advance deposits, and taxes.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="btn btn-primary btn-sm"
          style={{ backgroundColor: '#C9A227', color: '#191919', fontWeight: 700 }}
        >
          <Save size={15} />
          <span>Save Pricing Rules</span>
        </button>
      </div>

      {isSavedNotice && (
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: 'rgba(33, 134, 83, 0.08)', border: '1px solid #218653', color: '#218653', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <Check size={16} style={{ color: '#218653' }} />
          <span>Pricing rules saved successfully! Future booking calculations will apply updated rates.</span>
        </div>
      )}

      {/* Main Grid: Rates Table + Live Calculator */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Sport Rates Configuration Table */}
        <div className="card-turf" style={{ padding: 'clamp(1rem, 2.5vw, 1.75rem)', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E8E2D5', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '1.25rem', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.25rem' }}>
            Base & Period Rates by Sport
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#666666', marginBottom: '1.5rem' }}>
            Off-Peak (6 AM–4 PM) • Peak (4 PM–12 AM) • Weekend Prime
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {rates.map((rate, idx) => (
              <div
                key={rate.sportId}
                style={{
                  padding: 'clamp(0.85rem, 2vw, 1.25rem)',
                  backgroundColor: '#FAF8F3',
                  borderRadius: '12px',
                  border: '1px solid #E8E2D5',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '1rem', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                    {rate.sportName}
                  </strong>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9D7916', backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    Min {rate.minHours} hr
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 110px), 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#666666', marginBottom: '0.25rem', fontWeight: 600 }}>
                      Off-Peak (₹/hr)
                    </label>
                    <input
                      type="number"
                      step={50}
                      value={rate.offPeakRate}
                      onChange={(e) => handleRateChange(idx, 'offPeakRate', Number(e.target.value))}
                      style={{ width: '100%', padding: '0.55rem', backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: '6px', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#666666', marginBottom: '0.25rem', fontWeight: 600 }}>
                      Peak Night (₹/hr)
                    </label>
                    <input
                      type="number"
                      step={50}
                      value={rate.peakRate}
                      onChange={(e) => handleRateChange(idx, 'peakRate', Number(e.target.value))}
                      style={{ width: '100%', padding: '0.55rem', backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: '6px', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#666666', marginBottom: '0.25rem', fontWeight: 600 }}>
                      Weekend (₹/hr)
                    </label>
                    <input
                      type="number"
                      step={50}
                      value={rate.weekendRate}
                      onChange={(e) => handleRateChange(idx, 'weekendRate', Number(e.target.value))}
                      style={{ width: '100%', padding: '0.55rem', backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: '6px', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Policy Settings & Live Fare Simulator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Global Surcharges & Taxes */}
          <div className="card-turf" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E8E2D5', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '1.25rem' }}>
              Facility Fees & Policy Rules
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Advance Deposit (%)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={advanceDepositPercent}
                    onChange={(e) => setAdvanceDepositPercent(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem', backgroundColor: '#FAF8F3', border: '1px solid #E8E2D5', borderRadius: '8px', color: '#191919', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#191919', marginBottom: '0.3rem', fontWeight: 600 }}>
                    GST Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={28}
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem', backgroundColor: '#FAF8F3', border: '1px solid #E8E2D5', borderRadius: '8px', color: '#191919', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Live Price Simulator */}
          <div className="card-turf" style={{ padding: 'clamp(1rem, 2.5vw, 1.75rem)', backgroundColor: '#FAF8F3', border: '1.5px solid #C9A227', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Calculator size={18} style={{ color: '#C9A227' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#191919', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                Live Pricing Preview Simulator
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#666666', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Select Sport
                </label>
                <select
                  value={simSportIndex}
                  onChange={(e) => setSimSportIndex(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.6rem', backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: '8px', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outline: 'none' }}
                >
                  {rates.map((r, i) => (
                    <option key={r.sportId} value={i}>{r.sportName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 110px), 1fr))', gap: '0.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#666666', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Hours
                  </label>
                  <select
                    value={simHours}
                    onChange={(e) => setSimHours(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.6rem', backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: '8px', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outline: 'none' }}
                  >
                    <option value={1}>1 hour</option>
                    <option value={1.5}>1.5 hours</option>
                    <option value={2}>2 hours</option>
                    <option value={3}>3 hours</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#666666', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Period
                  </label>
                  <select
                    value={simIsPeak ? 'peak' : 'offpeak'}
                    onChange={(e) => setSimIsPeak(e.target.value === 'peak')}
                    style={{ width: '100%', padding: '0.6rem', backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: '8px', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outline: 'none' }}
                  >
                    <option value="offpeak">Off-Peak</option>
                    <option value="peak">Peak Floodlights</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#666666', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Day Type
                  </label>
                  <select
                    value={simIsWeekend ? 'weekend' : 'weekday'}
                    onChange={(e) => setSimIsWeekend(e.target.value === 'weekend')}
                    style={{ width: '100%', padding: '0.6rem', backgroundColor: '#FFFFFF', border: '1px solid #E8E2D5', borderRadius: '8px', color: '#191919', fontSize: '16px', minHeight: '44px', boxSizing: 'border-box', outline: 'none' }}
                  >
                    <option value="weekday">Weekday</option>
                    <option value="weekend">Weekend</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Calculated Preview Box */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '1rem', border: '1px solid #E8E2D5', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: '#666666' }}>Calculated Hourly Rate:</span>
                <strong style={{ color: '#191919' }}>₹{simHourlyRate}/hr</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: '#666666' }}>Ground Charges ({simHours}h):</span>
                <span style={{ color: '#191919' }}>₹{simGroundTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#666666' }}>GST ({taxPercent}%):</span>
                <span style={{ color: '#191919' }}>₹{simTax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #E8E2D5', fontSize: '1rem', fontWeight: 800 }}>
                <span style={{ color: '#191919' }}>Simulated Total:</span>
                <span style={{ color: '#C9A227' }}>₹{simTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666666', marginTop: '0.25rem' }}>
                <span>Advance Required ({advanceDepositPercent}%):</span>
                <span style={{ fontWeight: 600, color: '#191919' }}>₹{simAdvance.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
