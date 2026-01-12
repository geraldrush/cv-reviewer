import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!supabase) {
          console.log('Supabase not configured');
          router.push('/');
          return;
        }

        // Supabase handles the OAuth callback
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
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
          }

          // Redirect to home
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
      <p className="text-lg text-gray-600">Signing you in...</p>
    </div>
  );
}
