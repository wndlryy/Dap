import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export interface TrashedRecord {
  id: number
  name?: string
  username?: string
  deleted_at: string
  [key: string]: unknown
}

interface ColumnActions {
  onRestoreRequest: (record: TrashedRecord) => void
  onDeleteRequest: (record: TrashedRecord) => void
}

export function recordLabel(record: TrashedRecord): string {
  return (record.name as string) ?? (record.username as string) ?? `#${record.id}`
}

export function getColumns({ onRestoreRequest, onDeleteRequest }: ColumnActions): ColumnDef<TrashedRecord>[] {
  return [
    {
      id: 'index',
      header: 'No.',
      cell: ({ row }) => row.index + 1,
    },
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => recordLabel(row.original),
    },
    {
      accessorKey: 'deleted_at',
      header: 'Deleted At',
      cell: ({ row }) => format(new Date(row.original.deleted_at), 'MMM d, yyyy h:mm a'),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const record = row.original
        return (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onRestoreRequest(record)}>
              <RotateCcw className="h-4 w-4" />
              Restore
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDeleteRequest(record)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )
      },
    },
  ]
}