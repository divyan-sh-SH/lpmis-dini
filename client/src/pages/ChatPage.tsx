import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import HomieAgent from '../components/HomieAgent';
import { getGroupsForUser } from '../lib/moneyApi';
import type { Group } from '../types/dashboard';

export default function ChatPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (!user) return;
    getGroupsForUser(user.user_id).then(setGroups).catch(() => {});
  }, [user]);

  return (
    // Break out of the container's pt-5, pb-12, and px-5 so the chat fills edge-to-edge
    <div className="flex flex-col flex-1 min-h-0 -mt-5 -mb-12 -mx-5">
      {user && (
        <HomieAgent userId={user.user_id} groups={groups} fullPage />
      )}
    </div>
  );
}
