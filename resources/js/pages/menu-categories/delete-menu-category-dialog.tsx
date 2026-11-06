import { useState } from 'react'
import { router } from '@inertiajs/react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { MenuCategory } from './menu-category-form-dialog'

interface DeleteMenuCategoryDialogProps {
  target: MenuCategory | null
  onOpenChange: (open: boolean) => void
}

const CONFIRM_WORD = 'CONFIRM'

export function DeleteMenuCategoryDialog({ target, onOpenChange }: DeleteMenuCategoryDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const isMatch = confirmText.trim() === CONFIRM_WORD

  function handleOpenChange(v: boolean) {
    onOpenChange(v)
    if (!v) {
      setConfirmText('')
    }
  }

  function confirmDelete() {
    if (!target || !isMatch) return
    setDeleting(true)

    router.delete(`/menu-categories/${target.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Menu category deleted successfully.')
        handleOpenChange(false)
      },
      onError: () => {
        toast.error('Failed to delete menu category.')
      },
      onFinish: () => {
        setDeleting(false)
      },
    })
  }

  return (
    <AlertDialog open={!!target} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        deferPointerDownOutside
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Delete menu category?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{' '}
            <span className="font-medium">{target?.name}</span>. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="confirm-word">
            Type <span className="font-medium">{CONFIRM_WORD}</span> to confirm
          </Label>
          <Input
            id="confirm-word"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoFocus
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              confirmDelete()
            }}
            disabled={deleting || !isMatch}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}