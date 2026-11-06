import { Column } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'

interface SortableHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  label: string
}

export function SortableHeader<TData, TValue>({ column, label }: SortableHeaderProps<TData, TValue>) {
  return (
    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}