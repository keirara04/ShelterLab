'use client'

import Link from 'next/link'

export default function HelpCenterPage() {
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
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Help Center</h1>
          <p className="text-gray-400 text-base">Find answers to common questions and get support.</p>
        </div>

        {/* 1. Safety Protocols */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-white">Safety Protocols</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">Face-to-face transactions are the gold standard. Follow these rules to stay safe.</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Safe Zones:</strong> Always meet in public, high-traffic university areas (e.g., Central Library, Student Union lobby).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Inspect First:</strong> Inspect the item before transferring money. ShelterLab does not provide refunds once a transaction is finished.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Daylight Rule:</strong> Avoid meetings after dark or in isolated parking lots.</span>
              </li>
            </ul>
          </div>

          {/* 2. Forbidden Items */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-white">Forbidden Items</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">The following items are strictly banned from ShelterLab. Violations may result in a permanent ban.</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Health Products:</strong> Opened vitamins, supplements, or prescription drugs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Vouchers:</strong> Unverified mobile gift cards or cultural vouchers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Counterfeits:</strong> Counterfeit or replica luxury items.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Restricted:</strong> Alcohol, tobacco, and home-made food products.</span>
              </li>
            </ul>
          </div>

          {/* 3. Account Verification */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-white">Account Verification</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">Get your Verified Student badge to build trust with other users.</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">How to Verify:</strong> Go to Profile and verify your email address to earn the Verified badge.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">One Account Rule:</strong> One student, one account. Lending your account to outsiders will result in a permanent ban.</span>
              </li>
            </ul>
          </div>

          {/* 4. Dispute & Reporting */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-white">Dispute & Reporting</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">If something goes wrong, here is what to do.</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Report a Listing:</strong> Click the &quot;Report&quot; icon on the listing. Include the seller&apos;s Kakao ID and a screenshot of the chat.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">What Happens Next:</strong> Our admin team will review the report. If fraud is confirmed, the user&apos;s account will be permanently banned.</span>
              </li>
            </ul>
          </div>

          {/* 5. Contact Hierarchy */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-white">Contact & Support</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">Need help? Reach out through the right channel.</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
                <span className="text-white font-black text-sm bg-purple-500/30 px-2 py-0.5 rounded-full shrink-0">1</span>
                <div>
                  <p className="text-white text-sm font-bold">Self-Serve</p>
                  <p className="text-gray-400 text-sm">Check this Help Center first for answers to common questions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
                <span className="text-white font-black text-sm bg-purple-500/30 px-2 py-0.5 rounded-full shrink-0">2</span>
                <div>
                  <p className="text-white text-sm font-bold">Non-Urgent</p>
                  <p className="text-gray-400 text-sm">Email admin@shelterlab.shop for bug reports or general inquiries.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
                <span className="text-white font-black text-sm bg-purple-500/30 px-2 py-0.5 rounded-full shrink-0">3</span>
                <div>
                  <p className="text-white text-sm font-bold">Urgent</p>
                  <p className="text-gray-400 text-sm">Message the Official Kakao Channel for safety or fraud emergencies.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
