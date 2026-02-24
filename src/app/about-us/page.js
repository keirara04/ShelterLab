import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'About Us',
  description: 'Learn about ShelterLab — the trusted campus marketplace for university students in Korea.',
}

export default function AboutUs() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #000000 0%, #0a0f1a 40%, #0d1117 60%, #000000 100%)' }}>
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 20% 0%, rgba(20,184,166,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(99,102,241,0.04) 0%, transparent 50%)',
      }} />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-14 sm:pb-20 text-center">
        {/* Floating glow behind title */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[500px] h-[200px] sm:h-[300px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse, rgba(20,184,166,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />

        <p className="relative text-teal-400 text-xs sm:text-sm font-bold tracking-widest uppercase mb-4 sm:mb-6">Your Campus Marketplace</p>
        <h1 className="relative text-4xl sm:text-7xl lg:text-8xl font-black leading-[0.9] mb-4 sm:mb-6">
          <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">About</span>
          <br />
          <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">ShelterLab</span>
        </h1>
        <p className="relative text-gray-400 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
          Find what you need, leave what you don&apos;t.
        </p>

        {/* Italic mission quote — editorial style */}
        <div className="relative max-w-2xl mx-auto mt-8 sm:mt-10 pt-6 sm:pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="italic text-gray-300 text-sm sm:text-lg leading-relaxed text-center">
            An exclusive connection to your campus community for more meaningful buying and selling.
            <br className="hidden sm:block" />
            Marketplace experiences crafted for students, by students, across Korea&apos;s top universities.
          </p>
        </div>
      </section>

      {/* ── Stats Row ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 pb-14 sm:pb-20">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-6">
          {[
            { value: '9', label: 'Universities', color: '#14b8a6' },
            { value: 'Students', label: 'Exclusive Access', color: '#06b6d4' },
            { value: 'Free', label: 'Zero Platform Fees', color: '#34d399' },
          ].map((stat) => (
            <div key={stat.label} className="relative text-center py-4 sm:py-8 rounded-2xl sm:rounded-3xl overflow-hidden" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <p className="relative text-xl sm:text-4xl font-black" style={{ color: stat.color }}>{stat.value}</p>
              <p className="relative text-[9px] sm:text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who We Are ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 pb-14 sm:pb-20">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-4xl font-black text-white">Who We Are</h2>
          <div className="w-10 sm:w-12 h-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 mx-auto mt-3 sm:mt-4" />
        </div>

        <div className="relative rounded-2xl sm:rounded-3xl p-5 sm:p-10 overflow-hidden" style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div className="space-y-5 text-gray-400 text-sm sm:text-base leading-relaxed max-w-3xl mx-auto">
            <p>
              Starting in 2025 as a solo project born out of real frustration, ShelterLab was created to solve
              a simple problem as international and exchange students in Korea had no trusted place to buy and sell
              everyday essentials within their campus community.
            </p>
            <p>
              From secondhand textbooks to dorm furniture, electronics to fashion, our platform connects
              verified university students so every transaction happens between people you can trust.
              We don&apos;t process payments or take fees. We simply provide the space for students to find each other.
            </p>
            <p>
              Every feature on ShelterLab is designed with campus life in mind: optional university email verification
              for a trusted badge, on-campus meetup spots, the LabCred trust system that rewards honest traders,
              and peer reviews that build real reputation over time.
            </p>
            <p className="text-gray-500 italic">
               <span className="text-gray-300 font-semibold not-italic">Shelter</span> — a safe space for campus commerce.{' '}
              <span className="text-gray-300 font-semibold not-italic">Lab</span> — because we&apos;re always experimenting, listening to feedback, and improving.
              This is a platform built by a student, for students.
            </p>
          </div>
        </div>
      </section>

      {/* ── Our Logo ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 pb-14 sm:pb-20">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-xs sm:text-sm font-bold tracking-widest uppercase mb-2 sm:mb-3" style={{ color: '#f15a24' }}>The Brand</p>
          <h2 className="text-2xl sm:text-4xl font-black text-white">Our Logo</h2>
        </div>

        <div className="relative rounded-2xl sm:rounded-3xl p-5 sm:p-10 overflow-hidden" style={{
          background: 'rgba(255,194,42,0.03)',
          border: '1px solid rgba(255,194,42,0.1)',
        }}>
          {/* Warm glow behind logo */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-56 h-56 pointer-events-none" style={{
            background: 'radial-gradient(ellipse, rgba(241,90,36,0.1), rgba(255,194,42,0.06) 50%, transparent 70%)',
            filter: 'blur(50px)',
          }} />

          {/* Logo display */}
          <div className="relative flex justify-center mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden" style={{
              boxShadow: '0 8px 32px rgba(241,90,36,0.2), 0 0 0 1px rgba(255,194,42,0.15)',
            }}>
              <Image src="/logo.svg" alt="ShelterLab Logo" width={128} height={128} className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Brand story */}
          <div className="relative space-y-4 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto text-center">
            <p style={{ color: 'rgba(255,194,42,0.55)' }}>
              The ShelterLab mark is built from interlocking geometric shapes with each piece different in color and form,
              yet fitting together to create something whole. It represents our community which is a diversity of students from different
              backgrounds and universities, coming together on one trusted platform.
            </p>
            <p style={{ color: 'rgba(255,194,42,0.55)' }}>
              The warm tones — golden yellow, burnt orange, and amber reflect the warmth of campus life and human connection.
              The darker anchoring shapes represent stability and trust. And the white space in between represent
              the platform that connects it all.
            </p>
            <p className="italic" style={{ color: 'rgba(199,75,30,0.5)' }}>
              Set on a bold golden background, the fox logo is designed to stand out and feel approachable — just like ShelterLab itself.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 pb-14 sm:pb-20">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-cyan-400 text-xs sm:text-sm font-bold tracking-widest uppercase mb-2 sm:mb-3">Simple & Free</p>
          <h2 className="text-2xl sm:text-4xl font-black text-white">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
          {[
            { step: '01', title: 'Sign Up', desc: 'Create an account with any email, then verify your university email to earn a trusted badge.', color: '#14b8a6' },
            { step: '02', title: 'List or Browse', desc: 'Post items you want to sell or browse what fellow students are offering.', color: '#06b6d4' },
            { step: '03', title: 'Meet & Trade', desc: 'Connect via KakaoTalk, meet on campus, and complete the trade in person.', color: '#34d399' },
          ].map((item) => (
            <div key={item.step} className="relative rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-center overflow-hidden" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-10 pointer-events-none" style={{
                background: `radial-gradient(ellipse, ${item.color}20, transparent)`,
              }} />
              <p className="relative text-3xl font-black mb-3" style={{ color: item.color }}>{item.step}</p>
              <h3 className="relative font-black text-white text-base mb-2">{item.title}</h3>
              <p className="relative text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Core Values ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 pb-14 sm:pb-20">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-teal-400 text-xs sm:text-sm font-bold tracking-widest uppercase mb-2 sm:mb-3">Our Principles</p>
          <h2 className="text-2xl sm:text-4xl font-black text-white">What We Stand For</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-5">
          {[
            {
              title: 'Trust First',
              desc: 'Our LabCred system rewards honest, active community members with trust scores that grow over time.',
              color: '#14b8a6',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              ),
            },
            {
              title: 'Safety Always',
              desc: 'Campus-only meetups, peer reviews, and fraud prevention keep every transaction safe.',
              color: '#34d399',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ),
            },
            {
              title: 'Community Driven',
              desc: 'University-exclusive access means you\'re always dealing with verified fellow students.',
              color: '#06b6d4',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              ),
            },
            {
              title: 'Privacy Focused',
              desc: 'Minimal data collection and full PIPA compliance. Your information stays yours.',
              color: '#a78bfa',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.5 6.5m3.378 3.378l4.242 4.242M6.5 6.5L3 3m3.5 3.5l4.378 4.378M17.5 17.5L21 21m-3.5-3.5l-4.378-4.378" />
              ),
            },
          ].map((v) => (
            <div key={v.title} className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 overflow-hidden group transition-all duration-300 hover:scale-[1.02]" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              {/* Corner glow on hover */}
              <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                background: `radial-gradient(ellipse at top right, ${v.color}15, transparent 70%)`,
              }} />
              <div className="relative">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4" style={{
                  background: `${v.color}15`,
                  border: `1px solid ${v.color}25`,
                }}>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke={v.color} viewBox="0 0 24 24">
                    {v.icon}
                  </svg>
                </div>
                <h3 className="font-black text-white text-sm sm:text-base mb-1 sm:mb-2">{v.title}</h3>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 pb-14 sm:pb-20">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-emerald-400 text-xs sm:text-sm font-bold tracking-widest uppercase mb-2 sm:mb-3">Common Questions</p>
          <h2 className="text-2xl sm:text-4xl font-black text-white">FAQ</h2>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {[
            { q: 'Is ShelterLab free?', a: 'Yes — 100% free. We don\'t charge listing fees, transaction fees, or subscriptions. ShelterLab is built for students, not profit.' },
            { q: 'Do I need a university email to sign up?', a: 'No — you can create an account with any email address. Verifying your university email is optional and earns you a trusted badge on your profile.' },
            { q: 'Is ShelterLab a payment platform?', a: 'No — we connect buyers and sellers. All payments happen directly between students when you meet in person. We never handle money.' },
          ].map((item) => (
            <div key={item.q} className="rounded-xl sm:rounded-2xl p-4 sm:p-5" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <h3 className="font-bold text-white text-sm mb-2">{item.q}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Supported Universities ────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 pb-14 sm:pb-20">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-cyan-400 text-xs sm:text-sm font-bold tracking-widest uppercase mb-2 sm:mb-3">Network</p>
          <h2 className="text-2xl sm:text-4xl font-black text-white">9 Universities & Growing</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {[
            'Korea University',
            'Yonsei University',
            'Hanyang University',
            'Sungkyunkwan University',
            'Kyung Hee University',
            'Ewha Womans University',
            'Sejong University',
            'Konkuk University',
            'Seoultech',
          ].map((uni, i) => (
            <div key={uni} className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 hover:scale-[1.02]" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 text-[10px] sm:text-xs font-black" style={{
                background: `rgba(20,184,166,${0.08 + i * 0.02})`,
                color: '#14b8a6',
                border: '1px solid rgba(20,184,166,0.15)',
              }}>
                {i + 1}
              </div>
              <span className="text-gray-300 text-xs sm:text-sm font-medium">{uni}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <div className="relative text-center py-10 sm:py-16 px-5 sm:px-8 rounded-2xl sm:rounded-3xl overflow-hidden" style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Center glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-60 sm:w-80 h-32 sm:h-40 pointer-events-none" style={{
            background: 'radial-gradient(ellipse, rgba(20,184,166,0.1), transparent 70%)',
            filter: 'blur(40px)',
          }} />
          <h2 className="relative text-2xl sm:text-4xl font-black text-white mb-2 sm:mb-3">Don&apos;t overpay. Don&apos;t overthink it.</h2>
          <p className="relative text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8 max-w-lg mx-auto">Thousands of students are already trading on campus. Textbooks, tech, furniture — it&apos;s all here, and it&apos;s all free.</p>
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-black font-black rounded-xl sm:rounded-2xl px-6 sm:px-8 py-3 sm:py-4 text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/25"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #5eead4)' }}
            >
              Jump In
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/contact" className="text-gray-500 hover:text-teal-400 text-xs sm:text-sm font-semibold transition-colors py-2 sm:py-3 px-4">
              Questions? Talk to us
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer credit ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 pb-10 pt-2">
        <div className="flex items-center justify-center gap-3 text-xs text-gray-600">
          <span>Made by</span>
          <a href="https://github.com/keirara04" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white font-semibold transition-colors">keira</a>
          <span className="text-gray-700">|</span>
          <a href="mailto:admin@shelterlab.shop" className="text-gray-500 hover:text-white transition-colors">admin@shelterlab.shop</a>
        </div>
      </div>
    </div>
  )
}
