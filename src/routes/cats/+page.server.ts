import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface CategoryData {
	category: string;
	mean_subscriber_count: number;
	stddev_subscriber_count: number;
	min_subscriber_count: number;
	max_subscriber_count: number;
	median_subscriber_count: number;
	outgoing: number;
	incoming: number;
}


function loadCategoryData(): CategoryData[] {
	try {
		const filePath = join(process.cwd(), 'static/jsons/categories.json');
		const rawData = readFileSync(filePath, 'utf-8');
		const jsonData = JSON.parse(rawData);
		
		if (!Array.isArray(jsonData)) {
			throw new Error('Invalid data format: expected array');
		}
		
		return jsonData.map((item: any) => ({
			category: item.category,
			mean_subscriber_count: item.mean_subscriber_count,
			stddev_subscriber_count: item.stddev_subscriber_count,
			min_subscriber_count: item.min_subscriber_count,
			max_subscriber_count: item.max_subscriber_count,
			median_subscriber_count: item.median_subscriber_count,
			outgoing: item.outgoing,
			incoming: item.incoming
		}));
	} catch (err) {
		console.log('Error loading category data:', err);
		throw err;
	}
}

export const load: PageServerLoad = async () => {
	try {
		const categories = loadCategoryData();
		
		// Calculate some basic statistics
		const totalCategories = categories.length;
		const totalOutgoing = categories.reduce((sum, cat) => sum + cat.outgoing, 0);
		const totalIncoming = categories.reduce((sum, cat) => sum + cat.incoming, 0);
		
		return {
			categories,
			stats: {
				totalCategories,
				totalOutgoing, 
				totalIncoming,
				validCount: categories.length
			}
		};
	} catch (err) {
		console.log('Failed to load category data:', err);
		throw error(500, 'Failed to load category data');
	}
};