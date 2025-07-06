import { useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { AuthService } from '@/services/authService';

export function useAuth() {
  const {
    user,
    session,
    profile,
    loading,
    error,
    setUser,
    setSession,
    setProfile,
    setLoading,
    setError,
    signOut: storeSignOut,
  } = useAuthStore();

  useEffect(() => {
    // 初期セッションの取得
    const getInitialSession = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setSession(session);
          setUser(session.user);
          
          // プロフィール情報の取得
          const profile = await AuthService.getUserProfile(session.user.id);
          setProfile(profile);
        }
      } catch (error) {
        console.error('初期セッション取得エラー:', error);
        setError(error instanceof Error ? error.message : '認証エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        console.log('認証状態変更:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // ログイン時にプロフィール情報を取得
          const profile = await AuthService.getUserProfile(session.user.id);
          console.log('*** useAuth: 取得したプロフィール:', profile);
          setProfile(profile);
          console.log('*** useAuth: プロフィール設定完了 - hasProfile:', !!profile);
        } else {
          // ログアウト時にプロフィール情報をクリア
          setProfile(null);
        }

        setError(null);
      } catch (error) {
        console.error('認証状態変更エラー:', error);
        setError(error instanceof Error ? error.message : '認証エラーが発生しました');
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      await AuthService.signOut();
      storeSignOut();
    } catch (error) {
      console.error('サインアウトエラー:', error);
      setError(error instanceof Error ? error.message : 'サインアウトに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const profile = await AuthService.getUserProfile(user.id);
      setProfile(profile);
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    error,
    signOut,
    refreshProfile,
    isAuthenticated: !!session && !!user,
    hasProfile: !!profile,
  };
}