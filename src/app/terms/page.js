'use client'

import Link from 'next/link'

export default function TermsPage() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: 'url(/background.png)',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        backgroundBlendMode: 'overlay',
      }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-bold mb-8 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Terms of Use</h1>
          <p className="text-gray-400 text-base">Effective Date: February 13, 2026</p>
        </div>

        <div className="space-y-6">
          {/* 1. Purpose and Scope */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white font-black text-sm bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">1</span>
              <h2 className="text-xl font-black text-white">Purpose and Scope</h2>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              These terms govern the use of the ShelterLab web platform. By verifying your email and accessing the marketplace, you agree to these terms. ShelterLab is a service exclusively for verified users.
            </p>
          </div>

          {/* 2. Non-Party Status */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white font-black text-sm bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">2</span>
              <h2 className="text-xl font-black text-white">Notice of Non-Party Status</h2>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
              <p className="text-yellow-300 text-sm font-bold">ShelterLab is an Online Platform Intermediary.</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-gray-500 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm">We are not the seller or the buyer.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-500 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm">We do not own, inspect, or store the items listed.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-500 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm">The contract of sale is strictly between the two users.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-500 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm">ShelterLab is not responsible for any defects, payment issues, or failed meetups.</span>
              </li>
            </ul>
          </div>

          {/* 3. User Verification & Responsibility */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white font-black text-sm bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">3</span>
              <h2 className="text-xl font-black text-white">User Verification & Responsibility</h2>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-gray-500 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">One Person, One Account:</strong> You must use your own verified email. Lending your account to outsiders is a violation of service.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-500 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Duty of Care:</strong> Users are responsible for maintaining the security of their login credentials.</span>
              </li>
            </ul>
          </div>

          {/* 4. Prohibited Items */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white font-black text-sm bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">4</span>
              <h2 className="text-xl font-black text-white">Prohibited Items</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">In accordance with Korean Law, the following cannot be traded on ShelterLab:</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Medical/Health:</strong> Unsealed functional health foods (vitamins), prescription drugs, or medical devices.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Fakes:</strong> Counterfeit goods (Trademark Act).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Restricted:</strong> Alcohol, tobacco, home-made food (without a license), and used underwear/cosmetics.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Digital:</strong> Unauthorized gift certificates or game accounts.</span>
              </li>
            </ul>
          </div>

          {/* 5. Safe Transaction Guidelines */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white font-black text-sm bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">5</span>
              <h2 className="text-xl font-black text-white">Safe Transaction Guidelines</h2>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">On-Campus Only:</strong> We strongly recommend all trades happen in public campus areas during daylight hours.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Inspection First:</strong> Buyers must inspect the item physically before transferring any funds.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Payment:</strong> ShelterLab does not facilitate payments. Use cash or bank transfer only after the physical meeting.</span>
              </li>
            </ul>
          </div>

          {/* 6. Dispute Resolution & Penalties */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white font-black text-sm bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">6</span>
              <h2 className="text-xl font-black text-white">Dispute Resolution & Penalties</h2>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Reporting:</strong> If a scam is reported, ShelterLab will investigate. If fraud is confirmed, the user&apos;s account will be permanently blacklisted.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Legal Cooperation:</strong> In the event of a criminal investigation, ShelterLab will cooperate with the South Korean Police and provide necessary logs as per our Privacy Policy.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
