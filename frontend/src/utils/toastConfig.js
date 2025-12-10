import toast from 'react-hot-toast';

// Professional Toast Configuration
export const toastConfig = {
  success: (message) => {
    return toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white rounded-xl shadow-xl border border-green-200 overflow-hidden`}
      >
        <div className="flex">
          {/* Left accent bar */}
          <div className="w-1.5 bg-gradient-to-b from-green-400 to-green-600" />
          
          {/* Content */}
          <div className="flex-1 p-4 flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            {/* Text */}
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{message}</p>
            </div>
            
            {/* Close button */}
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    ), { duration: 4000 });
  },

  error: (message) => {
    return toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white rounded-xl shadow-xl border border-red-200 overflow-hidden`}
      >
        <div className="flex">
          {/* Left accent bar */}
          <div className="w-1.5 bg-gradient-to-b from-red-400 to-red-600" />
          
          {/* Content */}
          <div className="flex-1 p-4 flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            {/* Text */}
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{message}</p>
            </div>
            
            {/* Close button */}
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    ), { duration: 4000 });
  },

  warning: (message) => {
    return toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white rounded-xl shadow-xl border border-yellow-200 overflow-hidden`}
      >
        <div className="flex">
          {/* Left accent bar */}
          <div className="w-1.5 bg-gradient-to-b from-yellow-400 to-yellow-600" />
          
          {/* Content */}
          <div className="flex-1 p-4 flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            {/* Text */}
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{message}</p>
            </div>
            
            {/* Close button */}
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    ), { duration: 4000 });
  },

  info: (message) => {
    return toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white rounded-xl shadow-xl border border-blue-200 overflow-hidden`}
      >
        <div className="flex">
          {/* Left accent bar */}
          <div className="w-1.5 bg-gradient-to-b from-blue-400 to-blue-600" />
          
          {/* Content */}
          <div className="flex-1 p-4 flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            {/* Text */}
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{message}</p>
            </div>
            
            {/* Close button */}
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    ), { duration: 4000 });
  }
};
