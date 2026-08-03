# Synthetic production dataset — Kopi Kenangan Customer Insight

Deterministic simulation of a 48-outlet Indonesian coffee chain over
**1 Jul 2025 – 15 Jun 2026** (350 days). Regenerating with the same seed
produces byte-identical files.

```bash
npm run data:generate     # raw export → data/
npm run data:validate     # checks the statistical relationships hold
npm run data:aggregate    # BI cube → src/data/insights.json
npm run data:query        # slice demo + consistency assertions
```

## Volume

| Table | Rows | Grain |
|---|---|---|
| `transactions.csv` | 204,001 | one order |
| `transaction_items.csv` | 387,161 | one line item |
| `customers.csv` | 12,845 | one customer (RFM + CLV) |
| `survey_responses.csv` | 12,845 | one response, 10 attributes × score + importance |
| `google_ads_performance.csv` | 4,745 | day × campaign × keyword × device × age × gender |
| `meta_ads_performance.csv` | 1,263 | day × campaign × location × age × gender |
| `youtube_ads_performance.csv` | 501 | day × campaign |
| `outlets.csv` / `products.csv` / `regions.csv` / `campaigns.csv` | 48 / 22 / 8 / 12 | dimensions |

## Keys

```
regions.RegionID ─┬─< outlets.RegionID
                  │
outlets.OutletID ─┼─< transactions.OutletID
                  ├─< customers.HomeOutletID
                  └─< survey_responses.OutletID

customers.CustomerID ─┬─< transactions.CustomerID
                      └─< survey_responses.CustomerID

transactions.TransactionID ─< transaction_items.TransactionID
products.ProductID ─────────< transaction_items.ProductID
campaigns.CampaignID ───────┬─< google_ads_performance.CampaignID
                            ├─< meta_ads_performance.CampaignID
                            ├─< youtube_ads_performance.CampaignID
                            └─< transactions.CampaignID  (first-order attribution)
```

## How the numbers are produced

Nothing is drawn from a flat random distribution. Each stage feeds the next:

1. **Calendar** — day-of-week curve (weekend +16%), monthly seasonality,
   Ramadan (−18%) and Lebaran (+42%), payday cycle on the 25th–2nd,
   national holidays.
2. **Media plan** → daily ad rows at Indonesian benchmarks. YouTube views
   accumulate an awareness stock that decays with a 30-day half-life and lifts
   **branded** search impressions later in the year.
3. **Acquisition** — paid conversions plus organic/referral that scale with the
   installed base, which sets the size of each monthly cohort. 32% of the base
   predates the window (backdated cohorts), as in any real chain.
4. **Customers** — age bands 30/45/15/10, gender 52/48, occupation conditioned
   on age, income lognormal per occupation. Latent traits (price sensitivity,
   promo affinity, digital affinity, visit rate) derive from income and age.
5. **Visits** — inter-arrival times from the customer's own rate, filtered by the
   calendar. Hour of day from a three-peak curve (07–09, 12–13, 17–19).
6. **Waiting time** — queue pressure = hour load × day factor × outlet footfall
   ÷ service speed ÷ outlet quality.
7. **Satisfaction** — falls with waiting time, rises with outlet quality and
   ambience, shifted by the customer's price sensitivity and any discount.
8. **Churn hazard** — per visit, driven by the running satisfaction average,
   membership and visit count. Retention, repeat rate and CLV therefore *emerge*.
9. **Survey** — anchored on what the customer actually experienced (their own
   average wait, the stores they used, the discounts they received).
   NPS follows overall satisfaction.

## Verified relationships

Measured on the generated data by `npm run data:validate`:

| Claim | Measured |
|---|---|
| Waiting time depresses satisfaction | r = **−0.70** |
| Satisfaction drives NPS | r = **+0.64** |
| Satisfaction drives repeat visits | r = **+0.24** |
| Repeat visits drive CLV | r = **+0.51** |
| Voucher users buy smaller baskets | **−23.4%** (Rp 40,815 vs Rp 53,290) |
| Weekend is busier | **+16.3%** per day |
| Peak hours queue longer | **11.8 min** vs 4.7 min off-peak |
| Membership rises with frequency | 10.0% → 51.1% → 75.9% across frequency bands |
| Category mix | Coffee **65.6%** / Non Coffee **18.8%** / Snack **15.6%** |

## KPIs (computed, not authored)

| KPI | Value |
|---|---|
| Customer Satisfaction | 3.99 / 5 (79.8%) |
| NPS | 33 (41.1% promoters, 8.0% detractors) |
| Avg Purchase Frequency | 3.22× / month |
| Average Basket | Rp 49,430 |
| Repeat Purchase Rate | 87.2% lifetime · 43.9% within-month |
| Monthly Revenue | Rp 840M average |
| Retention / Churn | 64.1% / 35.9% |
| Customer Lifetime Value | Rp 1,819,029 |

## Not shipped to the browser

`data/` is 53 MB. The app reads `src/data/insights.json` (1.1 MB) instead — a
star schema of additive facts plus one compact row per customer, so every filter
combination re-aggregates exactly rather than reading pre-baked answers.
