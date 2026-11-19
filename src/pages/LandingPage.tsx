import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeftRight,
  BadgeCheck,
  BookOpen,
  Compass,
  Handshake,
  Rocket,
  Search,
  Users,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 h-16 bg-white/90 backdrop-blur-md border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/assets/aistudio/Image_2_5cee0444.jpeg"
              alt="SkillBound Logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-display font-bold text-lg text-[#4338ca] tracking-tight whitespace-nowrap">
              SkillBound
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#464554]">
            <a href="#how-it-works" className="hover:text-[#0b1c30] hover:underline whitespace-nowrap">
              How It Works
            </a>
            <a href="#reciprocity" className="hover:text-[#0b1c30] hover:underline whitespace-nowrap">
              Reciprocity Model
            </a>
            <a href="#benefits" className="hover:text-[#0b1c30] hover:underline whitespace-nowrap">
              Benefits
            </a>
            <Link to="/discover" className="hover:text-[#0b1c30] hover:underline whitespace-nowrap">
              Explore Skills
            </Link>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg bg-[#4338ca] text-white text-sm font-semibold hover:bg-[#2a14b4] transition-colors whitespace-nowrap"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-lg text-sm font-semibold text-[#4338ca] hover:bg-[#eff4ff] transition-colors whitespace-nowrap"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg bg-[#4338ca] text-white text-sm font-semibold shadow-sm hover:bg-[#2a14b4] transition-colors whitespace-nowrap"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="inline-flex items-center self-start gap-2 text-xs font-semibold text-[#4338ca] bg-[#e0e0ff] px-3 py-1.5 rounded-lg">
              <GraduationCap className="w-4 h-4" />
              <span>Peer-to-Peer Skill Exchange Platform</span>
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-[1.12] tracking-tight text-[#0b1c30]">
              Learn a Skill. <br />
              <span className="text-[#4338ca]">Share a Skill.</span> <br />
              Grow Together.
            </h1>

            <p className="text-base sm:text-lg text-[#464554] leading-relaxed max-w-xl">
              SkillBound connects people who want to learn with peers who can teach. Trade knowledge, build portfolios, and grow across your community without expensive courses.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to={user ? '/dashboard' : '/signup'}
                className="px-6 py-3.5 rounded-xl bg-[#4338ca] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-[#2a14b4] transition-colors whitespace-nowrap"
              >
                <span>{user ? 'Go to Dashboard' : 'Get Started'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/discover"
                className="px-6 py-3.5 rounded-xl bg-[#e5eeff] text-[#4338ca] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#dce9ff] transition-colors whitespace-nowrap"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Skills</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-[#eff4ff] border border-[#e2e8f0]">
              <img
                src="/assets/aistudio/Image_1_69d3b065.jpeg"
                alt="Two students collaborating and exchanging skills at a library table"
                className="w-full h-72 sm:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c30]/75 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-white/95 backdrop-blur-md shadow-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#ffddb8] text-[#653e00] flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0b1c30] truncate">
                    100% Peer-to-Peer Mutual Exchange
                  </p>
                  <p className="text-xs text-[#464554] truncate">
                    Zero cash fees · Equal 1-for-1 learning hour reciprocity
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-[#eff4ff] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4338ca]">Simple Process</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0b1c30] mt-1">
              How SkillBound Works
            </h2>
            <p className="text-sm text-[#464554] mt-1">
              Direct peer knowledge exchange with no middleman.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-[#e5eeff] text-[#4338ca] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="font-display font-bold text-lg text-[#777586] tabular-nums">01</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-[#0b1c30]">Build Your Profile</h3>
              <p className="text-sm text-[#464554] leading-relaxed">
                Add skills you can teach and skills you want to learn, along with your proficiency level and availability.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-[#e0e0ff] text-[#2a14b4] flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <span className="font-display font-bold text-lg text-[#777586] tabular-nums">02</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-[#0b1c30]">Find Your Match</h3>
              <p className="text-sm text-[#464554] leading-relaxed">
                Our rule-based matcher finds peers whose teaching skills match what you need and who want what you teach.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-[#ffddb8] text-[#553300] flex items-center justify-center">
                  <Handshake className="w-5 h-5" />
                </div>
                <span className="font-display font-bold text-lg text-[#777586] tabular-nums">03</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-[#0b1c30]">Start Learning Together</h3>
              <p className="text-sm text-[#464554] leading-relaxed">
                Send a request, schedule a session, message in real time, leave reviews, and earn contribution points.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reciprocity Example */}
      <section id="reciprocity" className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#4338ca]">The Reciprocity Model</p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0b1c30] mt-1">
            How an Exchange Works
          </h2>
          <p className="text-sm text-[#464554] mt-1">
            Real peer reciprocity in action between two learners.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[#e2e8f0] shadow-md p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="p-4 rounded-xl bg-[#eff4ff] flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#4338ca] text-white font-bold flex items-center justify-center">
                  AP
                </div>
                <div>
                  <p className="font-display font-semibold text-base text-[#0b1c30]">Alex Patel</p>
                  <p className="text-xs text-[#464554]">Computer Science · Senior</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white">
                  <span className="text-[#64748b] block">Teaches</span>
                  <span className="font-semibold text-[#4338ca]">Python Scripting</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white">
                  <span className="text-[#64748b] block">Learning</span>
                  <span className="font-semibold text-[#0b1c30]">UI Design</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#eff4ff] flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#4953bc] text-white font-bold flex items-center justify-center">
                  ML
                </div>
                <div>
                  <p className="font-display font-semibold text-base text-[#0b1c30]">Maya Lin</p>
                  <p className="text-xs text-[#464554]">Visual Arts & HCI · Junior</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white">
                  <span className="text-[#64748b] block">Teaches</span>
                  <span className="font-semibold text-[#4338ca]">UI Design</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white">
                  <span className="text-[#64748b] block">Learning</span>
                  <span className="font-semibold text-[#0b1c30]">Python Scripting</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#ffddb8]/50 text-[#553300] text-xs font-medium text-center">
            Mutual Reciprocal Match — Both peers teach 1 hour and learn 1 hour with zero monetary fees.
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="bg-[#eff4ff] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4338ca]">Campus Benefits</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0b1c30] mt-1">
              Why SkillBound?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                icon: Users,
                title: 'Peer-to-peer learning',
                desc: 'Direct collaboration without rigid hierarchies or high tutoring costs.',
              },
              {
                icon: Search,
                title: 'Discover student talent',
                desc: 'Filter peers by category, proficiency level, campus location, and compatibility score.',
              },
              {
                icon: BookOpen,
                title: 'Learn while sharing',
                desc: 'Solidify your own domain mastery by teaching others while picking up new skills.',
              },
              {
                icon: Rocket,
                title: 'Meaningful connections',
                desc: 'Build cross-departmental study partnerships, schedules, and verified peer reviews.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#e0e0ff] text-[#2a14b4] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-base text-[#0b1c30]">{item.title}</h3>
                    <p className="text-sm text-[#464554] mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-2xl bg-[#4338ca] text-white p-8 sm:p-12 text-center flex flex-col items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-[#ffddb8]">
            <Rocket className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl max-w-lg">
            Your next skill could be one connection away.
          </h2>
          <p className="text-sm sm:text-base text-[#e0e0ff] max-w-md">
            Join peers trading knowledge, scheduling live study sessions, and earning rewards together.
          </p>
          <Link
            to="/signup"
            className="mt-2 px-7 py-3.5 rounded-xl bg-[#ffddb8] text-[#2a1700] font-semibold text-sm flex items-center gap-2 shadow hover:bg-[#ffb95f] transition-colors"
          >
            <span>Join SkillBound Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e2e8f0] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/assets/aistudio/Image_2_5cee0444.jpeg"
              alt="SkillBound Logo"
              className="w-6 h-6 rounded object-cover"
            />
            <span className="font-display font-semibold text-sm text-[#4338ca]">SkillBound</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[#464554]">
            <a href="#how-it-works" className="hover:text-[#0b1c30]">How It Works</a>
            <Link to="/discover" className="hover:text-[#0b1c30]">Discover</Link>
            <Link to="/login" className="hover:text-[#0b1c30]">Login</Link>
            <Link to="/signup" className="hover:text-[#0b1c30]">Sign Up</Link>
          </div>
          <p className="text-xs text-[#64748b]">© 2026 SkillBound Peer Exchange.</p>
        </div>
      </footer>
    </div>
  );
}
