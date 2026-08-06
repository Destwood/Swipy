/** Opens the game's Steam store page in the Steam client when possible. */
export function steamStoreAppUrl(appId: string): string {
  return `steam://store/${appId}`;
}

export function steamStoreWebUrl(appId: string): string {
  return `https://store.steampowered.com/app/${appId}`;
}
