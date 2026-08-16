import { suppenstudiosAuth } from './suppenstudiosAuth';

const SIDEQUEST_API_URL = 'https://sidequest.suppenstudios.work';

export async function unlockSideQuestAchievement(achievementKey: string): Promise<boolean> {
  const user = suppenstudiosAuth.getUser();
  const token = suppenstudiosAuth.getToken();
  if (!user) return false;

  try {
    const res = await fetch(`${SIDEQUEST_API_URL}/api/achievements/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || ''}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        achievement_key: achievementKey,
        user_id: user.id,
        username: user.username,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
