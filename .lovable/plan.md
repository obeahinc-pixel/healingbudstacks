

# Populate The Wire with Real Cannabis Industry News

## What We Found

We discovered several high-quality, real news sources directly relevant to Healing Buds:

### Real Articles to Seed (from verified sources)

1. **"Medical Cannabis Reduces Opioid Prescriptions, Study Shows"** (Marijuana Moment, Dec 2025) - Category: research
2. **"Portugal: INFARMED Tightens Import/Export of Medical Cannabis"** (Cannabis Regulations, Sep 2025) - Category: industry  
3. **"Trump Signs Order to Expand Medical Cannabis Research"** (Drugs.com, 2025) - Category: news
4. **"The Blockchain Bud: Tracking Cannabis from Seed to Sale"** (Tenn Canna, Oct 2025) - Category: blockchain
5. **"Is Portugal Losing Its Role as Europe's Cannabis Gateway?"** (Business of Cannabis, Nov 2025) - Category: industry
6. **"Medicare's First-Ever CBD Pilot Program"** (Marijuana Herald, Nov 2025) - Category: research
7. **"Portugal Medical Cannabis Market Overview 2025"** (Prohibition Partners, Sep 2025) - Category: industry
8. **"Blockchain-Based Cannabis Traceability in Supply Chain Management"** (IJACSA, 2024) - Category: blockchain

## Implementation Plan

### Step 1: Seed the articles table with real news
Insert 8 real articles into the `articles` table with:
- Real titles and summaries from verified sources
- Proper categories (news, research, blockchain, industry)
- Source attribution in the content
- Links to original articles
- One article marked as featured

### Step 2: Add a `source_url` column to articles table
Add a column to store the original article URL so users can "Read Original Article" (this translation key already exists in the i18n files).

### Step 3: Update ArticleDetail page
Ensure the article detail page shows a "Read Original Article" link when `source_url` is present, linking to the real source.

## Technical Details

### Database Changes
- Add `source_url` (text, nullable) column to `articles` table
- Insert 8 curated real articles with proper slugs, summaries, categories, and content

### Files to Modify
- **ArticleDetail page** (if exists): Add "Read Original" link using existing i18n key `readOriginal`

### Content Categories Used
- `news` - General cannabis policy and legislation
- `research` - Clinical studies and medical findings  
- `industry` - Market analysis and business news
- `blockchain` - Traceability and Web3 cannabis tech

### No Risk
- Only adds new data and an optional column
- Does not change any existing functionality
- All articles are from real, verifiable public sources

