import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Confirm', message = 'Are you sure?', confirmText = 'Confirm', confirmColor = 'bg-red-600 hover:bg-red-700', loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
        <button onClick={onConfirm} disabled={loading}
          className={`px-4 py-2 text-sm text-white rounded-lg ${confirmColor} disabled:opacity-50`}>
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
