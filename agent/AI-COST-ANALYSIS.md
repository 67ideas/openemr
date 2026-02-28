# AI Cost Analysis

## AI Usage Assumptions

- Tokens per request: `5,200`
- Usage per clinician: `5 requests/hour * 10 hours/day = 50 requests/day`
- Monthly usage per clinician (~20 weekdays per month): `50 * 20 = 1,000 requests/month`
- Monthly tokens per clinician: `1,000 * 5,200 = 5,200,000 tokens`
- Braintrust span estimate: `1 request = 1 span`
- Claude Haiku 4.5 pricing: `$1.00 / 1M input tokens`, `$5.00 / 1M output tokens`
- Cost model split: `20% input / 80% output` (output tokens are typically much longer than inputs)
- Blended LLM rate used in table: `($1.00 * 0.20) + ($5.00 * 0.80) = $4.20 / 1M tokens`

## Braintrust Pricing Notes (from website)

- Free: `$0/month`, `1 million spans`, `1 GB storage`, `10k scores`, `14 days retention`
- Pro: `$249/month`, `unlimited spans`, `5 GB storage`, `50k scores`, `30 days retention`
- Enterprise: `Custom pricing`

## Monthly Usage and Cost Estimates


| Clinicians (users) | Requests / month | Tokens / month  | LLM cost (20% input / 80% output @ $4.20/M blended) | Braintrust tier from image                                   | Braintrust monthly cost |
| ------------------ | ---------------- | --------------- | --------------------------------------------------- | ------------------------------------------------------------ | ----------------------- |
| 100                | 100,000          | 520,000,000     | $2,184                                              | Free (fits span limit)                                       | $0                      |
| 1,000              | 1,000,000        | 5,200,000,000   | $21,840                                             | Free (at span limit)                                         | $0                      |
| 10,000             | 10,000,000       | 52,000,000,000  | $218,400                                            | Pro or Enterprise (depends on storage/scoring/privacy needs) | $249+                   |
| 100,000            | 100,000,000      | 520,000,000,000 | $2,184,000                                          | Pro or Enterprise (likely Enterprise at this scale)          | Custom                  |


