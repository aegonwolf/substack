import type { PageServerLoad } from './$types';

async function tryFetchJson(fetch: any, paths: string[]): Promise<any | null> {
    for (const p of paths) {
        try {
            const res = await fetch(p);
            if (res.ok) return await res.json();
        } catch {
            // continue to next path
        }
    }
    return null;
}

export const load: PageServerLoad = async ({ fetch }) => {
    // Load the lightweight index built by scripts/build_topic_explorer_json.py
    const index = await tryFetchJson(fetch, [
        '/jsons/topic_explorer/index.json',
        '/jsons/topic_explorer/summary.json',
        '/topic_explorer_index.json'
    ]);

    if (!index) {
        return {
            error: 'Unable to load topic explorer index (jsons/topic_explorer/index.json)',
            timestamp: new Date().toISOString()
        };
    }

    return {
        index,
        timestamp: new Date().toISOString()
    };
};
