#!/usr/bin/env python3
"""
Preprocess category graph data for optimized 3D force graph rendering.
Takes category_recommendations.json and categories.json and outputs
a pre-computed graph structure with positions and visual properties.
"""

import json
import math
from typing import Dict, List, Set
from urllib.parse import urlparse


def add_node_groups(nodes: List[Dict], links: List[Dict]) -> None:
    """
    Add group information to nodes for better force-directed layout.
    """
    # Build adjacency information with weighted connections
    connections = {node['id']: {'in': 0, 'out': 0, 'in_weight': 0, 'out_weight': 0} for node in nodes}
    
    for link in links:
        weight = link.get('value', 1)
        if link['source'] in connections:
            connections[link['source']]['out'] += 1
            connections[link['source']]['out_weight'] += weight
        if link['target'] in connections:
            connections[link['target']]['in'] += 1
            connections[link['target']]['in_weight'] += weight
    
    # Add connection counts and groups to nodes
    for node in nodes:
        node_id = node['id']
        node['inDegree'] = connections[node_id]['in']
        node['outDegree'] = connections[node_id]['out']
        node['inWeight'] = connections[node_id]['in_weight']
        node['outWeight'] = connections[node_id]['out_weight']
        
        # Assign group based on connection patterns
        total_connections = connections[node_id]['in'] + connections[node_id]['out']
        if total_connections > 30:
            node['group'] = 'hub-category'
        elif total_connections > 15:
            node['group'] = 'connector-category'
        elif connections[node_id]['out'] > connections[node_id]['in']:
            node['group'] = 'source-category'
        elif connections[node_id]['in'] > connections[node_id]['out']:
            node['group'] = 'target-category'
        else:
            node['group'] = 'balanced-category'

def main():
    """Main processing function."""
    
    # Load input data
    print("Loading category data files...")
    
    try:
        with open('static/jsons/category_recommendations.json', 'r') as f:
            category_recommendations_data = json.load(f)
    except FileNotFoundError:
        print("Error: category_recommendations.json not found")
        category_recommendations_data = {}
    
    try:
        with open('static/jsons/categories.json', 'r') as f:
            categories_data = json.load(f)
    except FileNotFoundError:
        print("Error: categories.json not found")
        categories_data = []
    
    # Extract category statistics
    category_stats = {}
    for item in categories_data:
        if item.get('category'):
            category = item['category']
            category_stats[category] = {
                'mean_subscribers': item.get('mean_subscriber_count', 0),
                'median_subscribers': item.get('median_subscriber_count', 0),
                'max_subscribers': item.get('max_subscriber_count', 0),
                'outgoing': item.get('outgoing', 0),
                'incoming': item.get('incoming', 0)
            }
    
    print(f"Found {len(category_stats)} categories with statistics")
    
    # Build node list - just categories
    nodes = []
    all_categories = set(category_stats.keys()) | set(category_recommendations_data.keys())
    
    # Also include all categories that are recommended
    for source_cat, recommendations in category_recommendations_data.items():
        if isinstance(recommendations, dict):
            all_categories.update(recommendations.keys())
    
    # Add category nodes
    for category_name in all_categories:
        stats = category_stats.get(category_name, {})
        
        # Calculate size based on median subscriber count
        median_subs = stats.get('median_subscribers', 0)
        if median_subs > 0:
            size = 5 + math.log10(median_subs + 1) * 2
        else:
            size = 8
        size = min(max(size, 5), 30)
        
        # Color based on outgoing connections
        outgoing = stats.get('outgoing', 0)
        if outgoing > 500:
            color = '#ff6b35'  # Orange for highly connected
        elif outgoing > 200:
            color = '#4ecdc4'  # Teal
        elif outgoing > 100:
            color = '#45b7d1'  # Blue
        else:
            color = '#96ceb4'  # Light green
        
        node = {
            'id': f"category_{category_name}",
            'name': category_name.replace('-', ' ').title(),
            'category': 'Category',
            'node_type': 'category',
            'subscriber_count': int(median_subs) if median_subs else 0,
            'outgoing_connections': outgoing,
            'incoming_connections': stats.get('incoming', 0),
            'val': size,
            'color': color,
            'label': f"{category_name.replace('-', ' ').title()} ({int(median_subs/1000)}k median subs)" if median_subs > 1000 else category_name.replace('-', ' ').title()
        }
        nodes.append(node)
    
    # Process category-to-category recommendations
    recommendations_list = []
    for source_category, recommendations in category_recommendations_data.items():
        source_id = f"category_{source_category}"
        
        if isinstance(recommendations, dict):
            # Recommendations is a dict of category -> weight
            for target_category, weight in recommendations.items():
                target_id = f"category_{target_category}"
                
                # Only add link if both nodes exist
                if source_id in [n['id'] for n in nodes] and target_id in [n['id'] for n in nodes]:
                    recommendations_list.append({
                        'source': source_id,
                        'target': target_id,
                        'value': weight  # Use weight for link strength
                    })
    
    print(f"Processing {len(nodes)} category nodes and {len(recommendations_list)} links")
    
    # Sort nodes for consistent ordering
    nodes.sort(key=lambda x: (-x.get('subscriber_count', 0), x['name']))
    
    # Add group information for better clustering
    print("Adding group information for clustering...")
    add_node_groups(nodes, recommendations_list)
    
    # Create final graph structure
    graph_data = {
        'nodes': nodes,
        'links': recommendations_list,
        'metadata': {
            'total_nodes': len(nodes),
            'total_links': len(recommendations_list),
            'categories_count': len(all_categories),
            'total_recommendations': sum(len(r) for r in category_recommendations_data.values() if isinstance(r, dict))
        }
    }
    
    # Save processed data
    output_file = 'static/jsons/category_graph_data_optimized.json'
    with open(output_file, 'w') as f:
        json.dump(graph_data, f, indent=2)
    
    print(f"\nProcessing complete!")
    print(f"Output saved to: {output_file}")
    print(f"Total category nodes: {graph_data['metadata']['total_nodes']}")
    print(f"Total recommendation links: {graph_data['metadata']['total_links']}")
    print(f"Total recommendations across all categories: {graph_data['metadata']['total_recommendations']}")

if __name__ == '__main__':
    main()