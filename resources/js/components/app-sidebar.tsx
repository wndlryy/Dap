import { usePage } from "@inertiajs/react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { NavHeader } from "@/components/nav-header"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { navFor } from "@/components/nav-items"

export function AppSidebar() {
  const { auth } = usePage().props

  return (
    <Sidebar>
      <SidebarHeader>
        <NavHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navFor(auth.user?.role)} />
      </SidebarContent>
      <SidebarFooter>
        {auth.user && <NavUser user={auth.user} />}
      </SidebarFooter>
    </Sidebar>
  )
}