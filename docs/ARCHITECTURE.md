# MULEX System Architecture & Technical Specifications

MULEX is a high-velocity financial crime intelligence and cybercrime investigation platform architected to detect, reconstruct, and explain complex mule account networks and syndicate infrastructures.

```
                    MULEX
                      │
               Next.js Frontend (TypeScript, Tailwind, Cytoscape.js)
                      │
                REST API (JSON & PDF binary streams)
                      │
                FastAPI Backend (Python 3.12, uv)
                      │
       ┌──────────────┼──────────────┐
       │              │              │
   SQLite (WAL)    Graph Layer    ML Engine
   SQLAlchemy     NetworkX /      RandomForest + SHAP
                  Neo4j-ready     Attribution
       │              │              │
       └──────────────┼──────────────┘
                      │
                Investigation Engine
                      │
           Risk / Evidence Dossier
```

## 1. Core Data Models

- **Account**: Ledger identity, status, balance, risk score, mule typology classification, and syndicate cluster link.
- **Customer**: Real-world identity, national ID (Aadhaar mock), occupation, address, and risk profile.
- **Transaction**: Directional financial transfers with timestamps, amounts, channels (UPI, IMPS, RTGS, NEFT), and scenario tags.
- **Complaint**: Incident FIRs logged on the National Cyber Crime Reporting Portal (NCRP) linked directly to beneficiary accounts.
- **Phone & Device**: Hardware terminal fingerprints (`FP-MUM-AND-8891-X17`) and registered SIMs tracking multi-account collisions.
- **NetworkCluster**: Detected criminal syndicates grouping co-conspiring accounts, shared devices, and common digital wallets.
- **Investigation & Evidence**: Case management dossiers with audit logs, investigator notes, and formal evidence items.

## 2. Multi-Component Risk Scoring Engine

Overall threat scoring combines three orthogonal risk vectors:
$$\text{Composite Risk} = 0.40 \times \text{Behaviour Risk} + 0.35 \times \text{Network Risk} + 0.25 \times \text{Complaint Risk}$$

- **0 - 29**: LOW
- **30 - 59**: MEDIUM
- **60 - 79**: HIGH
- **80 - 100**: CRITICAL

### Confidence Metric:
Derived from inter-signal variance across data layers:
$$\text{Confidence} = 95.0 - \frac{\text{Var}(\text{Signals})}{250.0} \quad (\text{Bounded: } 85.0\% - 97.5\%)$$

## 3. Explainable AI (SHAP-Style Feature Attribution)

Calculates positive and negative risk contributors directly from mathematical features:
- Rapid pass-through velocity (sub-10 minute turnaround)
- Registered NCRP cybercrime portal complaints
- Syndicated counterparty linkages (shared hardware or telecom)
- Dormancy breaches with high peak-hour transaction burst
- Disproportionate account turnover vs retained closing balance

## 4. Reconstructive Money Trail Engine

Multi-hop recursive graph traversal tracing forward (outbound), backward (inbound), or bidirectional money flows up to depth 5 with minimum amount thresholds and elapsed turnaround timestamps.
