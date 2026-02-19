'use client'

import Link from 'next/link'
import LogoHome from '@/shared/components/LogoHome'

export default function PrivacyPage() {
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
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Privacy Policy</h1>
          <p className="text-gray-400 text-base">How we handle and protect your data at ShelterLab.</p>
        </div>

        <div className="space-y-6">
          {/* 1. Items of Personal Information Collected */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white font-black text-sm bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">1</span>
              <h2 className="text-xl font-black text-white">Items of Personal Information Collected</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">We collect the minimum information necessary to provide a safe campus marketplace:</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Mandatory:</strong> Email Address, Full Name, Nickname.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Optional:</strong> Profile Picture, KakaoTalk/Telegram ID (for 1:1 trading), Major.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Automatically Collected:</strong> IP Address, Device ID, Access Logs, Cookies (for session management).</span>
              </li>
            </ul>
          </div>

          {/* 2. Purpose of Collection and Use */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white font-black text-sm bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">2</span>
              <h2 className="text-xl font-black text-white">Purpose of Collection and Use</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">We use your information strictly for the following:</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Verification:</strong> Confirming you are a registered and verified user.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Safety:</strong> Preventing fraudulent accounts and multi-account abuse.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Communication:</strong> Sending important service updates and verifying trades.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Dispute Resolution:</strong> Identifying users in case of reported scams or policy violations.</span>
              </li>
            </ul>
          </div>

          {/* 3. Retention and Destruction of Information */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white font-black text-sm bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">3</span>
              <h2 className="text-xl font-black text-white">Retention and Destruction of Information</h2>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Retention Period:</strong> We keep your data only as long as your account is active.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Automatic Deletion:</strong> If you delete your account, your data is wiped from our servers within 24 hours.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Legal Exception:</strong> If required by the Act on the Protection of Consumers in Electronic Commerce, transaction records may be kept for 5 years, and login history for 3 months as per the Protection of Communications Secrets Act.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Destruction Method:</strong> Electronic files are permanently deleted using technical methods that prevent recovery.</span>
              </li>
            </ul>
          </div>

          {/* 4. Third-Party Data Sharing */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white font-black text-sm bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">4</span>
              <h2 className="text-xl font-black text-white">Third-Party Data Sharing</h2>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
              <p className="text-green-300 text-sm font-bold">ShelterLab does not sell your personal data.</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm">We only provide your nickname and verified badge to other users during the listing process to facilitate trade.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm">We may disclose data if required by a legal warrant from the South Korean police or court order.</span>
              </li>
            </ul>
          </div>

          {/* 5. Rights of the Data Subject */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white font-black text-sm bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">5</span>
              <h2 className="text-xl font-black text-white">Rights of the Data Subject (Your Rights)</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">Under PIPA, you have the right to:</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm">Request access to your personal information.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm">Request correction of inaccurate data.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm">Request the suspension of processing or account deletion.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Right to be Forgotten:</strong> You can exercise these rights via your Profile settings or by emailing our CPO.</span>
              </li>
            </ul>
          </div>

          {/* 6. Technical and Administrative Security Measures */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white font-black text-sm bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">6</span>
              <h2 className="text-xl font-black text-white">Technical and Administrative Security Measures</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">To keep your data safe, we implement:</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Encryption:</strong> All passwords and sensitive identifiers are hashed/encrypted at rest.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Access Control:</strong> Only the lead developer (Admin) has access to the user database.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-300 text-sm"><strong className="text-white">Security Monitoring:</strong> Regular log audits to check for unauthorized access.</span>
              </li>
            </ul>
          </div>

          {/* 7. Chief Privacy Officer (CPO) */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white font-black text-sm bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">7</span>
              <h2 className="text-xl font-black text-white">Chief Privacy Officer (CPO)</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">In accordance with Article 31 of PIPA, we have appointed a CPO to handle privacy inquiries and complaints.</p>
            <div className="bg-white/5 rounded-xl p-4 space-y-2">
              <p className="text-gray-300 text-sm"><strong className="text-white">Role:</strong> Lead Developer & CPO</p>
              <p className="text-gray-300 text-sm"><strong className="text-white">Email:</strong> admin@shelterlab.shop</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
