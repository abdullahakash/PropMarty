import React, { useState } from 'react';
import { Building2, ShieldCheck, Users, Smartphone, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { signInWithGoogle } from '../firebase.ts';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setIsLoading(false);
        return;
      }
      console.error('Login failed:', err);
      setErrorMsg(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md">
        
        {/* Brand Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1B262C] text-[#D35400] shadow-md mb-4 ring-4 ring-[#EAE5DC]">
            <Building2 className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-black text-[#1B262C] tracking-tight sm:text-4xl">
            PropMarty
          </h1>
          <p className="mt-2 text-base text-gray-600 font-medium">
            Field Property Data Collection Workspace
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 sm:p-8">
          
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-[#1B262C]">Team Workspace Access</h2>
            <p className="text-sm text-gray-500 mt-1">
              Sign in with your Google account to view and log real estate property entries with your team.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl text-base font-semibold text-[#1B262C] bg-white border border-gray-200 hover:bg-[#FAF9F6] hover:border-gray-300 active:bg-[#F5F2ED] shadow-xs transition min-h-[50px] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D35400]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Feature Highlights */}
          <div className="mt-8 pt-6 border-t border-gray-100 space-y-3.5 text-xs text-gray-600">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-[#F5F2ED] flex items-center justify-center text-[#1B262C]">
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <span>Mobile-friendly field data entry on streets & sites</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-[#F5F2ED] flex items-center justify-center text-[#1B262C]">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span>Shared team database with automatic collector attribution</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-[#F5F2ED] flex items-center justify-center text-[#1B262C]">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span>One-click Google Drive & Google Sheets backup synchronization</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-[#F5F2ED] flex items-center justify-center text-[#D35400]">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span>Cloud Firestore persistence with offline fallback</span>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Designed for real estate field surveyors, property brokers & research teams.
        </p>

      </div>
    </div>
  );
};
