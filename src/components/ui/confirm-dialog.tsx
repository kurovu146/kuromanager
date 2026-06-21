'use client'

import { useState, useTransition, type ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/**
 * Popup xác nhận tái sử dụng — thay cho window.confirm() native.
 * confirm() có thể bị trình duyệt chặn (tick "không hiện hộp thoại nữa") khiến
 * nó trả về false âm thầm → hành động không chạy. Dialog thật không có vấn đề đó.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  variant = 'default',
  onConfirm,
}: {
  trigger: ReactElement
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      await onConfirm()
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={pending} />}>
            {cancelLabel}
          </DialogClose>
          <Button variant={variant} onClick={handleConfirm} disabled={pending}>
            {pending ? 'Đang xử lý…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
