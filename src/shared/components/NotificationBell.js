'use client'

export default function NotificationBell({
  size = 'md',
  showNotificationPanel,
  hasUnreadNotification,
  notification,
  onToggle,
}) {
  const isLg = size === 'lg'
  const btnSize = isLg ? 'w-10 h-10' : 'w-9 h-9'
  const imgSize = isLg ? 'w-5 h-5' : 'w-4 h-4'
  const dotPos = isLg ? 'top-2 right-2 w-2 h-2' : 'top-1.5 right-1.5 w-1.5 h-1.5'
  const panelWidth = isLg ? 'w-72 sm:w-80' : 'w-72'

  return (
    <div className="relative">
      <button
        data-notification-bell
        aria-label="Open notifications"
        aria-expanded={showNotificationPanel}
        onClick={onToggle}
        className={`relative flex items-center justify-center ${btnSize} rounded-full transition-all duration-200`}
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: showNotificationPanel
            ? '0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.12)'
            : 'none',
        }}
      >
        <img src="/bell.svg" alt="" aria-hidden="true" className={imgSize} />
        {hasUnreadNotification && (
          <div className={`absolute ${dotPos} bg-blue-500 rounded-full animate-pulse`} />
        )}
      </button>

      <div className={`absolute top-full right-0 mt-2 ${panelWidth} z-50`} style={{ contain: 'layout style paint' }}>
        {showNotificationPanel && notification && (
          <div
            data-notification-panel
            className="rounded-2xl overflow-hidden p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <img src="/bell.svg" alt="" aria-hidden="true" className="w-6 h-6 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white mb-1 truncate">
                  {notification.title || 'Updates Available'}
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed break-words">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
