import { useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { useErrorStore, errorStoreHelpers } from '@/store/errorStore';
import { AuthService } from '@/services/authService';
import { ErrorHandler } from '@/utils/errorHandler';

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

  const { showError, clearError } = useErrorStore();

  useEffect(() => {
    // 初期セッションの取得
    const getInitialSession = async () => {
      try {
        setLoading(true);
        clearError(); // 既存のエラーをクリア
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw ErrorHandler.handleSupabaseError(sessionError, 'initial session retrieval');
        }
        
        if (session) {
          setSession(session);
          setUser(session.user);
          
          // プロフィール情報の取得
          try {
            const profile = await AuthService.getUserProfile(session.user.id);
            setProfile(profile);
          } catch (profileError: any) {
            // プロフィール取得エラーは致命的でないため、ログのみ
            console.warn('Profile retrieval failed:', profileError);
            const appError = ErrorHandler.handleSupabaseError(profileError, 'profile retrieval during auth init');
            // 重要度が高い場合のみ表示
            if (appError.severity === 'high' || appError.severity === 'critical') {
              showError(appError);
            }
          }
        }
      } catch (error: any) {
        console.error('初期セッション取得エラー:', error);
        
        const appError = error.code && error.userMessage 
          ? error 
          : ErrorHandler.handleUnknownError(error, 'initial session retrieval');
        
        showError(appError, { autoRecover: true });
        setError(appError.userMessage);
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
        clearError(); // 認証状態変更時はエラーをクリア
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // ログイン時にプロフィール情報を取得
          try {
            const profile = await AuthService.getUserProfile(session.user.id);
            console.log('*** useAuth: 取得したプロフィール:', profile);
            setProfile(profile);
            console.log('*** useAuth: プロフィール設定完了 - hasProfile:', !!profile);
          } catch (profileError: any) {
            // プロフィール取得エラーの処理
            console.warn('Profile retrieval failed during auth state change:', profileError);
            const appError = ErrorHandler.handleSupabaseError(profileError, 'profile retrieval during auth state change');
            
            // 認証直後のプロフィール取得失敗は重要なので表示
            showError(appError);
            setError(appError.userMessage);
          }
        } else {
          // ログアウト時にプロフィール情報をクリア
          setProfile(null);
        }

        // エラーはプロフィール取得時にのみ設定される
        if (!session?.user) {
          setError(null);
        }
      } catch (error: any) {
        console.error('認証状態変更エラー:', error);
        
        const appError = ErrorHandler.handleUnknownError(error, 'auth state change');
        showError(appError);
        setError(appError.userMessage);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    return errorStoreHelpers.withErrorHandling(async () => {
      setLoading(true);
      clearError();
      
      await AuthService.signOut();
      storeSignOut();
      
      setLoading(false);
    }, 'user sign out');
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    return errorStoreHelpers.withErrorHandling(async () => {
      const profile = await AuthService.getUserProfile(user.id);
      setProfile(profile);
    }, 'profile refresh');
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