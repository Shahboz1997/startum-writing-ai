'use client'; 
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, AlertTriangle } from 'lucide-react';
import { signIn, getProviders } from 'next-auth/react';
import { ErrorState } from '@/components/stratum'; 

const AuthModal = ({ isOpen, onClose, onLoginSuccess, message: messageProp }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    getProviders().then((p) => setGoogleEnabled(Boolean(p?.google)));
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    setError('');
    setMessage('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!isLogin && formData.name.trim().length < 2) {
      setError('Please enter your full name');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const normalizedEmail = formData.email.trim().toLowerCase();

    setIsLoading(true);
    setError('');
    setMessage('');

    if (isLogin) {
      // --- ВХОД ---
      try {
        const res = await signIn('credentials', {
          email: normalizedEmail,
          password: formData.password,
          redirect: false,
        });

        if (res?.error) {
          setError('Invalid email or password');
        } else {
          onLoginSuccess?.();
          onClose();
        }
      } catch (err) {
        setError('Connection error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // --- РЕГИСТРАЦИЯ ---
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          body: JSON.stringify({
            email: normalizedEmail,
            password: formData.password,
            name: formData.name.trim(),
          }),
          headers: { 'Content-Type': 'application/json' },
        });

        const raw = await res.text();
        let data = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          setError(
            res.ok
              ? 'Invalid server response after registration.'
              : 'Registration failed. Please try again.'
          );
          return;
        }

        if (!res.ok) {
          setError(data.error || 'Registration failed');
          return;
        }

        const inResult = await signIn('credentials', {
          email: normalizedEmail,
          password: formData.password,
          redirect: false,
        });

        if (inResult?.error) {
          setIsLogin(true);
          setMessage('Account created. Sign in with your email and password.');
          return;
        }

        onLoginSuccess?.();
        onClose();
      } catch (err) {
        setError('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm min-h-full"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative z-10 w-full max-w-md max-h-[100dvh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 my-auto"
      >
        <button type="button" onClick={onClose} className="group absolute top-4 right-4 flex items-center justify-center min-h-[44px] min-w-[44px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg" aria-label="Close">
          <X className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} />
        </button>

        <div className="p-4 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-white">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            {(message || messageProp) && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message || messageProp}</p>}
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="mb-4"
              >
                <ErrorState
                  message={error}
                  is401={false}
                  onDismiss={() => setError('')}
                  variant="inline"
                  className="!p-4 !flex-row !justify-between"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 dark:text-white transition-all font-medium text-sm"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" strokeWidth={1.5} />
              <input
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 dark:text-white transition-all font-medium text-sm"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" strokeWidth={1.5} />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 pl-12 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 dark:text-white transition-all font-medium text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-stratum w-full min-h-[44px] py-4 rounded-xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="shimmer-layer animate-shimmer" aria-hidden />
              <span className="btn-stratum-text">{isLoading ? 'PROCESSING...' : isLogin ? 'STRATUM SIGN IN' : 'GET STARTED · STRATUM'}</span>
            </button>
          </form>

          {googleEnabled && (
            <>
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <span className="relative px-4 bg-white dark:bg-slate-900 text-xs font-medium text-slate-400">Or continue with</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  signIn('google', {
                    // Relative URL: same tab origin as the OAuth redirect (avoids localhost vs 127.0.0.1 / LAN IP mismatches).
                    callbackUrl: '/',
                  })
                }
                className="w-full min-h-[44px] flex items-center justify-center gap-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white font-medium py-4 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
            </>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setMessage('');
              }}
              className="min-h-[44px] flex items-center justify-center w-full sm:w-auto text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;


// 'use client'; // Обязательно в Next.js App Router
// import React, { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { XMarkIcon, EnvelopeIcon, LockClosedIcon, UserIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
// import { signIn } from 'next-auth/react'; // Импорт функции входа

// const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
//   const [isLogin, setIsLogin] = useState(true);
//   const [formData, setFormData] = useState({ email: '', password: '', name: '' });
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false); // Состояние загрузки

//   if (!isOpen) return null;

//   const validate = () => {
//     setError('');
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(formData.email)) {
//       setError('Please enter a valid email address');
//       return false;
//     }
//     if (formData.password.length < 6) {
//       setError('Password must be at least 6 characters long');
//       return false;
//     }
//     if (!isLogin && formData.name.trim().length < 2) {
//       setError('Please enter your full name');
//       return false;
//     }
//     return true;
//   };

//   // ОБНОВЛЕННАЯ ФУНКЦИЯ ОТПРАВКИ
//    const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validate()) return;

//     setIsLoading(true);
//     setError('');

//     if (isLogin) {
//       // --- ЛОГИКА ВХОДА (ИСПРАВЛЕНО) ---
//       try {
//         const res = await signIn('credentials', {
//           email: formData.email,
//           password: formData.password,
//           redirect: false, // Чтобы не перезагружать страницу при ошибке
//         });

//         if (res?.error) {
//           setError('Invalid email or password');
//         } else {
//           onLoginSuccess?.();
//           onClose();
//         }
//       } catch (err) {
//         setError('Connection error');
//       } finally {
//         setIsLoading(false);
//       }
//     } else {
//       // --- ЛОГИКА РЕГИСТРАЦИИ (БЕЗ ИЗМЕНЕНИЙ) ---
//       try {
//         const res = await fetch('/api/register', {
//           method: 'POST',
//           body: JSON.stringify({ 
//             email: formData.email, 
//             password: formData.password, 
//             name: formData.name 
//           }),
//           headers: { 'Content-Type': 'application/json' }
//         });

//         if (res.ok) {
//           // Автоматический вход после успешной регистрации
//           await signIn('credentials', {
//             email: formData.email,
//             password: formData.password,
//             callbackUrl: '/'
//           });
//         } else {
//           const data = await res.json();
//           setError(data.error || 'Registration failed');
//         }
//       } catch (err) {
//         setError('Something went wrong');
//       } finally {
//         setIsLoading(false);
//       }
//     }
//   };


//   return (
//     <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
//       <motion.div 
//         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//         onClick={onClose}
//         className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
//       />

//       <motion.div 
//         initial={{ scale: 0.9, opacity: 0, y: 20 }}
//         animate={{ scale: 1, opacity: 1, y: 0 }}
//         exit={{ scale: 0.9, opacity: 0, y: 20 }}
//         className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
//       >
//         <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-red-600 transition-colors">
//           <XMarkIcon className="w-6 h-6" />
//         </button>

//         <div className="p-8">
//           <div className="text-center mb-6">
//             <h2 className="text-3xl font-black uppercase italic dark:text-white">
//               {isLogin ? 'Welcome Back' : 'Join the Club'}
//             </h2>
//           </div>

//           <AnimatePresence mode="wait">
//             {error && (
//               <motion.div 
//                 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
//                 className="mb-4 p-3 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold"
//               >
//                 <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
//                 {error}
//               </motion.div>
//             )}
//           </AnimatePresence>

//           <form className="space-y-4" onSubmit={handleSubmit}>
//             {!isLogin && (
//               <div className="relative">
//                 <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
//                 <input 
//                   type="text" 
//                   placeholder="Full Name" 
//                   value={formData.name}
//                   onChange={(e) => setFormData({...formData, name: e.target.value})}
//                   className="w-full bg-slate-100 dark:bg-slate-800 p-4 pl-12 rounded-2xl outline-none focus:ring-2 ring-red-600 dark:text-white transition-all font-bold text-sm" 
//                 />
//               </div>
//             )}
            
//             <div className="relative">
//               <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
//               <input 
//                 type="email" 
//                 placeholder="Email Address" 
//                 value={formData.email}
//                 onChange={(e) => setFormData({...formData, email: e.target.value})}
//                 className="w-full bg-slate-100 dark:bg-slate-800 p-4 pl-12 rounded-2xl outline-none focus:ring-2 ring-red-600 dark:text-white transition-all font-bold text-sm" 
//               />
//             </div>

//             <div className="relative">
//               <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
//               <input 
//                 type="password" 
//                 placeholder="Password" 
//                 value={formData.password}
//                 onChange={(e) => setFormData({...formData, password: e.target.value})}
//                 className="w-full bg-slate-100 dark:bg-slate-800 p-4 pl-12 rounded-2xl outline-none focus:ring-2 ring-red-600 dark:text-white transition-all font-bold text-sm" 
//               />
//             </div>

//             <button 
//               type="submit" 
//               disabled={isLoading}
//               className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-black uppercase py-4 rounded-2xl shadow-lg shadow-red-600/30 transition-all active:scale-[0.98]"
//             >
//               {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Get Started')}
//             </button>
//           </form>

//           <div className="relative my-8 text-center">
//             <div className="absolute inset-0 flex items-center">
//               <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
//             </div>
//             <span className="relative px-4 bg-white dark:bg-slate-900 text-[10px] font-black uppercase text-slate-400 italic">
//               Or speed up with
//             </span>
//           </div>

//           <button 
//             type="button"
//             onClick={() => signIn('google', { callbackUrl: '/' })} // ПРИВЯЗКА GOOGLE
//             className="w-full flex items-center justify-center gap-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black uppercase py-4 rounded-2xl transition-all border border-slate-200 dark:border-slate-700"
//           >
//             <svg className="w-5 h-5" viewBox="0 0 24 24">
//               <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
//               <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
//               <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
//               <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
//             </svg>
//             Google Login
//           </button>

//           <div className="mt-6 text-center">
//             <button 
//               onClick={() => { setIsLogin(!isLogin); setError(''); }}
//               className="text-xs font-black uppercase text-slate-500 hover:text-red-600 transition-colors"
//             >
//               {isLogin ? "Don't have an account? Register" : "Already a member? Login"}
//             </button>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

// export default AuthModal;



