---
name: pubmed-database
description: Search PubMed biomedical literature, construct advanced queries with Boolean operators and MeSH terms, access data via E-utilities API, and conduct systematic literature reviews. Use when searching for biomedical/life sciences research, building PubMed queries, fetching article data programmatically, or conducting systematic reviews.
---

# PubMed Database

## Query Construction

Combine concepts with Boolean operators (AND, OR, NOT), field tags, and phrase quotes:

```text
# Systematic reviews on diabetes treatment (recent)
diabetes mellitus[mh] AND treatment[tiab] AND systematic review[pt] AND 2023:2024[dp]

# RCTs comparing drugs
(metformin[nm] OR insulin[nm]) AND diabetes mellitus, type 2[mh] AND randomized controlled trial[pt]

# Author + topic + year
smith ja[au] AND cancer[tiab] AND 2023[dp] AND english[la]
```

**Common field tags:** `[mh]` MeSH, `[tiab]` title/abstract, `[pt]` publication type, `[dp]` date, `[au]` author, `[nm]` substance name, `[ta]` journal, `[la]` language

**Date ranges:** `2020:2024[dp]` | **Free full text:** `AND free full text[sb]`

## MeSH Terms

- `[mh]` includes narrower terms automatically; `[majr]` limits to main focus
- Add subheadings for specificity: `diabetes mellitus/drug therapy[mh]`

## Publication Types (use `[pt]`)

`Randomized Controlled Trial` | `Systematic Review` | `Meta-Analysis` | `Clinical Trial` | `Review` | `Case Reports`

## E-utilities API

```python
import requests

BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"

# 1. Search → get PMIDs
r = requests.get(f"{BASE}esearch.fcgi", params={
    "db": "pubmed",
    "term": "diabetes[tiab] AND 2024[dp]",
    "retmax": 100,
    "retmode": "json",
    "api_key": "YOUR_API_KEY"  # recommended: 10 req/s vs 3 req/s
})
pmids = r.json()["esearchresult"]["idlist"]

# 2. Fetch abstracts
r = requests.get(f"{BASE}efetch.fcgi", params={
    "db": "pubmed",
    "id": ",".join(pmids),
    "rettype": "abstract",
    "retmode": "text",
    "api_key": "YOUR_API_KEY"
})
abstracts = r.text
```

**Endpoints:** `esearch` (search), `efetch` (download), `esummary` (summaries), `epost` (batch upload), `elink` (related articles)

For result sets > 500, use history server: add `usehistory=y` to ESearch, then reference with `query_key` + `WebEnv` in EFetch.

## Systematic Reviews (PICO Framework)

```text
# P=population, I=intervention, C=comparison, O=outcome
diabetes mellitus, type 2[mh] AND
(metformin[nm] OR lifestyle modification[tiab]) AND
glycemic control[tiab] AND
randomized controlled trial[pt]
```

Strategy: start broad → add field tags → apply date/type filters → combine searches via history.

## Citation Lookup

```text
# By PMID
12345678[pmid]

# By DOI
10.1056/NEJMoa123456[doi]

# By PMC ID
PMC123456[pmc]
```

## Export Formats

- `.nbib` — Zotero, Mendeley, EndNote
- `medline` — via API: `rettype=medline&retmode=text`
- `xml` — programmatic processing
- `csv` — data analysis

## Tips

- Use Advanced Search to inspect query translation before running
- Cache API results locally; implement exponential backoff for rate limits
- Get a free API key at NCBI for 10 req/s rate limit
- `[mh]` vs `[tiab]`: MeSH is precise but may miss new terminology; use both for comprehensive coverage

## Resources

- [PubMed Help](https://pubmed.ncbi.nlm.nih.gov/help/)
- [E-utilities Docs](https://www.ncbi.nlm.nih.gov/books/NBK25501/)
