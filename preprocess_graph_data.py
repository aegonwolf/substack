#!/usr/bin/env python3
"""
Preprocess graph data for optimized 3D force graph rendering.
Takes recommendations.json and subscriber_counts.json and outputs
a pre-computed graph structure with positions and visual properties.
"""

import json
import math
import random
from typing import Dict, List, Set, Tuple
from urllib.parse import urlparse

def extract_publication_name(url: str) -> str:
    """Extract a readable name from publication URL."""
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or url
        
        # Remove www. prefix
        hostname = hostname.replace('www.', '')
        
        # For substack URLs, extract the subdomain
        if '.substack.com' in hostname:
            subdomain = hostname.split('.')[0]
            return subdomain.replace('-', ' ').title()
        
        # For other domains, use the main domain name
        parts = hostname.split('.')
        if len(parts) >= 2:
            main_domain = parts[-2]
            return main_domain.replace('-', ' ').title()
        
        return hostname
    except:
        return url.replace('https://', '').replace('http://', '').split('/')[0]

def categorize_publication(url: str) -> str:
    """Categorize publication based on URL."""
    if 'substack.com' in url:
        return 'Newsletter'
    elif any(domain in url for domain in ['.com', '.org', '.net']):
        return 'Website'
    else:
        return 'Publication'

def calculate_node_size(subscriber_count: int, is_bestseller: bool) -> float:
    """Calculate node size based on subscriber count."""
    if subscriber_count > 0:
        # Logarithmic scale for better visual distribution
        size = 2 + math.log10(subscriber_count + 1) * 2
        return min(max(size, 2), 20)  # Clamp between 2 and 20
    return 8 if is_bestseller else 4

def get_node_color(subscriber_count: int, is_bestseller: bool) -> str:
    """Determine node color based on properties."""
    if is_bestseller:
        return '#ff6b35'  # Orange for bestsellers
    elif subscriber_count > 50000:
        return '#4ecdc4'  # Teal
    elif subscriber_count > 10000:
        return '#45b7d1'  # Blue
    else:
        return '#96ceb4'  # Light green

def add_node_groups(nodes: List[Dict], links: List[Dict]) -> None:
    """
    Add group information to nodes for better force-directed layout.
    Don't set initial positions - let the force simulation handle it.
    """
    # Build adjacency information
    connections = {node['id']: {'in': 0, 'out': 0} for node in nodes}
    
    for link in links:
        if link['source'] in connections:
            connections[link['source']]['out'] += 1
        if link['target'] in connections:
            connections[link['target']]['in'] += 1
    
    # Add connection counts and groups to nodes
    for node in nodes:
        node_id = node['id']
        node['inDegree'] = connections[node_id]['in']
        node['outDegree'] = connections[node_id]['out']
        
        # Assign group based on node characteristics
        if node['is_bestseller']:
            if connections[node_id]['in'] > 0:
                node['group'] = 'dual-role'  # Both bestseller and recommended
            else:
                node['group'] = 'bestseller'
        elif connections[node_id]['in'] > 10:
            node['group'] = 'highly-recommended'
        elif connections[node_id]['in'] > 0:
            node['group'] = 'recommended'
        else:
            node['group'] = 'other'

def main():
    """Main processing function."""
    
    # Load input data
    print("Loading data files...")
    with open('static/jsons/recommendations.json', 'r') as f:
        recommendations_data = json.load(f)
    
    with open('static/jsons/subscriber_counts.json', 'r') as f:
        subscriber_counts_data = json.load(f)
    
    # Extract recommendation data
    recommendation_dict = recommendations_data[0]
    
    # Create subscriber count mapping
    subscriber_map = {}
    for item in subscriber_counts_data:
        if item.get('publication_url') and item.get('subscriber_count'):
            subscriber_map[item['publication_url']] = item['subscriber_count']
    
    print(f"Found subscriber data for {len(subscriber_map)} publications")
    
    # Build node list
    all_publications = set()
    recommendations_list = []
    
    # Process recommendations
    for recommender_url, recommended_urls in recommendation_dict.items():
        all_publications.add(recommender_url)
        for recommended_url in recommended_urls:
            all_publications.add(recommended_url)
            recommendations_list.append({
                'source': recommender_url,
                'target': recommended_url
            })
    
    print(f"Processing {len(all_publications)} nodes and {len(recommendations_list)} links")
    
    # Create nodes with pre-computed properties
    nodes = []
    for url in all_publications:
        is_bestseller = url in recommendation_dict
        subscriber_count = subscriber_map.get(url, 0)
        
        node = {
            'id': url,
            'name': extract_publication_name(url),
            'category': categorize_publication(url),
            'subscriber_count': subscriber_count,
            'is_bestseller': is_bestseller,
            # Pre-computed visual properties
            'val': calculate_node_size(subscriber_count, is_bestseller),
            'color': get_node_color(subscriber_count, is_bestseller),
            # Pre-computed label
            'label': f"{extract_publication_name(url)} ({subscriber_count:,} subs)" if subscriber_count > 0 else extract_publication_name(url)
        }
        nodes.append(node)
    
    # Sort nodes for consistent ordering
    nodes.sort(key=lambda x: (-x['subscriber_count'], x['name']))
    
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
            'bestsellers_count': sum(1 for n in nodes if n['is_bestseller']),
            'nodes_with_subscribers': sum(1 for n in nodes if n['subscriber_count'] > 0)
        }
    }
    
    # Save processed data
    output_file = 'static/jsons/graph_data_optimized.json'
    with open(output_file, 'w') as f:
        json.dump(graph_data, f, indent=2)
    
    print(f"\nProcessing complete!")
    print(f"Output saved to: {output_file}")
    print(f"Total nodes: {graph_data['metadata']['total_nodes']}")
    print(f"Total links: {graph_data['metadata']['total_links']}")
    print(f"Bestsellers: {graph_data['metadata']['bestsellers_count']}")
    print(f"Nodes with subscriber data: {graph_data['metadata']['nodes_with_subscribers']}")

if __name__ == '__main__':
    main()