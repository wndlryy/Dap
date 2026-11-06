import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SortableHeader } from '@/components/sortable-header'

export interface Item {
  id: number
  category_id: number
  name: string
  unit: string
  unit_price: string
  average_cost: string | null
  current_stock: number
  reorder_level: number
  category?: {
    id: number
    name: string
  }
}

interface ColumnActions {
  onEdit: (item: Item) => void
  onDeleteRequest: (item: Item) => void
}

function formatPHP(value: string | null | undefined) {
  const num = parseFloat(value ?? '')
  if (Number.isNaN(num)) return '—'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(num)
}

export function getColumns({ onEdit, onDeleteRequest }: ColumnActions): ColumnDef<Item>[] {
  return [
    {
      id: 'index',
      header: 'No.',
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} label="Name" />,
    },
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => row.original.category?.name ?? '—',
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
    },
    {
      accessorKey: 'average_cost',
      header: ({ column }) => (
        <div className="text-right">
          <SortableHeader column={column} label="Avg. Cost" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {formatPHP(row.original.average_cost ?? row.original.unit_price)}
        </div>
      ),
    },
    {
      accessorKey: 'current_stock',
      header: ({ column }) => (
        <div className="text-right">
          <SortableHeader column={column} label="Stock" />
        </div>
      ),
      cell: ({ row }) => {
        const { current_stock, reorder_level } = row.original
        const isLow = current_stock <= reorder_level

        return (
          <div className="flex items-center justify-end gap-2">
            <span>{current_stock}</span>
            {isLow && (
              <Badge variant="destructive" className="text-xs">
                Low
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'reorder_level',
      header: () => <div className="text-right">Reorder Level</div>,
      cell: ({ row }) => <div className="text-right">{row.original.reorder_level}</div>,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(item)}>Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => onDeleteRequest(item)}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}