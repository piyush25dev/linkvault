export type Bookmark = { id: string; title: string; url: string; domain: string; description: string; favicon: string; image?: string | null; collectionId: string; isFavorite: boolean; isDeleted: boolean; createdAt?: unknown };
export type Collection = { id: string; name: string; description?: string; createdAt?: unknown };
