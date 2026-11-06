import { Link, usePage } from "@inertiajs/react"
import { Fragment } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { navFor } from "@/components/nav-items"
import { buildTrail } from "@/lib/breadcrumbs"

export function AppBreadcrumbs() {
  const { url, props } = usePage()

  const user = props.auth.user
  const role = user?.role 
  const trail = buildTrail(navFor(role), url)

  if (trail.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1

          return (
            <Fragment key={`${crumb.title}-${i}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                ) : crumb.url ? (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.url}>{crumb.title}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="text-muted-foreground">{crumb.title}</span>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}