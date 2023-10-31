// This used to be a place for GDPS settings but that has all been moved over to servers.json
// Feel free to enable/disable stuff here for smoother local use, free of rate limits

export default {
    /**
     * Port to host website on.
     */
    port: 2000,

    /**
     * Always send this stuff to the servers.
     */
    params: {
        secret: 'Wmfd2893gb7',
        gameVersion: '21',
        binaryVersion: '35',
        gdbrowser: '1'
    },

    /**
     * Enables rate limiting to avoid api spam, feel free to disable for private use.
     */
    rateLimiting: true,

    /**
     * Forwards 'x-real-ip' to the servers. (requested by robtop)
     */
    ipForwarding: true,

    /**
     * Caches map packs to speed up loading. Useful if they're rarely updated.
     */
    cacheMapPacks: true,

    /**
     * Caches gauntlets to speed up loading. Useful if they're rarely updated.
     */
    cacheGauntlets: true,

    /**
     * Caches account IDs in order to shave off an extra request to the servers.
     */
    cacheAccountIDs: true,

    /**
     * Caches player icons to speed up loading. Changing your icon in-game may take time to update on the site.
     */
    cachePlayerIcons: true,
}