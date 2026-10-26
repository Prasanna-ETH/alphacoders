from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.entities import Account, Transaction, Complaint
from app.schemas.schemas import MoneyTrailResponse, MoneyTrailHop

def trace_money_trail(
    account_id: str,
    db: Session,
    direction: str = "BOTH",
    max_depth: int = 4,
    min_amount: float = 0.0,
    time_window_hours: Optional[int] = None
) -> MoneyTrailResponse:
    root_account = db.query(Account).filter(Account.account_id == account_id).first()
    if not root_account:
        return MoneyTrailResponse(
            root_account_id=account_id,
            root_account_number="UNKNOWN",
            direction=direction,
            max_depth=max_depth,
            total_flow_amount=0.0,
            hops_count=0,
            unique_accounts_count=0,
            total_duration_minutes=0.0,
            hops=[],
            nodes=[],
            links=[]
        )

    hops: List[MoneyTrailHop] = []
    visited_nodes = {account_id: {"id": account_id, "label": root_account.account_number, "risk": root_account.risk_score, "is_root": True}}
    visited_txns = set()
    total_flow = 0.0
    first_timestamp = None
    last_timestamp = None

    # Time filter cutoff
    now = datetime.utcnow()
    earliest_time = now - timedelta(hours=time_window_hours) if time_window_hours else None

    # Queue of (current_acc_id, current_hop_number, previous_timestamp)
    # 1. Outbound expansion
    if direction in ["OUTBOUND", "BOTH"]:
        queue = [(account_id, 1, None)]
        while queue:
            curr_id, depth, prev_time = queue.pop(0)
            if depth > max_depth:
                continue

            query = db.query(Transaction).filter(
                Transaction.sender_account_id == curr_id,
                Transaction.amount >= min_amount
            )
            if earliest_time:
                query = query.filter(Transaction.timestamp >= earliest_time)

            txns = query.order_by(Transaction.timestamp.asc()).all()

            for tx in txns:
                if tx.transaction_id in visited_txns:
                    continue
                visited_txns.add(tx.transaction_id)
                total_flow += tx.amount

                if not first_timestamp or tx.timestamp < first_timestamp:
                    first_timestamp = tx.timestamp
                if not last_timestamp or tx.timestamp > last_timestamp:
                    last_timestamp = tx.timestamp

                # Time elapsed from previous hop
                time_elapsed_min = None
                if prev_time:
                    time_elapsed_min = round((tx.timestamp - prev_time).total_seconds() / 60.0, 1)

                receiver = db.query(Account).filter(Account.account_id == tx.receiver_account_id).first()
                r_num = receiver.account_number if receiver else tx.receiver_account_id
                r_risk = receiver.risk_score if receiver else 50.0

                visited_nodes[tx.receiver_account_id] = {
                    "id": tx.receiver_account_id,
                    "label": r_num,
                    "risk": r_risk,
                    "mule_type": receiver.mule_type if receiver else "UNKNOWN",
                    "is_root": False
                }

                # Check linked complaints for receiver
                comp_ids = [c.complaint_id for c in db.query(Complaint).filter(Complaint.linked_account_id == tx.receiver_account_id).all()]

                src_acc = db.query(Account).filter(Account.account_id == tx.sender_account_id).first()
                src_num = src_acc.account_number if src_acc else tx.sender_account_id

                hop_item = MoneyTrailHop(
                    hop_number=depth,
                    source_account_id=tx.sender_account_id,
                    source_account_number=src_num,
                    target_account_id=tx.receiver_account_id,
                    target_account_number=r_num,
                    amount=tx.amount,
                    timestamp=tx.timestamp,
                    channel=tx.channel,
                    time_elapsed_minutes=time_elapsed_min,
                    cumulative_amount=round(total_flow, 2),
                    is_complaint_linked=len(comp_ids) > 0,
                    complaint_ids=comp_ids
                )
                hops.append(hop_item)

                if depth < max_depth:
                    queue.append((tx.receiver_account_id, depth + 1, tx.timestamp))

    # 2. Inbound expansion
    if direction in ["INBOUND", "BOTH"]:
        in_queue = [(account_id, 1, None)]
        while in_queue:
            curr_id, depth, prev_time = in_queue.pop(0)
            if depth > max_depth:
                continue

            query = db.query(Transaction).filter(
                Transaction.receiver_account_id == curr_id,
                Transaction.amount >= min_amount
            )
            if earliest_time:
                query = query.filter(Transaction.timestamp >= earliest_time)

            txns = query.order_by(Transaction.timestamp.desc()).all()

            for tx in txns:
                if tx.transaction_id in visited_txns:
                    continue
                visited_txns.add(tx.transaction_id)
                total_flow += tx.amount

                if not first_timestamp or tx.timestamp < first_timestamp:
                    first_timestamp = tx.timestamp
                if not last_timestamp or tx.timestamp > last_timestamp:
                    last_timestamp = tx.timestamp

                sender = db.query(Account).filter(Account.account_id == tx.sender_account_id).first()
                s_num = sender.account_number if sender else tx.sender_account_id
                s_risk = sender.risk_score if sender else 20.0

                visited_nodes[tx.sender_account_id] = {
                    "id": tx.sender_account_id,
                    "label": s_num,
                    "risk": s_risk,
                    "mule_type": sender.mule_type if sender else "NORMAL",
                    "is_root": False
                }

                comp_ids = [c.complaint_id for c in db.query(Complaint).filter(Complaint.linked_account_id == tx.sender_account_id).all()]
                rec_acc = db.query(Account).filter(Account.account_id == tx.receiver_account_id).first()
                rec_num = rec_acc.account_number if rec_acc else tx.receiver_account_id

                hop_item = MoneyTrailHop(
                    hop_number=depth,
                    source_account_id=tx.sender_account_id,
                    source_account_number=s_num,
                    target_account_id=tx.receiver_account_id,
                    target_account_number=rec_num,
                    amount=tx.amount,
                    timestamp=tx.timestamp,
                    channel=tx.channel,
                    time_elapsed_minutes=None,
                    cumulative_amount=round(total_flow, 2),
                    is_complaint_linked=len(comp_ids) > 0,
                    complaint_ids=comp_ids
                )
                hops.append(hop_item)

                if depth < max_depth:
                    in_queue.append((tx.sender_account_id, depth + 1, tx.timestamp))

    total_duration_min = 0.0
    if first_timestamp and last_timestamp and last_timestamp > first_timestamp:
        total_duration_min = round((last_timestamp - first_timestamp).total_seconds() / 60.0, 1)

    nodes_list = list(visited_nodes.values())
    links_list = [
        {
            "source": h.source_account_id,
            "target": h.target_account_id,
            "amount": h.amount,
            "channel": h.channel,
            "time_elapsed": h.time_elapsed_minutes,
            "hop": h.hop_number
        }
        for h in hops
    ]

    return MoneyTrailResponse(
        root_account_id=account_id,
        root_account_number=root_account.account_number,
        direction=direction,
        max_depth=max_depth,
        total_flow_amount=round(total_flow, 2),
        hops_count=len(hops),
        unique_accounts_count=len(visited_nodes),
        total_duration_minutes=total_duration_min,
        hops=hops,
        nodes=nodes_list,
        links=links_list
    )
