import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Starting data precomputation...');

// Read the source JSON files
const subscriberData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../static/jsons/subscriber_counts.json'), 'utf-8')
);

const recommendationData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../static/jsons/recommendation_counts.json'), 'utf-8')
);

// Create recommendation map
const recommendationMap = {};
recommendationData.forEach(item => {
  if (item.publication_url) {
    recommendationMap[item.publication_url] = {
      incoming: item.incoming_recommendations || 0,
      outgoing: item.outgoing_recommendations || 0,
      total: item.total_recommendations || 0
    };
  }
});

// Merge all data together
const mergedPublications = subscriberData.map(pub => {
  const recCounts = recommendationMap[pub.publication_url] || {
    incoming: 0,
    outgoing: 0,
    total: 0
  };
  
  return {
    ...pub,
    recommendation_count: recCounts.outgoing,
    incoming_recommendations: recCounts.incoming,
    outgoing_recommendations: recCounts.outgoing,
    total_recommendations: recCounts.total
  };
});

// Calculate stats
const categories = [...new Set(mergedPublications.map(p => p.category))].sort();
const boardTypes = [...new Set(mergedPublications.map(p => p.board))].filter(Boolean).sort();

// Create the final merged data
const finalData = {
  publications: mergedPublications,
  stats: {
    total: mergedPublications.length,
    validCount: mergedPublications.length,
    invalidCount: 0,
    categories,
    boardTypes
  }
};

// Write the precomputed file
fs.writeFileSync(
  path.join(__dirname, '../static/jsons/publications_merged.json'),
  JSON.stringify(finalData),
  'utf-8'
);

console.log(`✅ Precomputed data for ${mergedPublications.length} publications`);
console.log(`   Categories: ${categories.length}`);
console.log(`   Board types: ${boardTypes.length}`);
console.log(`   File size: ${(JSON.stringify(finalData).length / 1024 / 1024).toFixed(2)} MB`);