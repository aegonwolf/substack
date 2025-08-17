#!/usr/bin/env python3
"""
Preprocess recommendation counts for each publication.
Takes recommendations.json and subscriber_counts.json and outputs
a mapping of publication URLs to their incoming/outgoing recommendation counts.
"""

import json
from typing import Dict, Set
from collections import defaultdict

def normalize_url(url: str) -> str:
    """Normalize URL by ensuring it has https:// protocol."""
    if url.startswith('http://') or url.startswith('https://'):
        return url
    else:
        return f'https://{url}'

def extract_publication_identifier(url: str) -> str:
    """Extract the key identifier from a publication URL.
    
    Examples:
    - https://lenny.substack.com -> lenny
    - https://lenny.com -> lenny  
    - https://www.lennysnewsletter.com -> lennysnewsletter
    - https://yourlocalepidemiologist.substack.com -> yourlocalepidemiologist
    - https://fixthenews.com -> fixthenews
    """
    # Remove protocol
    url = url.replace('https://', '').replace('http://', '')
    
    # Split by dots to get domain parts
    parts = url.split('.')
    
    if len(parts) >= 2:
        # If it's a substack.com subdomain, return the subdomain
        if len(parts) >= 3 and parts[-2] == 'substack' and parts[-1] == 'com':
            return parts[0]  # e.g., "lenny" from "lenny.substack.com"
        else:
            # For custom domains, handle www prefix and extract main domain name
            if parts[0] == 'www' and len(parts) >= 3:
                # e.g., "lennysnewsletter" from "www.lennysnewsletter.com"
                return parts[1]
            else:
                # e.g., "lenny" from "lenny.com" or "fixthenews" from "fixthenews.com"
                return parts[0]
    
    # Fallback: return the whole thing if we can't parse it
    return url

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
    
    # Create a mapping of identifiers to URLs from subscriber_counts.json
    known_publications = set()
    identifier_to_url = {}
    url_to_identifier = {}
    
    for item in subscriber_counts_data:
        if item.get('publication_url'):
            url = item['publication_url']
            identifier = extract_publication_identifier(url)
            known_publications.add(url)
            identifier_to_url[identifier] = url
            url_to_identifier[url] = identifier
    
    print(f"Found {len(known_publications)} publications in subscriber_counts.json")
    
    # Count incoming and outgoing recommendations for each publication
    incoming_counts = defaultdict(int)
    outgoing_counts = defaultdict(int)
    
    # Debug: Check the structure of recommendations data
    print(f"Found {len(recommendation_dict)} recommenders in recommendations.json")
    
    # Debug: Check URL format differences
    sample_recommendation_urls = list(recommendation_dict.keys())[:3]
    sample_subscriber_urls = list(known_publications)[:3]
    print(f"\nSample recommendation URLs: {sample_recommendation_urls}")
    print(f"Sample subscriber URLs: {sample_subscriber_urls}")
    
    # Check for identifier overlap (using our new matching logic)
    recommender_identifiers = set(extract_publication_identifier(url) for url in recommendation_dict.keys())
    all_recommended_identifiers = set()
    for recommended_urls in recommendation_dict.values():
        all_recommended_identifiers.update(extract_publication_identifier(url) for url in recommended_urls)
    
    known_identifiers = set(identifier_to_url.keys())
    
    print(f"\nIdentifier overlap analysis:")
    print(f"Recommender identifiers in subscriber_counts: {len(recommender_identifiers & known_identifiers)}")
    print(f"Recommended identifiers in subscriber_counts: {len(all_recommended_identifiers & known_identifiers)}")
    
    # Debug: Check some specific examples of overlap
    overlap_recommended = all_recommended_identifiers & known_identifiers
    if overlap_recommended:
        print(f"Some overlapping recommended identifiers: {list(overlap_recommended)[:5]}")
        # Show the URL mappings for these
        for identifier in list(overlap_recommended)[:3]:
            print(f"  {identifier} -> {identifier_to_url[identifier]}")
    else:
        print("No overlapping recommended identifiers found!")
        print(f"First 5 recommended identifiers: {list(all_recommended_identifiers)[:5]}")
        print(f"First 5 subscriber identifiers: {list(known_identifiers)[:5]}")
    
    # Process recommendations - count ALL incoming recommendations to our known publications
    total_recommendations = 0
    for recommender_url, recommended_urls in recommendation_dict.items():
        total_recommendations += len(recommended_urls)
        
        # Extract recommender identifier and find matching URL in our known publications
        recommender_identifier = extract_publication_identifier(recommender_url)
        
        # Count outgoing recommendations (only if recommender is in our known publications)
        if recommender_identifier in identifier_to_url:
            matched_recommender_url = identifier_to_url[recommender_identifier]
            outgoing_counts[matched_recommender_url] = len(recommended_urls)
        
        # Count incoming recommendations for ALL recommended publications that are in our known set
        # This counts every time a known publication is recommended, regardless of who recommends it
        for recommended_url in recommended_urls:
            recommended_identifier = extract_publication_identifier(recommended_url)
            if recommended_identifier in identifier_to_url:
                matched_recommended_url = identifier_to_url[recommended_identifier]
                incoming_counts[matched_recommended_url] += 1
    
    print(f"\nTotal recommendation relationships: {total_recommendations}")
    print(f"Publications with outgoing recommendations: {len(outgoing_counts)}")
    print(f"Publications with incoming recommendations: {len(incoming_counts)}")
    
    # Debug: Show a few examples
    if incoming_counts:
        print(f"\nTop 5 publications by incoming recommendations:")
        top_incoming = sorted(incoming_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        for url, count in top_incoming:
            print(f"  {count}: {url}")
    else:
        print("\nNo incoming recommendations found - likely URL format mismatch!")
    
    # Create final mapping for all publications
    recommendation_counts = {}
    for pub_url in known_publications:
        recommendation_counts[pub_url] = {
            'publication_url': pub_url,
            'incoming_recommendations': incoming_counts.get(pub_url, 0),
            'outgoing_recommendations': outgoing_counts.get(pub_url, 0),
            'total_recommendations': incoming_counts.get(pub_url, 0) + outgoing_counts.get(pub_url, 0)
        }
    
    # Convert to list and sort by total recommendations (descending)
    recommendation_list = list(recommendation_counts.values())
    recommendation_list.sort(key=lambda x: x['total_recommendations'], reverse=True)
    
    # Save processed data
    output_file = 'static/jsons/recommendation_counts.json'
    with open(output_file, 'w') as f:
        json.dump(recommendation_list, f, indent=2)
    
    # Calculate stats
    total_with_incoming = sum(1 for item in recommendation_list if item['incoming_recommendations'] > 0)
    total_with_outgoing = sum(1 for item in recommendation_list if item['outgoing_recommendations'] > 0)
    total_with_any = sum(1 for item in recommendation_list if item['total_recommendations'] > 0)
    max_incoming = max(item['incoming_recommendations'] for item in recommendation_list)
    max_outgoing = max(item['outgoing_recommendations'] for item in recommendation_list)
    
    print(f"\nProcessing complete!")
    print(f"Output saved to: {output_file}")
    print(f"Total publications: {len(recommendation_list)}")
    print(f"Publications with incoming recommendations: {total_with_incoming}")
    print(f"Publications with outgoing recommendations: {total_with_outgoing}")
    print(f"Publications with any recommendations: {total_with_any}")
    print(f"Max incoming recommendations: {max_incoming}")
    print(f"Max outgoing recommendations: {max_outgoing}")
    
    # Show top 10 publications by total recommendations
    print(f"\nTop 10 publications by total recommendations:")
    for i, item in enumerate(recommendation_list[:10], 1):
        print(f"{i:2d}. {item['publication_url']}: {item['incoming_recommendations']} in, {item['outgoing_recommendations']} out, {item['total_recommendations']} total")

if __name__ == '__main__':
    main()