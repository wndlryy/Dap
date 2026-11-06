export {}

declare global {
  function route(
    name?: string,
    params?: string | number | Record<string, string | number> | undefined,
    absolute?: boolean
  ): string
}