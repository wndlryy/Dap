export function menuImageUrl(path: string | null | undefined) {
    if (!path) return null;
    return /^(https?:)?\/\//.test(path) || path.startsWith("/") ? path : `/storage/${path}`;
}