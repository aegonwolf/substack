import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
    try {
        // First, load the index to get metadata about the files
        const indexResponse = await fetch('/jsons/topics_meta/index.json');
        const indexData = await indexResponse.json();

        // Load all the actual meta data files we created
        const metaData: Record<string, any> = {};

        // List of all the files we actually created
        const knownFiles = [
            'basic_statistics',
            'topics_has_images',
            'topics_has_number',
            'topics_has_question',
            'topics_has_exclamation',
            'topics_has_lists',
            'topics_is_weekend',
            'topics_is_morning',
            'topics_is_evening',
            'temporal_hourly',
            'temporal_daily',
            'temporal_monthly',
            'temporal_yearly',
            'viral_posts_analysis',
            'correlation_analysis',
            'content_length_analysis',
            'publication_performance',
            'combination_has_images_has_question',
            'combination_has_images_has_lists',
            'combination_has_number_has_question',
            'combination_is_weekend_has_images'
        ];

        // Load each file
        for (const fileName of knownFiles) {
            try {
                const response = await fetch(`/jsons/topics_meta/${fileName}.json`);
                if (response.ok) {
                    metaData[fileName] = await response.json();
                }
            } catch (fileError) {
                console.error(`Error loading ${fileName}.json:`, fileError);
            }
        }

        return {
            metaData,
            indexData,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error loading meta data:', error);
        return {
            metaData: {},
            indexData: null,
            error: 'Failed to load meta data files'
        };
    }
};