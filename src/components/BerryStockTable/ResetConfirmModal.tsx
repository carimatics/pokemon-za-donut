import { useRef, useId, type RefObject } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface ResetConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  returnFocusRef?: RefObject<HTMLElement | null>
}

export function ResetConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  returnFocusRef,
}: ResetConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Focus trap for modal
  useFocusTrap(modalRef, {
    enabled: isOpen,
    onEscape: onClose,
    returnFocusRef,
  })

  if (!isOpen) return null

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Modal backdrop click is intentional
    // biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop interaction
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal dialog with stopPropagation - keyboard handled by focus trap */}
      <div
        ref={modalRef}
        className="bg-white rounded-lg p-6 max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h3 id={titleId} className="text-lg font-semibold mb-4">
          確認
        </h3>
        <p className="text-gray-700 mb-6">
          すべてのきのみ個数を0にリセットします。この操作は取り消せません。よろしいですか？
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            リセット
          </button>
        </div>
      </div>
    </div>
  )
}
