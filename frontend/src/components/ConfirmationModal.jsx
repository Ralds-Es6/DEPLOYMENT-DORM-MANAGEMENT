import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'warning', // 'warning', 'danger', 'success'
  icon: CustomIcon = null
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonClass: 'bg-gradient-to-r from-red-500 to-red-600'
        };
      case 'success':
        return {
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          buttonClass: 'bg-gradient-to-r from-green-500 to-green-600'
        };
      case 'warning':
      default:
        return {
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          buttonClass: 'bg-gradient-to-r from-amber-500 to-amber-600'
        };
    }
  };

  const styles = getVariantStyles();
  const IconComponent = CustomIcon || (variant === 'danger' ? ExclamationTriangleIcon : CheckCircleIcon);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in">
        <div className={`flex items-center justify-center w-12 h-12 ${styles.iconBg} rounded-full mx-auto mb-4`}>
          <IconComponent className={`w-6 h-6 ${styles.iconColor}`} />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {title}
        </h2>

        <p className="text-gray-600 text-center mb-6">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 ${styles.buttonClass} text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
