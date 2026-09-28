import React, { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { HeartPulse, Stethoscope, ShieldPlus, Activity, Loader2, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Role } from '../../types';

interface LoginPageProps {
  selectedRole: Role;
  onBack: () => void;
}

export default function LoginPage({ selectedRole, onBack }: LoginPageProps) {
  const { setUser } = useRole();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Please enter your username.');
      return;
    }
    
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password, expectedRole: selectedRole }),
        credentials: 'include'
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setError(data.error || 'Invalid username or password.');
        setPassword('');
      }
    } catch (err) {
      setError('Unable to connect to SynCura AI. Please try again.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfig = {
    'ASHA_WORKER': {
      title: 'ASHA Worker Login',
      subtitle: 'Sign in to your ASHA Worker account',
      icon: HeartPulse,
      colorClass: 'text-indigo-600',
      bgClass: 'bg-indigo-50',
      btnClass: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
    },
    'DOCTOR': {
      title: 'Doctor / Medical Officer Login',
      subtitle: 'Sign in to your clinical account',
      icon: Stethoscope,
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-50',
      btnClass: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
    },
    'SUPERVISOR': {
      title: 'Health Extension Supervisor Login',
      subtitle: 'Sign in to your supervisor account',
      icon: ShieldPlus,
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50',
      btnClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  };

  const config = roleConfig[selectedRole];
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Back button */}
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        <span className="font-medium">Back to profile selection</span>
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="relative">
            <div className={`absolute -inset-1 rounded-full blur opacity-75 bg-gradient-to-r ${selectedRole === 'ASHA_WORKER' ? 'from-indigo-600 to-purple-600' : selectedRole === 'DOCTOR' ? 'from-purple-600 to-blue-600' : 'from-blue-600 to-indigo-600'}`}></div>
            <div className="relative bg-white rounded-full p-4 shadow-xl">
              <IconComponent className={`w-10 h-10 ${config.colorClass}`} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center mt-6 space-x-2">
          <Activity className="w-6 h-6 text-gray-400" />
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            SynCura AI
          </h2>
        </div>
        <h3 className="mt-4 text-center text-xl font-bold text-gray-800">
          {config.title}
        </h3>
        <p className="mt-1 text-center text-sm text-gray-600">
          {config.subtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 focus:outline-none focus:text-indigo-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.btnClass}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
