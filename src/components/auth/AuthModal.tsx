import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Phone, User as UserIcon, RefreshCw, ShieldCheck, ChevronDown, Search, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { COUNTRY_CODES, CountryCode } from '../../data/countryCodes';
import { api } from '../../services/api';
import { User } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'register'
}) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  
  // Country Code selector - defaults to US (+1) or first country
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Captcha State
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate random 4-character alphanumeric captcha
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  // Draw visual Captcha on canvas
  useEffect(() => {
    if (!canvasRef.current || !captchaCode) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#101712');
    grad.addColorStop(1, '#0e2619');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Random background noise lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(0, 210, 106, ${0.15 + Math.random() * 0.25})`;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Random noise dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw characters with distinct rotations and colors
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textBaseline = 'middle';

    const colors = ['#00D26A', '#ffffff', '#34d399', '#a7f3d0', '#6ee7b7'];
    for (let i = 0; i < captchaCode.length; i++) {
      ctx.save();
      const x = 20 + i * 22;
      const y = canvas.height / 2 + (Math.random() * 6 - 3);
      const angle = (Math.random() * 30 - 15) * (Math.PI / 180);
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillText(captchaCode[i], 0, 0);
      ctx.restore();
    }
  }, [captchaCode, mode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      generateCaptcha();
      setErrorMsg(null);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const filteredCountries = COUNTRY_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dial_code.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'register') {
      if (!username.trim()) {
        setErrorMsg('Please enter a valid username');
        return;
      }
      if (!phone.trim()) {
        setErrorMsg('Please enter your mobile phone number');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match');
        return;
      }
      if (captchaInput.trim().toUpperCase() !== captchaCode) {
        setErrorMsg('Incorrect Captcha code. Please enter the matching 4 characters.');
        generateCaptcha();
        return;
      }

      setLoading(true);
      try {
        const res = await api.registerUser({
          username: username.trim(),
          countryCode: selectedCountry.dial_code,
          phone: phone.trim(),
          password,
          referralCode: referralCode.trim() || undefined
        });

        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        onSuccess(res.user);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Registration failed');
        generateCaptcha();
      } finally {
        setLoading(false);
      }
    } else {
      // Login
      if (!username.trim() || !password) {
        setErrorMsg('Please enter your username/phone and password');
        return;
      }

      setLoading(true);
      try {
        const res = await api.loginUser({
          username: username.trim(),
          password
        });
        onSuccess(res.user);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm max-h-[90vh] rounded-3xl bg-[#10121a] border border-[#00D26A]/40 overflow-hidden shadow-2xl text-white flex flex-col relative">
        {/* Header */}
        <div className="relative p-5 bg-gradient-to-br from-[#0c261b] via-[#0e161f] to-[#0a0c10] border-b border-neutral-800 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/50 text-neutral-400 hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#00D26A] text-black flex items-center justify-center font-black shadow-lg shadow-[#00D26A]/30">
              <ShieldCheck size={22} />
            </span>
            <div>
              <h3 className="text-base font-black text-white">
                {mode === 'register' ? t('auth.register', 'Create JAMBASE Account') : t('auth.login', 'Account Login')}
              </h3>
              <p className="text-[11px] text-[#00D26A] font-semibold">
                {mode === 'register' ? 'Global Concert Ticketing & Assets' : 'Access your VIP investment portfolio'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 mt-4 p-1 rounded-2xl bg-black/60 border border-neutral-800">
            <button
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl text-xs font-black transition-all ${
                mode === 'register' ? 'bg-[#00D26A] text-black shadow-md shadow-[#00D26A]/20' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl text-xs font-black transition-all ${
                mode === 'login' ? 'bg-[#00D26A] text-black shadow-md shadow-[#00D26A]/20' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Username Field */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-300 mb-1 block">
              {t('auth.username', 'Username / Account ID')}
            </label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="e.g. music_investor99"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-medium focus:outline-none focus:border-[#00D26A]"
              />
            </div>
          </div>

          {/* International Country Code & Mobile Phone (Registration Mode) */}
          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-semibold text-neutral-300 mb-1 block">
                {t('auth.countryCode', 'Country Code')} & {t('auth.phone', 'Phone Number')}
              </label>
              <div className="flex gap-2">
                {/* Country Code Trigger */}
                <button
                  type="button"
                  onClick={() => setShowCountryPicker(true)}
                  className="px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-bold flex items-center gap-1.5 hover:border-neutral-700 shrink-0"
                >
                  <span className="text-base">{selectedCountry.flag}</span>
                  <span className="text-xs font-mono">{selectedCountry.dial_code}</span>
                  <ChevronDown size={14} className="text-neutral-400" />
                </button>

                {/* Phone Input */}
                <div className="relative flex-1">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="tel"
                    placeholder={t('auth.phone', 'Mobile number')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-medium focus:outline-none focus:border-[#00D26A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Password Field */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-300 mb-1 block">
              {mode === 'register' ? t('auth.password', 'Create Login Password (Min 6 chars)') : t('auth.password', 'Password')}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-medium focus:outline-none focus:border-[#00D26A]"
              />
            </div>
          </div>

          {/* Confirm Password (Registration Mode) */}
          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-semibold text-neutral-300 mb-1 block">
                {t('auth.confirmPassword', 'Confirm Password')}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-medium focus:outline-none focus:border-[#00D26A]"
                />
              </div>
            </div>
          )}

          {/* Referral Code (Registration Mode) */}
          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-semibold text-neutral-300 mb-1 block">
                {t('auth.invitationCode', 'Invitation / Referral Code (Optional)')}
              </label>
              <input
                type="text"
                placeholder="e.g. JAM888"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono font-bold focus:outline-none focus:border-[#00D26A]"
              />
            </div>
          )}

          {/* Dynamic Visual Captcha Code (Registration Mode) */}
          {mode === 'register' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-neutral-300">
                  {t('auth.captcha', 'Security Verification Captcha')}
                </label>
                <span className="text-[10px] text-neutral-500">Case-insensitive</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Visual Canvas Graphics */}
                <div className="relative rounded-xl overflow-hidden border border-neutral-700/80 shrink-0 shadow-inner">
                  <canvas ref={canvasRef} width={110} height={42} className="block" />
                </div>

                {/* Reload Button */}
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-[#00D26A] text-neutral-300 hover:text-[#00D26A] transition-colors"
                  title="Generate New Captcha"
                >
                  <RefreshCw size={16} />
                </button>

                {/* Input */}
                <input
                  type="text"
                  maxLength={4}
                  placeholder={t('auth.enterCaptcha', 'Code')}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono font-black text-center uppercase tracking-widest focus:outline-none focus:border-[#00D26A]"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-black text-xs shadow-lg shadow-[#00D26A]/30 transition-transform active:scale-98"
          >
            {loading
              ? 'Processing...'
              : mode === 'register'
              ? t('auth.submitRegister', 'Register New Account')
              : t('auth.submitLogin', 'Sign In')}
          </button>
        </form>

        {/* Country Picker Sub-Modal */}
        {showCountryPicker && (
          <div className="absolute inset-0 z-20 bg-[#10121a] flex flex-col p-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h4 className="text-sm font-extrabold text-white">
                {t('auth.countryCode', 'Select Country Calling Code')}
              </h4>
              <button
                onClick={() => setShowCountryPicker(false)}
                className="p-1.5 rounded-full bg-neutral-900 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search Input */}
            <div className="my-3 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder={t('auth.searchCountry', 'Search country name or code (+1, +44, +90, etc.)...')}
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#00D26A]"
              />
            </div>

            {/* Country List */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-900 space-y-0.5">
              {filteredCountries.map((country) => (
                <div
                  key={`${country.code}-${country.dial_code}`}
                  onClick={() => {
                    setSelectedCountry(country);
                    setShowCountryPicker(false);
                  }}
                  className={`p-2.5 rounded-xl flex items-center justify-between hover:bg-neutral-900 cursor-pointer ${
                    selectedCountry.code === country.code ? 'bg-[#00D26A]/10 text-[#00D26A]' : 'text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{country.flag}</span>
                    <span className="text-xs font-semibold">{country.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-neutral-400">{country.dial_code}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
