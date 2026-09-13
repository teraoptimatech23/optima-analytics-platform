# DD-DVL Data Boundary

The dashboard consumes loop aggregates and decision-engine output. Components do not read provider-specific schemas.

## Pipeline

`Source -> Raw/Staging -> Source Normalization -> Canonical Data Model -> Loop Aggregates -> Analytics -> Prediction -> Insight -> Action`

Canonical currency is `IDR`; canonical timezone is `Asia/Jakarta`. Other currencies require an explicit conversion layer before normalization.

## Loop Sources

| Loop | Primary sources |
| --- | --- |
| Customer Behavior | CRM, Store, Shopee, Tokopedia, social/customer data |
| Traffic Acquisition | Google, Meta, TikTok, Shopee, Tokopedia |
| Conversion | Google, Meta, TikTok, Shopee, Tokopedia, Store |
| Engagement | Meta, TikTok, CRM, Shopee, Tokopedia, Store |
| Retention | CRM, Store, Shopee, Tokopedia |
| Analytics | All normalized loop data |
| Profit Optimization | Commerce, Store, CRM, traffic spend, available cost data |

## Existing Module Mapping

| Existing module | DD-DVL loop | Reused component/selector |
| --- | --- | --- |
| Customer Profile, Needs, Pain Points, Motivation, Perception | Customer Behavior | Existing page components and selectors |
| Purchase Behaviour, Customer Journey conversion | Conversion | `PurchaseBehaviour`, `CustomerJourney` |
| Campaign Performance, Google Ads, Meta Ads, YouTube Ads | Traffic Acquisition | Existing marketing pages and selectors |
| Attribution | Traffic Acquisition and Analytics | `Attribution` and existing attribution selectors |
| Purchase engagement and journey interaction | Engagement | Existing behavior/journey components |
| RFM, Cohort, Churn supporting view | Retention | Existing RFM, cohort, and churn components |
| AI Insight, Churn, CLV, Demand, Sales, Recommendation | Analytics | Existing validated model pages and selectors |
| CLV, Sales, Demand, Market Basket, Campaign Performance | Profit Optimization | Existing prediction, basket, and campaign components |

## Identity And Status

Provider IDs map to `canonicalCustomerId` only when an explicit valid mapping exists. Otherwise records remain `anonymous` or `unresolved`; no identity stitching is inferred.

The current provider fixtures are development-only and report `Synthetic`. No provider is reported as `Connected`. The adapter contract is ready for real integrations after credentials, extraction, and connection validation are supplied.
