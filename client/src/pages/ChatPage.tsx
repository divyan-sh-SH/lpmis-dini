import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HomieAgent from '../components/HomieAgent';
import { getGroupsForUser } from '../lib/moneyApi';
import type { Group } from '../types/dashboard';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (!user) return;
    getGroupsForUser(user.user_id).then(setGroups).catch(() => {});
  }, [user]);

  return (
    <div className="flex flex-col flex-1 min-h-0 -mt-5">
      {/* Page header */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <SmartToyRoundedIcon sx={{ fontSize: 17 }} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight">HomieAgent</p>
            <p className="text-[11px] text-slate-400 leading-tight">Your household AI assistant</p>
          </div>
        </div>
      </div>

      {/* Full-page agent */}
      {user && (
        <HomieAgent
          userId={user.user_id}
          groups={groups}
          fullPage
        />
      )}
    </div>
  );
}
