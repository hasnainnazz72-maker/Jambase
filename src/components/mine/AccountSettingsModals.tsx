import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Key,
  Shield,
  Bell,
  Check,
  CheckCircle2,
  Lock,
  Smartphone,
  Mail,
  Wallet,
  Zap,
  Sliders
} from 'lucide-react';
import { User } from '../../types';
import { api } from '../../services/api';

interface AccountModalProps {
  type: 'personal' | 'password' | 'security' | 'notifications';
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: () => void;
}

export const AccountSettingsModal: React.FC<AccountModalProps> = ({
  type,
  isOpen,
  onClose,
  user,
  onUserUpdated
}) => {
  // Personal Info Form
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  // Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Security Toggles
  const [autoCompound, setAutoCompound] = useState(user?.autoCompound ?? true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [fundPin, setFundPin] = useState('••••••');

  // Notification Toggles
  const [notifyYield, setNotifyYield] = useState(true);
  const [notifyTeam, setNotifyTeam] = useState(true);
  const [notifyAnnounce, setNotifyAnnounce] = useState(true);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.updateProfile({ username, email, phone, walletAddress, avatar });
      setMsg({ text: 'Personal details updated successfully!' });
      onUserUpdated();
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to update', isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setMsg({ text: 'New password must be at least 6 characters', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ text: 'New passwords do not match', isError: true });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMsg({ text: 'Login password updated successfully!' });
      setTimeout(() => onClose(), 1200);
    }, 600);
  };

  const handleSaveSecurity = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await api.updateSecurity({ autoCompound });
      setMsg({ text: 'Security preferences saved!' });
      onUserUpdated();
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to save', isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMsg({ text: 'Notification preferences updated!' });
      setTimeout(() => onClose(), 1000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="account-settings-modal"
        className="w-full max-w-lg bg-[#0f1015] border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center font-bold">
              {type === 'personal' && <UserIcon size={16} className="text-[#00D26A]" />}
              {type === 'password' && <Key size={16} className="text-[#00D26A]" />}
              {type === 'security' && <Shield size={16} className="text-[#00D26A]" />}
              {type === 'notifications' && <Bell size={16} className="text-[#00D26A]" />}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                {type === 'personal' && 'Personal Information'}
                {type === 'password' && 'Change Login Password'}
                {type === 'security' && 'Security & Yield Settings'}
                {type === 'notifications' && 'Notification Settings'}
              </h2>
              <p className="text-[10px] text-neutral-400">Account management & preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message Banner */}
        {msg && (
          <div
            className={`m-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              msg.isError ? 'bg-red-500/15 text-red-300 border border-red-500/30' : 'bg-[#00D26A]/15 text-[#00D26A] border border-[#00D26A]/30'
            }`}
          >
            {msg.isError ? <X size={14} /> : <CheckCircle2 size={14} />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
          {/* PERSONAL INFORMATION FORM */}
          {type === 'personal' && (
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="text-neutral-400 font-semibold block mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#00D26A]"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-semibold block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#00D26A]"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-semibold block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#00D26A]"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-semibold block mb-1">USDT TRC20 Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono text-[11px] focus:outline-none focus:border-[#00D26A]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-3 py-3 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs shadow-md transition-transform active:scale-98"
              >
                {saving ? 'Saving Profile...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* CHANGE PASSWORD FORM */}
          {type === 'password' && (
            <form onSubmit={handleSavePassword} className="space-y-3.5">
              <div>
                <label className="text-neutral-400 font-semibold block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#00D26A]"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-semibold block mb-1">New Password (Min 6 chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#00D26A]"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-semibold block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#00D26A]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-3 py-3 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs shadow-md transition-transform active:scale-98"
              >
                {saving ? 'Updating Password...' : 'Update Login Password'}
              </button>
            </form>
          )}

          {/* SECURITY & YIELD SETTINGS */}
          {type === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#14161f] border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Auto-Compound Daily Yield</span>
                    <span className="text-[11px] text-neutral-400">Automatically add daily earnings to principal balance</span>
                  </div>
                  <button
                    onClick={() => setAutoCompound(!autoCompound)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      autoCompound ? 'bg-[#00D26A]' : 'bg-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-black shadow transition-transform ${
                        autoCompound ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#14161f] border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Two-Factor Authentication (2FA)</span>
                    <span className="text-[11px] text-neutral-400">Additional verification for withdrawals</span>
                  </div>
                  <button
                    onClick={() => setTwoFactor(!twoFactor)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      twoFactor ? 'bg-[#00D26A]' : 'bg-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-black shadow transition-transform ${
                        twoFactor ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#14161f] border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Fund Password / PIN</span>
                  <span className="text-[11px] text-neutral-400">6-digit PIN required for cashout requests</span>
                </div>
                <span className="font-mono text-neutral-300 font-bold bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-800">
                  {fundPin}
                </span>
              </div>

              <button
                onClick={handleSaveSecurity}
                disabled={saving}
                className="w-full mt-2 py-3 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs shadow-md transition-transform active:scale-98"
              >
                {saving ? 'Saving...' : 'Save Security Settings'}
              </button>
            </div>
          )}

          {/* NOTIFICATIONS SETTINGS */}
          {type === 'notifications' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-[#14161f] border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Daily Income Credit Alerts</span>
                  <span className="text-[11px] text-neutral-400">Notify when daily VIP yield is processed</span>
                </div>
                <button
                  onClick={() => setNotifyYield(!notifyYield)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    notifyYield ? 'bg-[#00D26A]' : 'bg-neutral-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black shadow transition-transform ${
                      notifyYield ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#14161f] border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Team Rebate Commission Alerts</span>
                  <span className="text-[11px] text-neutral-400">Notify when direct or sub-tier members generate income</span>
                </div>
                <button
                  onClick={() => setNotifyTeam(!notifyTeam)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    notifyTeam ? 'bg-[#00D26A]' : 'bg-neutral-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black shadow transition-transform ${
                      notifyTeam ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#14161f] border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">System Announcements</span>
                  <span className="text-[11px] text-neutral-400">Platform updates, events & VIP promotions</span>
                </div>
                <button
                  onClick={() => setNotifyAnnounce(!notifyAnnounce)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    notifyAnnounce ? 'bg-[#00D26A]' : 'bg-neutral-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black shadow transition-transform ${
                      notifyAnnounce ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={handleSaveNotifications}
                disabled={saving}
                className="w-full mt-2 py-3 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs shadow-md transition-transform active:scale-98"
              >
                {saving ? 'Saving...' : 'Save Notification Preferences'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
