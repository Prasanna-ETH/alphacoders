from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import Account, Customer, Phone, Device, UPI, Transaction, Complaint
from app.schemas.schemas import HiddenConnectionPath, HiddenLinksResponse

def discover_hidden_links(
    source_id: str,
    target_id: str,
    db: Session
) -> HiddenLinksResponse:
    """
    Finds multi-entity bridge paths connecting two accounts or complaints via
    shared devices, shared phones, common beneficiaries, or multi-hop transactions.
    """
    paths: List[HiddenConnectionPath] = []

    # Resolve accounts
    src_acc = db.query(Account).filter(Account.account_id == source_id).first()
    if not src_acc:
        # maybe it's a complaint id
        src_comp = db.query(Complaint).filter(Complaint.complaint_id == source_id).first()
        if src_comp:
            src_acc = db.query(Account).filter(Account.account_id == src_comp.linked_account_id).first()

    tgt_acc = db.query(Account).filter(Account.account_id == target_id).first()
    if not tgt_acc:
        tgt_comp = db.query(Complaint).filter(Complaint.complaint_id == target_id).first()
        if tgt_comp:
            tgt_acc = db.query(Account).filter(Account.account_id == tgt_comp.linked_account_id).first()

    if not src_acc or not tgt_acc:
        return HiddenLinksResponse(total_found=0, paths=[])

    # 1. Check Shared Device Fingerprints
    src_devices = db.query(Device).filter(Device.customer_id == src_acc.customer_id).all()
    for sd in src_devices:
        matching_devs = db.query(Device).filter(
            Device.device_fingerprint == sd.device_fingerprint,
            Device.customer_id == tgt_acc.customer_id
        ).all()
        for md in matching_devs:
            paths.append(HiddenConnectionPath(
                source_entity=src_acc.account_id,
                target_entity=tgt_acc.account_id,
                connection_type="SHARED_HARDWARE_FINGERPRINT",
                path=[
                    {"entity": src_acc.account_id, "type": "Account", "label": src_acc.account_number},
                    {"entity": sd.device_id, "type": "Device", "label": f"FP: {sd.device_fingerprint}"},
                    {"entity": tgt_acc.account_id, "type": "Account", "label": tgt_acc.account_number}
                ],
                risk_level="CRITICAL",
                explanation=f"Direct hardware collusion: Both accounts authenticate through identical terminal fingerprint '{sd.device_fingerprint}'."
            ))

    # 2. Check Shared Phone Numbers
    src_phones = db.query(Phone).filter(Phone.customer_id == src_acc.customer_id).all()
    for sp in src_phones:
        matching_phones = db.query(Phone).filter(
            Phone.phone_number == sp.phone_number,
            Phone.customer_id == tgt_acc.customer_id
        ).all()
        for mp in matching_phones:
            paths.append(HiddenConnectionPath(
                source_entity=src_acc.account_id,
                target_entity=tgt_acc.account_id,
                connection_type="SHARED_REGISTERED_TELECOM",
                path=[
                    {"entity": src_acc.account_id, "type": "Account", "label": src_acc.account_number},
                    {"entity": sp.phone_id, "type": "Phone", "label": sp.phone_number},
                    {"entity": tgt_acc.account_id, "type": "Account", "label": tgt_acc.account_number}
                ],
                risk_level="CRITICAL",
                explanation=f"Telecom bridge: Both account holders share registered mobile SIM '{sp.phone_number}'."
            ))

    # 3. Check Shared Beneficiary (Both send money to the same downstream account)
    src_out_accs = [t.receiver_account_id for t in db.query(Transaction).filter(Transaction.sender_account_id == src_acc.account_id).all()]
    tgt_out_accs = [t.receiver_account_id for t in db.query(Transaction).filter(Transaction.sender_account_id == tgt_acc.account_id).all()]
    common_beneficiaries = set(src_out_accs).intersection(set(tgt_out_accs))

    for cb_id in common_beneficiaries:
        cb_acc = db.query(Account).filter(Account.account_id == cb_id).first()
        cb_label = cb_acc.account_number if cb_acc else cb_id
        paths.append(HiddenConnectionPath(
            source_entity=src_acc.account_id,
            target_entity=tgt_acc.account_id,
            connection_type="COMMON_DISBURSEMENT_BENEFICIARY",
            path=[
                {"entity": src_acc.account_id, "type": "Account", "label": src_acc.account_number},
                {"entity": cb_id, "type": "Beneficiary", "label": f"Common Recipient: {cb_label}"},
                {"entity": tgt_acc.account_id, "type": "Account", "label": tgt_acc.account_number}
            ],
            risk_level="HIGH",
            explanation=f"Common pooling endpoint: Both accounts disburse funds into shared beneficiary account '{cb_label}'."
        ))

    # 4. Check Multi-hop Transfer Bridge (e.g. A -> X -> Z)
    bridge_txns = db.query(Transaction).filter(
        Transaction.sender_account_id == src_acc.account_id
    ).all()
    for b_tx in bridge_txns:
        intermediate_id = b_tx.receiver_account_id
        hop2 = db.query(Transaction).filter(
            Transaction.sender_account_id == intermediate_id,
            Transaction.receiver_account_id == tgt_acc.account_id
        ).first()
        if hop2:
            inter_acc = db.query(Account).filter(Account.account_id == intermediate_id).first()
            paths.append(HiddenConnectionPath(
                source_entity=src_acc.account_id,
                target_entity=tgt_acc.account_id,
                connection_type="TRANSACTION_FLOW_BRIDGE",
                path=[
                    {"entity": src_acc.account_id, "type": "Account", "label": src_acc.account_number},
                    {"entity": intermediate_id, "type": "Intermediary", "label": inter_acc.account_number if inter_acc else intermediate_id},
                    {"entity": tgt_acc.account_id, "type": "Account", "label": tgt_acc.account_number}
                ],
                risk_level="HIGH",
                explanation=f"Direct flow bridge: Funds routed via intermediary '{inter_acc.account_number if inter_acc else intermediate_id}'."
            ))

    # 5. Check Common Network Cluster
    if src_acc.cluster_id and src_acc.cluster_id == tgt_acc.cluster_id:
        paths.append(HiddenConnectionPath(
            source_entity=src_acc.account_id,
            target_entity=tgt_acc.account_id,
            connection_type="SYNDICATE_CLUSTER_AFFILIATION",
            path=[
                {"entity": src_acc.account_id, "type": "Account", "label": src_acc.account_number},
                {"entity": src_acc.cluster_id, "type": "NetworkCluster", "label": f"Syndicate Cluster {src_acc.cluster_id}"},
                {"entity": tgt_acc.account_id, "type": "Account", "label": tgt_acc.account_number}
            ],
            risk_level="HIGH",
            explanation=f"Cluster co-membership: Both entities participate in syndicate cluster '{src_acc.cluster_id}'."
        ))

    return HiddenLinksResponse(
        total_found=len(paths),
        paths=paths
    )
