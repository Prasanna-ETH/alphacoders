from typing import Tuple

def classify_mule_behaviour(features: dict, account_cluster: str = None) -> Tuple[str, float, str]:
    """
    Classifies account into one of the designated mule behaviour types
    with confidence and rationale.
    """
    txn_count = features.get("transaction_count", 0)
    inflow = features.get("inflow", 0.0)
    outflow = features.get("outflow", 0.0)
    fan_in = features.get("fan_in", 0)
    fan_out = features.get("fan_out", 0)
    ratio = features.get("inflow_outflow_ratio", 1.0)
    rapid_ratio = features.get("rapid_transfer_ratio", 0.0)
    avg_latency = features.get("avg_receive_to_send_minutes", 120.0)
    dormancy = features.get("dormancy_duration_days", 0)
    burst = features.get("activity_burst_score", 0)
    complaints = features.get("complaint_count", 0)
    susp_nbrs = features.get("suspicious_neighbour_count", 0)

    # 1. Dormant Activation
    if dormancy >= 90 and burst >= 3:
        conf = min(96.0, 78.0 + (dormancy / 20.0) + (burst * 2.0))
        rationale = f"Prolonged dormancy of {dormancy} days breached by sudden velocity burst of {burst} transactions within peak hour."
        return "DORMANT ACTIVATION", round(conf, 1), rationale

    # 2. Pass-Through Mule
    if rapid_ratio >= 0.70 and avg_latency <= 15.0 and 0.80 <= ratio <= 1.25 and txn_count >= 2:
        conf = min(96.0, 84.0 + (rapid_ratio * 10.0) + (complaints * 1.5))
        rationale = f"Classic pass-through signature: {int(rapid_ratio*100)}% of funds disbursed within {avg_latency} minutes of receipt, maintaining negligible account retention."
        return "PASS-THROUGH MULE", round(conf, 1), rationale

    # 3. Funnel Mule
    if fan_in >= 4 and fan_out <= 2 and inflow >= 50000.0:
        conf = min(94.0, 80.0 + (fan_in * 2.5))
        rationale = f"Funnel concentration pattern: Aggregating deposits from {fan_in} disparate sender sources into consolidated downstream endpoints."
        return "FUNNEL MULE", round(conf, 1), rationale

    # 4. Distributor Mule
    if fan_out >= 6 and fan_in <= 2:
        conf = min(93.0, 80.0 + (fan_out * 1.5))
        rationale = f"Distributor fan-out signature: Dispersing pooled deposits across {fan_out} distinct accounts/digital wallets."
        return "DISTRIBUTOR MULE", round(conf, 1), rationale

    # 5. Layering Mule
    if susp_nbrs >= 2 and 0.85 <= ratio <= 1.15 and txn_count >= 3:
        conf = min(92.0, 78.0 + (susp_nbrs * 4.0))
        rationale = f"Complex layering behavior: Routing equal inflow/outflow through {susp_nbrs} high-risk syndicated counterparties to obscure audit trails."
        return "LAYERING MULE", round(conf, 1), rationale

    # 6. Network Intermediary
    if susp_nbrs >= 2 or features.get("network_centrality", 0.0) >= 0.40:
        conf = 84.0
        rationale = f"Critical bridging node connecting disparate financial crime syndicates with elevated network centrality."
        return "NETWORK INTERMEDIARY", round(conf, 1), rationale

    # 7. Cash-out Mule
    if outflow >= 100000.0 and ratio >= 0.90 and complaints >= 1:
        conf = 82.0
        rationale = f"Terminal cash-out node converting inbound cybercrime receipts into instant liquidity."
        return "CASH-OUT MULE", round(conf, 1), rationale

    # Default / Normal
    if complaints > 0:
        return "COMPLAINT LINKED", 80.0, f"Account flagged primarily due to {complaints} formal cybercrime complaints."
    
    return "NORMAL", 95.0, "Transaction velocity, counterparty diversity, and account turnover align with standard domestic retail banking patterns."
