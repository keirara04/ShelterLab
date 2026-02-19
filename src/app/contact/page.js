'use client'

import Link from 'next/link'
import LogoHome from '@/shared/components/LogoHome'

export default function ContactPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#000000',
      }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="mb-8">
          <LogoHome />
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Get in Touch</h1>
          <p className="text-gray-400 text-base">We usually respond within 24 hours.</p>
        </div>

        {/* Contact Cards */}
        <div className="space-y-6">
          {/* Safety & Fraud */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-white">Safety & Fraud</h2>
            </div>
            <p className="text-gray-400 text-sm mb-5">Did a transaction go wrong? Report a scammer or a dangerous meeting immediately.</p>
            <a
              href="https://open.kakao.com/o/svvurofi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500/20 text-red-300 font-bold text-sm hover:bg-red-500/30 transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3C6.5 3 2 6.58 2 11c0 2.13 1.07 4.04 2.76 5.43L4 21l4.89-2.71c.99.18 2.02.28 3.11.28 5.5 0 10-3.58 10-8s-4.5-8-10-8z" />
              </svg>
              Report via KakaoTalk
            </a>
          </div>

          {/* Technical Issues */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-white">Technical Issues</h2>
            </div>
            <p className="text-gray-400 text-sm mb-5">Found a bug on the web app? Can&apos;t verify your email? Let us know.</p>
            <a
              href="mailto:admin@shelterlab.shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-yellow-500/20 text-yellow-300 font-bold text-sm hover:bg-yellow-500/30 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              admin@shelterlab.shop
            </a>
          </div>

          {/* Suggestions */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-white">Suggestions</h2>
            </div>
            <p className="text-gray-400 text-sm mb-5">Have an idea for a new feature? Want to see ShelterLab at another campus?</p>
            <a
              href="mailto:admin@shelterlab.shop?subject=Feature%20Request"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-sm hover:bg-blue-500/30 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Submit Feature Request
            </a>
          </div>
        </div>

        {/* Dispute Handling Disclaimer */}
        <div className="mt-8 border-t border-white/5 pt-6">
          <p className="text-gray-400 text-xs leading-relaxed">
            <strong className="text-gray-400">Dispute Handling:</strong> ShelterLab will review reports of fraud or misconduct within 3 business days. While we cannot force refunds, we will take action (banning/blacklisting) against users who violate our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  )
}
