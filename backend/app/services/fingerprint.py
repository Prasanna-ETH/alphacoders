import numpy as np
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.entities import Account, Transaction, Complaint, Phone, Device, UPI

def compute_account_fingerprint(account_id: str, db: Session) -> dict:
    account = db.query(Account).filter(Account.account_id == account_id).first()
    if not account:
        return None

    # Inbound transactions
    inbound_txns = db.query(Transaction).filter(
        Transaction.receiver_account_id == account_id
    ).order_by(Transaction.timestamp.asc()).all()

    # Outbound transactions
    outbound_txns = db.query(Transaction).filter(
        Transaction.sender_account_id == account_id
    ).order_by(Transaction.timestamp.asc()).all()

    all_txns = sorted(inbound_txns + outbound_txns, key=lambda x: x.timestamp)

    # Basic volume & amounts
    inflow = sum(t.amount for t in inbound_txns)
    outflow = sum(t.amount for t in outbound_txns)
    amounts = [t.amount for t in all_txns] if all_txns else [0.0]
    avg_amount = float(np.mean(amounts)) if amounts else 0.0
    median_amount = float(np.median(amounts)) if amounts else 0.0

    inflow_outflow_ratio = round(outflow / inflow, 4) if inflow > 0 else (1.0 if outflow == 0 else 999.0)

    # Unique counterparties & fan-in/fan-out
    unique_senders = list(set(t.sender_account_id for t in inbound_txns))
    unique_receivers = list(set(t.receiver_account_id for t in outbound_txns))
    fan_in = len(unique_senders)
    fan_out = len(unique_receivers)

    # Velocity / Rapid Transfer Calculation:
    # Match each inbound transaction with subsequent outbound transactions within 15 minutes
    rapid_transfer_count = 0
    rapid_amount = 0.0
    latency_seconds_list = []

    used_out_ids = set()
    for in_tx in inbound_txns:
        candidate_outs = [
            out_tx for out_tx in outbound_txns 
            if out_tx.timestamp >= in_tx.timestamp and out_tx.transaction_id not in used_out_ids
        ]
        if candidate_outs:
            nearest_out = min(candidate_outs, key=lambda x: x.timestamp)
            used_out_ids.add(nearest_out.transaction_id)
            sec_diff = (nearest_out.timestamp - in_tx.timestamp).total_seconds()
            latency_seconds_list.append(sec_diff)
            if sec_diff <= 900:  # <= 15 minutes is rapid pass-through
                rapid_transfer_count += 1
                rapid_amount += nearest_out.amount

    avg_receive_to_send_min = round(float(np.mean(latency_seconds_list)) / 60.0, 1) if latency_seconds_list else 120.0
    rapid_transfer_ratio = round((rapid_amount / outflow), 3) if outflow > 0 else 0.0
    if rapid_transfer_ratio > 1.0:
        rapid_transfer_ratio = 1.0

    # Dormancy and burst activity
    dormancy_days = 0
    if len(all_txns) >= 2:
        gaps = [(all_txns[i].timestamp - all_txns[i-1].timestamp).days for i in range(1, len(all_txns))]
        dormancy_days = max(gaps) if gaps else 0
    else:
        dormancy_days = 0

    # Peak hour transactions (burst score)
    hourly_counts = {}
    for t in all_txns:
        hour_key = t.timestamp.strftime("%Y-%m-%d %H")
        hourly_counts[hour_key] = hourly_counts.get(hour_key, 0) + 1
    activity_burst_score = max(hourly_counts.values()) if hourly_counts else 0

    # Turnover ratio (Total Flow / Balance)
    total_flow = inflow + outflow
    balance = max(account.balance, 1000.0)
    account_turnover = round(total_flow / balance, 2)

    # Complaint linkage
    complaints = db.query(Complaint).filter(Complaint.linked_account_id == account_id).all()
    complaint_count = len(complaints)
    complaint_amount = sum(c.amount for c in complaints)

    # Counterparty risk & network features
    counterparty_ids = set(unique_senders + unique_receivers)
    suspicious_neighbours = 0
    if counterparty_ids:
        suspicious_neighbours = db.query(Account).filter(
            Account.account_id.in_(list(counterparty_ids)),
            Account.risk_score >= 60.0
        ).count()

    # Network Centrality estimate
    network_degree = fan_in + fan_out
    network_centrality = round(min(1.0, network_degree / 25.0), 3)
    network_risk = account.network_risk if account.network_risk > 0 else round(min(100.0, (suspicious_neighbours * 18.0) + (network_centrality * 40.0)), 1)

    features = {
        "transaction_count": len(all_txns),
        "inbound_count": len(inbound_txns),
        "outbound_count": len(outbound_txns),
        "inflow": round(inflow, 2),
        "outflow": round(outflow, 2),
        "inflow_outflow_ratio": inflow_outflow_ratio,
        "average_transaction_amount": round(avg_amount, 2),
        "median_transaction_amount": round(median_amount, 2),
        "unique_senders": fan_in,
        "unique_receivers": fan_out,
        "fan_in": fan_in,
        "fan_out": fan_out,
        "avg_receive_to_send_minutes": avg_receive_to_send_min,
        "rapid_transfer_ratio": rapid_transfer_ratio,
        "dormancy_duration_days": dormancy_days,
        "activity_burst_score": activity_burst_score,
        "account_turnover": account_turnover,
        "complaint_count": complaint_count,
        "complaint_amount": round(complaint_amount, 2),
        "suspicious_neighbour_count": suspicious_neighbours,
        "network_centrality": network_centrality,
        "network_risk": round(network_risk, 1)
    }

    return features
