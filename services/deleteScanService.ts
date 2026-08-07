import { supabase } from '@/lib/supabase';

export async function deleteScan(scanId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: 'Your session has expired. Please sign in again.' };

  console.log('[deleteScanService] deleteScan called');
  const response = await fetch(
    `https://kmipbsotthgigkndazot.supabase.co/functions/v1/delete-scan`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ scan_id: scanId }),
    }
  );

  if (!response.ok) {
    await response.text().catch(() => '');
    console.log('[deleteScanService] deleteScan failed, status:', response.status);
    return { success: false, error: 'Could not delete this scan. Please try again.' };
  }

  const json = await response.json().catch(() => ({}));
  if (json.error) return { success: false, error: json.error };
  console.log('[deleteScanService] deleteScan success');
  return { success: true };
}
