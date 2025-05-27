
const config = {
    api: {
        baseUrl: process.env.NEXT_PUBLIC_RICK_MORTY_API_URL || 'https://rickandmortyapi.com/api',
        timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'),
        cacheRevalidate: parseInt(process.env.NEXT_PUBLIC_CACHE_REVALIDATE || '3600'),
    },
    app: {
        name: 'Rick and Morty Feed',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    }
};

export default config;