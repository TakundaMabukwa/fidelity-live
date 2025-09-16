import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function getAuthenticatedUser() {
  try {
    const supabase = await createClient();
    
    // Get all cookies and find Supabase auth cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log('🔍 All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));
    
    // Look for Supabase session cookies
    const authCookies = allCookies.filter(cookie => 
      cookie.name.includes('supabase') || 
      cookie.name.includes('sb-') ||
      cookie.name.includes('auth')
    );
    
    console.log('🔍 Auth cookies found:', authCookies.map(c => c.name));
    
    if (authCookies.length === 0) {
      return { user: null, error: 'No auth cookies found' };
    }
    
    // Try to get user from Supabase using server client
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('❌ Supabase auth error:', error);
      return { user: null, error: error.message };
    }
    
    if (!user) {
      return { user: null, error: 'No authenticated user' };
    }
    
    console.log('✅ User authenticated:', user.email);
    return { user, error: null };
    
  } catch (error) {
    console.error('❌ Auth helper error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}
