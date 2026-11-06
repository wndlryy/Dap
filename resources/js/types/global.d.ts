import type { SharedPageProps } from "./index"

declare module "@inertiajs/core" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- intentional declaration merging to augment Inertia's PageProps
  interface PageProps extends SharedPageProps {}
}