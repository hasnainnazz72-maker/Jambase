import React, { useState } from 'react';
import { Users, Check, Gift, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TaskItem, User } from '../../types';
import { api } from '../../services/api';

interface TaskViewProps {
  tasks: TaskItem[];
  user: User | null;
  onRefresh: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const TaskView: React.FC<TaskViewProps> = ({ tasks = [], user, onRefresh }) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const safeTasks = tasks.length > 0 ? tasks : [
    {
      id: 'task-invite-5',
      title: 'Invite 5 valid A-level direct members',
      description: 'Invite 5 valid A-level direct members to claim 3,000 ETB reward',
      rewardAmount: 3000,
      rewardType: 'balance',
      progress: Math.min(5, user?.validDirectMembersCount || 0),
      maxProgress: 5,
      isCompleted: (user?.validDirectMembersCount || 0) >= 5,
      isClaimed: (user?.claimedTaskIds || []).includes('task-invite-5'),
      icon: 'Users',
      category: 'growth'
    },
    {
      id: 'task-activate-10',
      title: 'Activate 10 valid A-level direct members',
      description: 'Activate 10 valid A-level direct members to claim 6,000 ETB reward',
      rewardAmount: 6000,
      rewardType: 'balance',
      progress: Math.min(10, user?.validDirectMembersCount || 0),
      maxProgress: 10,
      isCompleted: (user?.validDirectMembersCount || 0) >= 10,
      isClaimed: (user?.claimedTaskIds || []).includes('task-activate-10'),
      icon: 'Users',
      category: 'growth'
    },
    {
      id: 'task-activate-20',
      title: 'Activate 20 valid A-level direct members',
      description: 'Activate 20 valid A-level direct members to claim 20,000 ETB reward',
      rewardAmount: 20000,
      rewardType: 'balance',
      progress: Math.min(20, user?.validDirectMembersCount || 0),
      maxProgress: 20,
      isCompleted: (user?.validDirectMembersCount || 0) >= 20,
      isClaimed: (user?.claimedTaskIds || []).includes('task-activate-20'),
      icon: 'Users',
      category: 'growth'
    },
    {
      id: 'task-activate-50',
      title: 'Activate 50 valid direct members',
      description: 'Activate 50 valid direct members to claim 100,000 ETB reward',
      rewardAmount: 100000,
      rewardType: 'balance',
      progress: Math.min(50, user?.validDirectMembersCount || 0),
      maxProgress: 50,
      isCompleted: (user?.validDirectMembersCount || 0) >= 50,
      isClaimed: (user?.claimedTaskIds || []).includes('task-activate-50'),
      icon: 'Users',
      category: 'growth'
    }
  ];

  const handleClaim = async (task: TaskItem) => {
    if (task.isClaimed) return;
    if (task.progress < task.maxProgress) {
      setFeedback({
        type: 'error',
        message: `Condition not met: You currently have ${task.progress}/${task.maxProgress} valid direct members.`
      });
      return;
    }

    setClaimingId(task.id);
    setFeedback(null);

    try {
      const res = await api.claimTask(task.id);
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
      setFeedback({
        type: 'success',
        message: res.message || `Successfully claimed ${task.rewardAmount.toLocaleString()} ETB reward!`
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to claim task reward'
      });
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div id="task-view-container" className="pb-28 space-y-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e2118] via-[#10141b] to-[#0d0e12] border border-[#00D26A]/30 p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#00D26A] text-black flex items-center justify-center font-black shadow-lg shadow-[#00D26A]/30">
              <Gift size={20} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-white">Task Rewards</h2>
              <p className="text-xs text-neutral-400">Complete invitation milestones to claim cash bonuses</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-neutral-400 block font-medium">Valid Direct</span>
            <span className="text-sm font-extrabold text-[#00D26A]">
              {user?.validDirectMembersCount || 0} Members
            </span>
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`mt-4 p-3 rounded-2xl border text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <Sparkles size={16} className="text-[#00D26A] shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-400 shrink-0" />
            )}
            <p className="font-semibold leading-tight">{feedback.message}</p>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-neutral-300 uppercase tracking-wider">
            Direct Referral Tasks
          </h3>
          <span className="text-[11px] text-neutral-500 font-semibold">
            {safeTasks.filter(t => t.isClaimed).length} / {safeTasks.length} Claimed
          </span>
        </div>

        {safeTasks.map((task) => {
          const isDone = task.progress >= task.maxProgress;
          const isClaimed = task.isClaimed;
          const isClaiming = claimingId === task.id;

          return (
            <div
              key={task.id}
              id={`task-item-${task.id}`}
              className={`bg-[#12131a] border rounded-2xl p-4 transition-all duration-200 ${
                isClaimed
                  ? 'border-neutral-800/60 opacity-80'
                  : isDone
                  ? 'border-[#00D26A]/50 bg-[#121b16]/70 shadow-lg shadow-[#00D26A]/10'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isDone
                        ? 'bg-[#00D26A]/20 border-[#00D26A]/40 text-[#00D26A]'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Users size={18} />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Reward: <strong className="text-[#00D26A] font-extrabold">+{task.rewardAmount.toLocaleString()} ETB</strong>
                    </p>

                    {/* Progress indicator */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="w-28 sm:w-36 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isDone ? 'bg-[#00D26A]' : 'bg-amber-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (task.progress / task.maxProgress) * 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-neutral-400 font-semibold">
                        {task.progress}/{task.maxProgress}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Claim Button next to each task */}
                <div className="shrink-0 flex items-center self-center">
                  {isClaimed ? (
                    <button
                      disabled
                      id={`btn-claimed-${task.id}`}
                      className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-500 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed"
                    >
                      <Check size={14} className="text-neutral-500" />
                      <span>Claimed</span>
                    </button>
                  ) : isDone ? (
                    <button
                      onClick={() => handleClaim(task)}
                      disabled={isClaiming}
                      id={`btn-claim-${task.id}`}
                      className="px-4 py-2 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black font-extrabold text-xs shadow-md shadow-[#00D26A]/30 transition-all active:scale-95 flex items-center gap-1.5 animate-pulse"
                    >
                      {isClaiming ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Claiming...</span>
                        </>
                      ) : (
                        <>
                          <Gift size={14} />
                          <span>Claim {task.rewardAmount.toLocaleString()} ETB</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleClaim(task)}
                      id={`btn-locked-${task.id}`}
                      className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-semibold hover:border-neutral-700 transition-colors"
                    >
                      <span>Claim {task.rewardAmount.toLocaleString()} ETB</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
