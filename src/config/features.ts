/**
 * Application-wide Feature Flags
 * 
 * Toggle features on or off cleanly across the entire platform
 * (both Storefront and Admin Command Center).
 */

export const FEATURES = {
  /**
   * Group Buy Campaigns
   * Set to `true` to re-enable Group Buying across the storefront and admin panel.
   * Set to `false` to put the feature on hold.
   */
  ENABLE_GROUP_BUY: false,
} as const;
