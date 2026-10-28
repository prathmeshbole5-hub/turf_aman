import React, { useState } from 'react';
import { X, ShieldCheck, Lock, Smartphone, CreditCard, Building } from 'lucide-react';

interface RazorpayModalProps {
  isOpen: boolean;
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  onSuccess: (paymentId: string) => void;
  onClose: () => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  amount,
  customerName,
  customerPhone,
  customerEmail,
  onSuccess,
  onClose,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const mockPaymentId = `pay_rzp_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      onSuccess(mockPaymentId);
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Razorpay Checkout"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(25, 25, 25, 0.65)',
        backdropFilter: 'blur(8px)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90dvh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8E2D5',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 25px 60px rgba(25, 25, 25, 0.2), 0 0 35px rgba(201, 162, 39, 0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#FAF8F3',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E8E2D5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '6px',
                backgroundColor: '#0c2340',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3399cc',
                fontWeight: 800,
                fontSize: '0.9rem',
              }}
            >
              R
            </div>
            <div>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#191919', display: 'block' }}>
                Razorpay Checkout
              </span>
              <span style={{ fontSize: '0.7rem', color: '#666666', fontWeight: 600 }}>
                TURFZONE ARENA BOOKINGS
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: '0.4rem',
              color: '#666666',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Amount bar */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E8E2D5',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', fontWeight: 600 }}>
              Amount Payable
            </span>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: '#C9A227' }}>
              ₹{amount.toFixed(2)}
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#666666' }}>
            <div style={{ fontWeight: 600, color: '#191919' }}>{customerName || 'Player'}</div>
            <div>{customerPhone || '+91 98765 43210'}</div>
            {customerEmail && <div style={{ fontSize: '0.75rem', color: '#8A857A' }}>{customerEmail}</div>}
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
          <span style={{ fontSize: '0.8rem', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>
            Select Payment Method
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {/* UPI Option */}
            <div
              onClick={() => setSelectedMethod('upi')}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: selectedMethod === 'upi' ? '1.5px solid #C9A227' : '1px solid #E8E2D5',
                backgroundColor: selectedMethod === 'upi' ? '#FAF8F3' : '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Smartphone size={18} style={{ color: '#C9A227' }} />
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#191919', display: 'block' }}>
                    UPI / QR (Google Pay, PhonePe, Paytm)
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#666666' }}>
                    Instant zero-convenience fee transfer
                  </span>
                </div>
              </div>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: selectedMethod === 'upi' ? '5px solid #C9A227' : '2px solid #E8E2D5',
                  backgroundColor: 'transparent',
                }}
              />
            </div>

            {/* Debit/Credit Card */}
            <div
              onClick={() => setSelectedMethod('card')}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: selectedMethod === 'card' ? '1.5px solid #C9A227' : '1px solid #E8E2D5',
                backgroundColor: selectedMethod === 'card' ? '#FAF8F3' : '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CreditCard size={18} style={{ color: '#C9A227' }} />
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#191919', display: 'block' }}>
                    Credit & Debit Cards
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#666666' }}>
                    Visa, MasterCard, RuPay, Amex
                  </span>
                </div>
              </div>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: selectedMethod === 'card' ? '5px solid #C9A227' : '2px solid #E8E2D5',
                  backgroundColor: 'transparent',
                }}
              />
            </div>

            {/* NetBanking */}
            <div
              onClick={() => setSelectedMethod('netbanking')}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: selectedMethod === 'netbanking' ? '1.5px solid #C9A227' : '1px solid #E8E2D5',
                backgroundColor: selectedMethod === 'netbanking' ? '#FAF8F3' : '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Building size={18} style={{ color: '#C9A227' }} />
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#191919', display: 'block' }}>
                    Net Banking
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#666666' }}>
                    All major Indian banking portals
                  </span>
                </div>
              </div>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: selectedMethod === 'netbanking' ? '5px solid #C9A227' : '2px solid #E8E2D5',
                  backgroundColor: 'transparent',
                }}
              />
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', backgroundColor: '#C9A227', color: '#191919' }}
          >
            {isProcessing ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot" />
                <span>Verifying Secure Payment...</span>
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={16} />
                <span>Pay ₹{amount.toFixed(2)} Securely</span>
              </span>
            )}
          </button>

          {/* Security badge */}
          <div
            style={{
              marginTop: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              fontSize: '0.75rem',
              color: '#666666',
            }}
          >
            <ShieldCheck size={14} style={{ color: '#218653' }} />
            <span>256-bit SSL Encrypted • Verified Razorpay Checkout Integration</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorpayModal;
