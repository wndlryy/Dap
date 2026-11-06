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

export interface User {
  id: number
  name: string
  username: string
  role: 'admin' | 'user' | 'waiter' | 'cashier' | 'kitchen-staff'
}

interface ColumnActions {
  onEdit: (user: User) => void
  onDeleteRequest: (user: User) => void
}

const roleLabels: Record<User['role'], string> = {
  admin: 'Admin',
  user: 'User',
  waiter: 'Waiter',
  cashier: 'Cashier',
  'kitchen-staff': 'Kitchen Staff',
}

const roleVariants: Record<User['role'], 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  user: 'secondary',
  waiter: 'outline',
  cashier: 'outline',
  'kitchen-staff': 'outline',
}

export function getColumns({ onEdit, onDeleteRequest }: ColumnActions): ColumnDef<User>[] {
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
      accessorKey: 'username',
      header: ({ column }) => <SortableHeader column={column} label="Username" />,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant={roleVariants[row.original.role]}>
          {roleLabels[row.original.role]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const user = row.original
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
                <DropdownMenuItem onClick={() => onEdit(user)}>Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => onDeleteRequest(user)}>
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