import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSupabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          console.log('Supabase not configured');
          router.push('/');
          return;
        }

        // Supabase automatically handles the session from the URL hash
        // Just wait a moment for it to be processed
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Auth successful:', session.user.email);
          
          // Create user record in database
          const { error } = await supabase
            .from('users')
            .upsert({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name,
              google_id: session.user.id,
              tier: 'free',
              is_paid: false,
              created_at: new Date(),
            }, {
              onConflict: 'id'
            });

          if (error) {
            console.error('Error creating user:', error);
          } else {
            console.log('User record created/updated');
          }

          // Redirect to home
          router.push('/');
        } else {
          console.log('No session found, redirecting to home');
          router.push('/');
        }
      } catch (error) {
        console.error('Callback error:', error);
        router.push('/');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg text-gray-600 mb-2">Signing you in...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}
