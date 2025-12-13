"use client";

import React from 'react';
import Link from 'next/link';
import { SparklesIcon, BillsIcon, MealIcon, ChartBarIcon, UserCircleIcon, HomeIcon } from '@/components/Icons';
import LandingDashboardPreview from '@/components/LandingDashboardPreview';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  React.useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen">
      {/* Header */}
      <header className="py-4 px-6 md:px-12 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-8 h-8 text-primary-500" />
          <span className="font-bold text-2xl tracking-tight">BillKhata</span>
        </div>
        <div className="space-x-2">
          <Link href="/login" className="px-4 py-2 text-sm font-semibold rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-block text-slate-700 dark:text-slate-300">
            Login
          </Link>
          <Link href="/signup" className="px-4 py-2 text-sm font-semibold rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors inline-block shadow-md hover:shadow-lg">
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-10 pb-16 px-6 md:px-12 md:pt-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-2">
              🚀 Managing mess life just got easier
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              No More Mess in <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-purple-600">Your Mess!</span>
            </h1>

            <div className="space-y-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0">
              <p>
                If you live in a mess or shared bachelor house, you know the struggle:
              </p>
              <ul className="space-y-2 list-none text-left inline-block">
                {["Who gave money for bazar? 🛒", "Who didn’t pay rent yet? 🏠", "Who ate extra meals? 🍛", "What’s the bua’s phone number? 📱", "Why is every month full of drama? 😫"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500/60 block mt-1 shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="italic font-medium text-slate-700 dark:text-slate-300 pt-2">
                Then suddenly everyone becomes a CA and starts fighting with calculators. 😄
              </p>
              <p className="font-medium text-primary-600 dark:text-primary-400">
                That’s exactly why we made BillKhata — to stop arguments and make shared living actually peaceful.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="px-8 py-3.5 font-bold rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-all hover:scale-105 shadow-lg hover:shadow-primary-500/25 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Install App
                </button>
              ) : (
                <Link href="/signup" className="px-8 py-3.5 font-bold rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-all hover:scale-105 shadow-lg hover:shadow-primary-500/25 inline-block">
                  start Your Khata
                </Link>
              )}
              <Link href="/tour" className="px-8 py-3.5 font-bold rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-105 inline-block shadow-sm">
                Tour
              </Link>
            </div>
          </div>

          <div className="hidden lg:block relative z-10 perspective-1000">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary-500/20 to-purple-500/20 rounded-[2rem] blur-xl opacity-70 animate-pulse"></div>
            <div className="relative transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-500 ease-out">
              <LandingDashboardPreview />
            </div>
          </div>
        </div>
      </main>

      {/* What's the Problem Section */}
      <section className="py-20 bg-white dark:bg-slate-800/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">What’s the Problem? 🤔</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20">
              <h3 className="font-bold text-xl mb-3 text-rose-600 dark:text-rose-400">The Struggle</h3>
              <ul className="text-left space-y-3 text-slate-700 dark:text-slate-300">
                <li>❌ Meal rate changes every day — everyone gets confused</li>
                <li>❌ Someone pays for grocery, another for gas… nobody remembers</li>
                <li>❌ Rent, WiFi, bua bill… everything is jumbled</li>
                <li>❌ Notes and papers get lost easily</li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 flex flex-col justify-center">
              <p className="text-xl font-medium text-slate-800 dark:text-slate-200">
                Living with friends is fun... <br />
                <span className="text-amber-600 dark:text-amber-400">But keeping track of money? Not fun at all.</span>
              </p>
              <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800/30">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  When it’s time to calculate → <br />Friendship becomes fragile 💔
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Does BillKhata Do Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">What Does BillKhata Do? 💡</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Think of BillKhata as a smart manager for your mess — but digital, honest, and doesn’t fight with you. 😌
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <MealIcon className="w-8 h-8 text-white" />,
                title: "Daily Meal Count",
                desc: "Just add meals, we do the math.",
                color: "bg-emerald-500"
              },
              {
                icon: <BillsIcon className="w-8 h-8 text-white" />,
                title: "Instant Meal Rate",
                desc: "Expenses go up → rate updates. No debate.",
                color: "bg-blue-500"
              },
              {
                icon: <SparklesIcon className="w-8 h-8 text-white" />,
                title: "Who Paid What?",
                desc: "Add any expense (rent, gas, spices!) and split it easily.",
                color: "bg-purple-500"
              },
              {
                icon: <UserCircleIcon className="w-8 h-8 text-white" />,
                title: "Personal Accounts",
                desc: "Everyone sees exactly what they owe. Zero drama.",
                color: "bg-orange-500"
              },
              {
                icon: <HomeIcon className="w-8 h-8 text-white" />,
                title: "Mess Info Hub",
                desc: "Bua’s number, Rent details, Rules - all in one place.",
                color: "bg-pink-500"
              },
              {
                icon: <ChartBarIcon className="w-8 h-8 text-white" />,
                title: "No More Scroll",
                desc: "No more scrolling through 200 WhatsApp messages for info.",
                color: "bg-cyan-500"
              },
            ].map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
                <div className={`${feature.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3 group-hover:rotate-6 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section className="py-20 bg-slate-100 dark:bg-slate-900/50 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Who’s It For? 👥</h2>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {[
              "🎓 University students in mess",
              "💼 Job holders away from home",
              "🏠 Any bachelor sharing room & food",
              "😅 Anyone tired of end-of-month fights"
            ].map((item, i) => (
              <div key={i} className="px-6 py-4 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 font-medium text-lg flex items-center gap-3">
                <span className="text-primary-500">✔</span> {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why You'll Love It Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Why You’ll Love It ❤️</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 flex items-center gap-3">
                <span className="text-2xl">💚</span> <span className="font-medium">No more misunderstandings</span>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 flex items-center gap-3">
                <span className="text-2xl">💸</span> <span className="font-medium">No more guessing bill amounts</span>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 flex items-center gap-3">
                <span className="text-2xl">😌</span> <span className="font-medium">No more “bro, pay me tomorrow”</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 flex items-center gap-3">
                <span className="text-2xl">🍛</span> <span className="font-medium">Meals tracked, rate fair</span>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20 flex items-center gap-3">
                <span className="text-2xl">📊</span> <span className="font-medium">Full transparency, zero stress</span>
              </div>
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 flex items-center gap-3">
                <span className="text-2xl">🤝</span> <span className="font-medium">Saves friendships!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6 text-center bg-primary-600 text-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">No More Mess in Your Mess</h2>
          <p className="text-primary-100 text-lg mb-8 max-w-lg mx-auto">
            Join thousands of students and bachelors living a drama-free life with BillKhata.
          </p>
          <button
            onClick={() => router.push('/signup')}
            className="px-8 py-4 bg-white text-primary-600 font-bold rounded-full text-lg shadow-xl hover:bg-slate-100 transition-colors transform hover:scale-105"
          >
            Start Your Khata For Free
          </button>
        </div>
      </section>

      {/* Footer Links */}
      <footer className="py-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 dark:text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} BillKhata. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
