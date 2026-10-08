export const DEFAULT_DELIVERY_PLATFORMS = ["抖音", "拼夕夕", "淘宝", "京东", "小红书", "快手", "咸鱼", "其他"];

export function normalizeDeliveryPlatforms(platforms: unknown): string[] {
  if (!Array.isArray(platforms)) return DEFAULT_DELIVERY_PLATFORMS;
  return platforms
    .filter((platform): platform is string => typeof platform === "string")
    .map((platform) => platform.trim())
    .filter((platform, index, list) => platform && list.indexOf(platform) === index);
}
