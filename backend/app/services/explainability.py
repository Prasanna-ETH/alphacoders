from typing import List, Dict, Any
from app.schemas.schemas import FeatureContribution

def calculate_feature_explanations(features: dict, account_dict: dict) -> Dict[str, Any]:
    """
    Computes deterministic SHAP-style positive and negative feature attributions
    derived from real mathematical feature values.
    """
    positive_contribs: List[FeatureContribution] = []
    negative_contribs: List[FeatureContribution] = []
    top_indicators: List[str] = []

    rapid_ratio = features.get("rapid_transfer_ratio", 0.0)
    latency = features.get("avg_receive_to_send_minutes", 120.0)
    complaints = features.get("complaint_count", 0)
    susp_nbrs = features.get("suspicious_neighbour_count", 0)
    dormancy = features.get("dormancy_duration_days", 0)
    burst = features.get("activity_burst_score", 0)
    turnover = features.get("account_turnover", 0.0)
    centrality = features.get("network_centrality", 0.0)
    inflow = features.get("inflow", 0.0)
    ratio = features.get("inflow_outflow_ratio", 1.0)

    # 1. Rapid pass-through
    if rapid_ratio >= 0.50 or (latency <= 15.0 and rapid_ratio > 0.2):
        impact = round(min(28.0, 15.0 + (rapid_ratio * 13.0)), 1)
        positive_contribs.append(FeatureContribution(
            feature_name="rapid_transfer_velocity",
            display_name="Rapid Pass-Through Velocity",
            impact=impact,
            direction="POSITIVE",
            formatted_value=f"{int(rapid_ratio * 100)}% within {latency} min",
            description=f"{int(rapid_ratio*100)}% of inbound credits dispersed within {latency} mins of receipt."
        ))
        top_indicators.append(f"+{int(impact)} Rapid pass-through behaviour ({latency}m avg turnaround)")
    else:
        negative_contribs.append(FeatureContribution(
            feature_name="steady_velocity",
            display_name="Normal Turnaround Time",
            impact=-8.5,
            direction="NEGATIVE",
            formatted_value=f"> {latency} min",
            description="Transaction turnover exhibits no rapid micro-window diversion pattern."
        ))

    # 2. Complaint Linkages
    if complaints > 0:
        c_impact = round(min(25.0, 12.0 + (complaints * 3.5)), 1)
        positive_contribs.append(FeatureContribution(
            feature_name="complaint_correlation",
            display_name="Cybercrime Portal Complaints",
            impact=c_impact,
            direction="POSITIVE",
            formatted_value=f"{complaints} verified reports",
            description=f"Direct linkage to {complaints} formal complaints logged on National Cyber Crime Reporting Portal."
        ))
        top_indicators.append(f"+{int(c_impact)} Complaint-linked counterparties ({complaints} NCRP cases)")
    else:
        negative_contribs.append(FeatureContribution(
            feature_name="zero_complaints",
            display_name="Zero Registered Complaints",
            impact=-12.0,
            direction="NEGATIVE",
            formatted_value="0 complaints",
            description="Clean regulatory history with zero victim dispute records."
        ))

    # 3. Suspicious Network Neighbors
    if susp_nbrs > 0:
        nbr_impact = round(min(20.0, 8.0 + (susp_nbrs * 4.0)), 1)
        positive_contribs.append(FeatureContribution(
            feature_name="high_risk_neighbors",
            display_name="Syndicated Counterparty Linkages",
            impact=nbr_impact,
            direction="POSITIVE",
            formatted_value=f"{susp_nbrs} high-risk entities",
            description=f"Direct fund exchange with {susp_nbrs} accounts already designated High/Critical risk."
        ))
        top_indicators.append(f"+{int(nbr_impact)} High-risk network position ({susp_nbrs} flagged neighbors)")
    else:
        negative_contribs.append(FeatureContribution(
            feature_name="clean_network",
            display_name="Unflagged Counterparties",
            impact=-7.0,
            direction="NEGATIVE",
            formatted_value="0 flagged neighbors",
            description="Counterparties consist exclusively of unflagged retail bank accounts."
        ))

    # 4. Dormant Activation
    if dormancy >= 60 and burst >= 2:
        dorm_impact = round(min(18.0, 10.0 + (burst * 2.0)), 1)
        positive_contribs.append(FeatureContribution(
            feature_name="dormancy_burst",
            display_name="Dormant Account Reactivation",
            impact=dorm_impact,
            direction="POSITIVE",
            formatted_value=f"{dormancy} days dormant, {burst} tx/hr burst",
            description=f"Abrupt re-activation after {dormancy} days of dormancy with high burst velocity."
        ))
        top_indicators.append(f"+{int(dorm_impact)} Dormant account activation ({burst} txns/hr)")

    # 5. Account Turnover & Flow
    if turnover >= 8.0:
        turn_impact = round(min(15.0, 6.0 + (turnover * 0.4)), 1)
        positive_contribs.append(FeatureContribution(
            feature_name="abnormal_turnover",
            display_name="Abnormal Account Turnover",
            impact=turn_impact,
            direction="POSITIVE",
            formatted_value=f"{turnover}x turnover",
            description=f"Throughput velocity exceeds account retained balance by {turnover} times."
        ))
        top_indicators.append(f"+{int(turn_impact)} Abnormal account turnover ({turnover}x throughput)")
    else:
        negative_contribs.append(FeatureContribution(
            feature_name="proportional_turnover",
            display_name="Proportional Balance Retention",
            impact=-6.0,
            direction="NEGATIVE",
            formatted_value=f"{turnover}x turnover",
            description="Balance retention is consistent with standard consumer savings accounts."
        ))

    # 6. KYC and Account Age
    if account_dict.get("kyc_status") == "VERIFIED":
        negative_contribs.append(FeatureContribution(
            feature_name="verified_kyc",
            display_name="Verified KYC Status",
            impact=-5.0,
            direction="NEGATIVE",
            formatted_value="VERIFIED",
            description="Account possesses verified biometric / Aadhaar-linked identity documentation."
        ))

    # Sort contributions by absolute impact
    positive_contribs.sort(key=lambda x: x.impact, reverse=True)
    negative_contribs.sort(key=lambda x: x.impact)

    return {
        "positive_contributors": positive_contribs,
        "negative_contributors": negative_contribs,
        "top_indicators": top_indicators[:5]
    }
