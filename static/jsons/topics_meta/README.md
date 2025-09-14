# Topics Meta Data

This folder contains JSON files with pre-computed analysis data from the Substack engagement exploration. These files enable frontend chart recreation without needing to reprocess the full dataset.

## Data Source
- **Dataset**: 36,403 Substack posts from 1,494 unique publications
- **Date Range**: March 2018 to September 2025
- **Generated**: From `explore_engagement.ipynb` analysis using `generate_meta_data.py`

## File Structure

### 📊 Feature Impact Analysis
Files showing how specific features affect engagement metrics:

- `topics_has_images.json` - Posts with vs without images
- `topics_has_number.json` - Titles with vs without numbers
- `topics_has_question.json` - Titles with vs without question marks
- `topics_has_exclamation.json` - Titles with vs without exclamation marks
- `topics_has_lists.json` - Posts with vs without bullet/numbered lists
- `topics_is_weekend.json` - Weekend vs weekday posting
- `topics_is_morning.json` - Morning (6-12) vs other times
- `topics_is_evening.json` - Evening (18-23) vs other times

**Structure Example:**
```json
{
  "feature": "has_images",
  "metric": "engagement_score",
  "with_feature": {
    "count": 26917,
    "percentage": 73.94,
    "mean_engagement": 234.42,
    "mean_reactions": 97.71,
    "mean_comments": 17.46,
    "mean_restacks": 13.28
  },
  "without_feature": {
    "count": 9486,
    "percentage": 26.06,
    "mean_engagement": 161.57,
    "mean_reactions": 67.79,
    "mean_comments": 12.11,
    "mean_restacks": 8.67
  },
  "effect_percentage": 45.09,
  "statistical_significance": {
    "t_statistic": 9.99,
    "p_value": 1.88e-23,
    "significant": true
  }
}
```

### ⏰ Temporal Patterns
Time-based engagement analysis:

- `temporal_hourly.json` - Engagement by hour of day (0-23)
- `temporal_daily.json` - Engagement by day of week
- `temporal_monthly.json` - Engagement by month
- `temporal_yearly.json` - Yearly engagement trends

**Hourly Structure Example:**
```json
{
  "chart_type": "hourly_patterns",
  "best_hour": 22,
  "worst_hour": 9,
  "data": [
    {
      "hour": 0,
      "count": 919,
      "mean_engagement": 213.87,
      "mean_reactions": 93.01,
      "mean_comments": 13.71,
      "mean_restacks": 12.93
    }
    // ... 24 hours total
  ]
}
```

### 🚀 Viral Content Analysis
High-performing content analysis:

- `viral_posts_analysis.json` - Top 5% performing posts analysis

**Structure:**
```json
{
  "threshold_percentile": 95,
  "threshold_score": 967.9,
  "viral_count": 1821,
  "viral_percentage": 5.0,
  "feature_comparison": [
    {
      "feature": "title_length",
      "viral_mean": 7.27,
      "normal_mean": 7.50,
      "difference_percentage": -3.0
    }
    // ... more features
  ],
  "top_viral_posts": [
    {
      "title": "Today's Top Political News...",
      "engagement_score": 28341,
      "reaction_count": 18314,
      "comment_count": 614,
      "restacks": 2319
    }
    // ... top 10 posts
  ]
}
```

### 📈 Statistical Analysis
Correlation and statistical data:

- `correlation_analysis.json` - Feature correlation matrix
- `basic_statistics.json` - Dataset overview and descriptive stats

**Correlation Structure:**
```json
{
  "correlation_matrix": [
    {
      "feature1": "reaction_count",
      "feature2": "engagement_score",
      "correlation": 0.89,
      "row_index": 0,
      "col_index": 3
    }
    // ... all feature pairs
  ],
  "features": ["reaction_count", "comment_count", ...],
  "top_engagement_correlations": [
    {
      "feature": "reaction_count",
      "correlation": 0.89
    }
    // ... ranked by correlation with engagement
  ]
}
```

### 📝 Content Analysis
Content-focused metrics:

- `content_length_analysis.json` - Engagement by content length bins
- `publication_performance.json` - Top performing publications

**Content Length Structure:**
```json
{
  "chart_type": "content_length_analysis",
  "bins": ["<1K", "1-5K", "5-10K", "10-20K", "20-50K", "50K+"],
  "data": [
    {
      "length_bin": "<1K",
      "count": 5234,
      "percentage": 14.37,
      "mean_engagement": 198.45,
      "median_engagement": 42.0,
      "mean_reactions": 81.23,
      "mean_comments": 14.87,
      "mean_restacks": 10.45
    }
    // ... all bins
  ]
}
```

### 🔀 Feature Combinations
Interaction analysis between features:

- `combination_has_images_has_question.json`
- `combination_has_images_has_lists.json`
- `combination_has_number_has_question.json`
- `combination_is_weekend_has_images.json`

**Structure:**
```json
{
  "feature1": "has_images",
  "feature2": "has_question",
  "combinations": [
    {
      "combination": "Neither",
      "feature1_value": 0,
      "feature2_value": 0,
      "count": 2156,
      "percentage": 5.92,
      "mean_engagement": 142.67,
      "mean_reactions": 60.15,
      "mean_comments": 10.85,
      "mean_restacks": 7.44
    }
    // ... all 4 combinations (Neither, feature1_only, feature2_only, Both)
  ]
}
```

## Key Metrics Explained

### Engagement Score Formula
```
engagement_score = reaction_count + (5 × comment_count) + (3 × restacks)
```

**Rationale**:
- **Comments** (weight: 5) - Highest effort, most valuable engagement
- **Restacks** (weight: 3) - Medium effort, indicates shareworthy content
- **Reactions** (weight: 1) - Low effort, but still positive signal

### Statistical Significance
All feature impact analyses include statistical tests:
- **t_statistic**: T-test statistic comparing means
- **p_value**: Statistical significance (< 0.05 = significant)
- **significant**: Boolean flag for p < 0.05

## Frontend Usage Examples

### Bar Chart - Feature Impact
```javascript
// Load topics_has_images.json
const data = [
  { category: 'With Images', value: data.with_feature.mean_engagement },
  { category: 'Without Images', value: data.without_feature.mean_engagement }
];
```

### Line Chart - Temporal Patterns
```javascript
// Load temporal_hourly.json
const chartData = data.data.map(d => ({
  hour: d.hour,
  engagement: d.mean_engagement,
  posts: d.count
}));
```

### Heatmap - Correlation Matrix
```javascript
// Load correlation_analysis.json
const heatmapData = data.correlation_matrix.map(d => ({
  x: d.feature1,
  y: d.feature2,
  value: d.correlation
}));
```

### Scatter Plot - Viral Posts
```javascript
// Load viral_posts_analysis.json
const scatterData = data.top_viral_posts.map(post => ({
  x: post.reaction_count,
  y: post.comment_count,
  size: post.restacks,
  title: post.title
}));
```

## Data Quality Notes

- **Missing Values**: Handled by filling with 0 or appropriate defaults
- **Outlier Treatment**: Link counts capped at 20, extreme values preserved for authenticity
- **Temporal Coverage**: Full date range maintained, some hours/days may have low counts
- **Statistical Validity**: Only publications with 10+ posts included in performance analysis

## Regeneration

To regenerate all files:
```bash
python generate_meta_data.py
```

This will overwrite all existing files with fresh data from the current dataset.

## File Sizes
- Individual feature files: ~1-2KB each
- Temporal files: ~5-15KB each
- Correlation matrix: ~50KB
- Viral posts: ~15KB
- Total: ~150KB for all files

All files use compact JSON formatting optimized for frontend consumption while maintaining data precision for accurate chart recreation.