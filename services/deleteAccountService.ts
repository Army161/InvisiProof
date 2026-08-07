import { supabase } from '@/lib/supabase';

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: 'Your session has expired. Please sign in again.' };

  console.log('[deleteAccountService] deleteAccount called');
  const response = await fetch(
    `https://kmipbsotthgigkndazot.supabase.co/functions/v1/delete-account`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({}),
    }
  );

  if (!response.ok) {
    await response.text().catch(() => '');
    console.log('[deleteAccountService] deleteAccount failed, status:', response.status);
    return { success: false, error: 'Account deletion failed. Please contact support.' };
  }

  const json = await response.json().catch(() => ({}));
  if (json.error) return { success: false, error: json.error };
  console.log('[deleteAccountService] deleteAccount success');
  return { success: true };
}
