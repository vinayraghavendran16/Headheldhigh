import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Target, Zap, ArrowRight, CheckCircle, Search } from 'lucide-react';
import { getPlatformStats } from '../services/api';
import type { PlatformStats } from '../types';

export default function Landing() {
  const [stats, setStats] = useState<PlatformStats>({
    talent_pool_count: 0,
    jobs_matched_total: 0,
  });

  useEffect(() => {
    getPlatformStats()
      .then(setStats)
      .catch(() => {
        // Silently fall back to zeros; backend may not be running
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/40 border border-indigo-400/50 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Zap className="h-3.5 w-3.5" />
            AI-powered job matching for laid-off professionals
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Get back on your feet.
            <br />
            <span className="text-indigo-200">Find your next role.</span>
          </h1>

          <p className="text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your resume, get instantly matched to hundreds of open positions,
            and join a growing talent pool that connects laid-off workers with recruiters.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-6 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
            >
              <Briefcase className="h-5 w-5" />
              Upload Your Resume
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/talent-pool"
              className="inline-flex items-center gap-2 bg-indigo-500/30 border border-white/30 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-indigo-500/50 transition-colors"
            >
              <Users className="h-5 w-5" />
              Browse Talent Pool
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600">
                {stats.talent_pool_count.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">Professionals in talent pool</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">
                {stats.jobs_matched_total.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">Job matches made</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">3</div>
              <div className="text-sm text-gray-500 mt-0.5">Minutes to get matched</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">50+</div>
              <div className="text-sm text-gray-500 mt-0.5">Jobs analyzed per user</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              icon: <Briefcase className="h-8 w-8 text-indigo-600" />,
              step: '01',
              title: 'Upload your resume',
              desc: 'Drop your PDF or DOCX. Our AI instantly extracts your skills, experience, and career highlights.',
            },
            {
              icon: <Search className="h-8 w-8 text-indigo-600" />,
              step: '02',
              title: 'Get matched to jobs',
              desc: 'We search thousands of live postings from LinkedIn, Indeed, and Glassdoor, then score each one 0–100 for your profile.',
            },
            {
              icon: <Target className="h-8 w-8 text-indigo-600" />,
              step: '03',
              title: 'Land your next role',
              desc: 'Apply directly, track your applications, identify skills gaps, and be discovered by recruiters in our talent pool.',
            },
          ].map((item) => (
            <div key={item.step} className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
              <div className="absolute top-5 right-5 text-4xl font-black text-gray-100">
                {item.step}
              </div>
              <div className="mb-4">{item.icon}</div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-indigo-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Everything you need to bounce back
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              'AI resume parsing – no manual entry',
              'Real-time job search across all major boards',
              'Relevance scores with detailed reasons',
              'Skills gap analysis & learning resources',
              'Application tracker (saved, applied, offered)',
              'Public talent pool for recruiter visibility',
              'Weekly digest shared with hiring community',
              'Free to use, always',
              'Your data, your control',
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to find your next role?</h2>
          <p className="text-gray-600 mb-8">It takes less than 3 minutes. No account needed to start.</p>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-md text-lg"
          >
            Upload Your Resume <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-sm py-8 text-center">
        <p>HeadHeldHigh — for everyone navigating a career transition.</p>
        <div className="flex justify-center gap-6 mt-3">
          <Link to="/talent-pool" className="hover:text-white transition-colors">Talent Pool</Link>
          <Link to="/admin/digest" className="hover:text-white transition-colors">Admin Digest</Link>
        </div>
      </footer>
    </div>
  );
}
