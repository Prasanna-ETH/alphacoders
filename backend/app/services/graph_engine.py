import networkx as nx
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.models.entities import Account, Customer, Phone, Device, UPI, Transaction, Complaint, NetworkCluster
from app.schemas.schemas import CytoscapeElement, CytoscapeGraphResponse

class GraphEngine:
    def __init__(self):
        self.G = nx.MultiDiGraph()

    def build_account_subgraph(
        self,
        account_id: str,
        db: Session,
        depth: int = 2,
        include_entities: bool = True
    ) -> CytoscapeGraphResponse:
        """
        Builds a multi-modal Cytoscape graph centered around an account,
        including transfers, shared phones, shared devices, complaints, and UPI handles.
        """
        elements: List[CytoscapeElement] = []
        added_nodes = set()
        added_edges = set()

        def add_node(nid: str, label: str, ntype: str, risk: float = 0.0, rlevel: str = "LOW", details: dict = None):
            if nid in added_nodes:
                return
            added_nodes.add(nid)
            elements.append(CytoscapeElement(
                data={
                    "id": nid,
                    "label": label,
                    "type": ntype,
                    "risk_score": risk,
                    "risk_level": rlevel,
                    "subtitle": details.get("subtitle", "") if details else "",
                    "details": details or {}
                },
                classes=f"node-{ntype.lower()} risk-{rlevel.lower()}"
            ))

        def add_edge(eid: str, src: str, tgt: str, label: str, etype: str, is_susp: bool = False, extra: dict = None):
            if eid in added_edges or src not in added_nodes or tgt not in added_nodes:
                return
            added_edges.add(eid)
            edata = {
                "id": eid,
                "source": src,
                "target": tgt,
                "label": label,
                "type": etype,
                "is_suspicious": is_susp
            }
            if extra:
                edata.update(extra)
            elements.append(CytoscapeElement(
                data=edata,
                classes=f"edge-{etype.lower()} {'edge-suspicious' if is_susp else ''}"
            ))

        # Root Account
        root = db.query(Account).filter(Account.account_id == account_id).first()
        if not root:
            return CytoscapeGraphResponse(elements=[], summary={"total_nodes": 0, "total_edges": 0})

        add_node(
            nid=root.account_id,
            label=f"Account: {root.account_number[-6:]}",
            ntype="Account",
            risk=root.risk_score,
            rlevel=root.risk_level,
            details={
                "account_id": root.account_id,
                "account_number": root.account_number,
                "bank": root.bank_name,
                "balance": f"₹{root.balance:,.2f}",
                "mule_type": root.mule_type,
                "subtitle": f"{root.bank_name} ({root.mule_type})"
            }
        )

        # 1. Customer Person Node & OWNS edge
        cust = db.query(Customer).filter(Customer.customer_id == root.customer_id).first()
        if cust and include_entities:
            add_node(
                nid=cust.customer_id,
                label=cust.name,
                ntype="Person",
                risk=root.risk_score,
                rlevel=root.risk_level,
                details={
                    "customer_id": cust.customer_id,
                    "name": cust.name,
                    "email": cust.email or "N/A",
                    "national_id": cust.national_id or "N/A",
                    "occupation": cust.occupation or "N/A",
                    "city": cust.city or "N/A",
                    "subtitle": f"Customer / {cust.city}"
                }
            )
            add_edge(f"OWNS-{cust.customer_id}-{root.account_id}", cust.customer_id, root.account_id, "OWNS", "OWNS")

            # 2. Phones
            phones = db.query(Phone).filter(Phone.customer_id == cust.customer_id).all()
            for ph in phones:
                add_node(
                    nid=ph.phone_id,
                    label=ph.phone_number,
                    ntype="Phone",
                    risk=75.0 if ph.is_shared else 15.0,
                    rlevel="HIGH" if ph.is_shared else "LOW",
                    details={"phone_id": ph.phone_id, "number": ph.phone_number, "shared": ph.is_shared, "carrier": ph.carrier, "subtitle": "Registered SIM"}
                )
                add_edge(f"USES-{cust.customer_id}-{ph.phone_id}", cust.customer_id, ph.phone_id, "USES_PHONE", "USES")

                # Check if other accounts share this phone!
                if ph.is_shared:
                    shared_custs = db.query(Customer).join(Phone).filter(
                        Phone.phone_number == ph.phone_number,
                        Customer.customer_id != cust.customer_id
                    ).all()
                    for sc in shared_custs:
                        sc_accs = db.query(Account).filter(Account.customer_id == sc.customer_id).all()
                        for sa in sc_accs:
                            add_node(
                                nid=sa.account_id,
                                label=f"Acc: {sa.account_number[-6:]}",
                                ntype="Account",
                                risk=sa.risk_score,
                                rlevel=sa.risk_level,
                                details={"account_id": sa.account_id, "account_number": sa.account_number, "bank": sa.bank_name, "mule_type": sa.mule_type, "subtitle": "Shared Phone Bridge"}
                            )
                            add_edge(f"SHARES_PHONE-{root.account_id}-{sa.account_id}", root.account_id, sa.account_id, "SHARES_PHONE", "SHARES_PHONE", is_susp=True)

            # 3. Devices
            devs = db.query(Device).filter(Device.customer_id == cust.customer_id).all()
            for d in devs:
                add_node(
                    nid=d.device_id,
                    label=f"Device: {d.device_fingerprint[-8:]}",
                    ntype="Device",
                    risk=80.0 if d.is_shared else 20.0,
                    rlevel="CRITICAL" if d.is_shared else "LOW",
                    details={"device_id": d.device_id, "fingerprint": d.device_fingerprint, "type": d.device_type, "ip": d.ip_address, "subtitle": "Mobile Terminal"}
                )
                add_edge(f"USES-{cust.customer_id}-{d.device_id}", cust.customer_id, d.device_id, "OPERATES_ON", "USES")

                # Check shared device links!
                if d.is_shared:
                    shared_dev_custs = db.query(Customer).join(Device).filter(
                        Device.device_fingerprint == d.device_fingerprint,
                        Customer.customer_id != cust.customer_id
                    ).all()
                    for sdc in shared_dev_custs:
                        sdc_accs = db.query(Account).filter(Account.customer_id == sdc.customer_id).all()
                        for sda in sdc_accs:
                            add_node(
                                nid=sda.account_id,
                                label=f"Acc: {sda.account_number[-6:]}",
                                ntype="Account",
                                risk=sda.risk_score,
                                rlevel=sda.risk_level,
                                details={"account_id": sda.account_id, "account_number": sda.account_number, "bank": sda.bank_name, "mule_type": sda.mule_type, "subtitle": "Hardware Bridge"}
                            )
                            add_edge(f"SHARES_DEVICE-{root.account_id}-{sda.account_id}", root.account_id, sda.account_id, "SHARES_DEVICE", "SHARES_DEVICE", is_susp=True)

        # 4. UPI Handles
        upis = db.query(UPI).filter(UPI.account_id == account_id).all()
        for u in upis:
            add_node(
                nid=u.upi_id,
                label=u.vpa_handle,
                ntype="UPI",
                risk=root.risk_score,
                rlevel=root.risk_level,
                details={"upi_id": u.upi_id, "vpa": u.vpa_handle, "subtitle": "Virtual Payment Address"}
            )
            add_edge(f"USES_UPI-{root.account_id}-{u.upi_id}", root.account_id, u.upi_id, "BINDS_UPI", "USES")

        # 5. Direct Complaints
        complaints = db.query(Complaint).filter(Complaint.linked_account_id == account_id).all()
        for c in complaints:
            add_node(
                nid=c.complaint_id,
                label=f"FIR: {c.complaint_id[-7:]}",
                ntype="Complaint",
                risk=95.0,
                rlevel="CRITICAL",
                details={
                    "complaint_id": c.complaint_id,
                    "fraud_type": c.fraud_type,
                    "amount": f"₹{c.amount:,.2f}",
                    "victim": c.victim_name,
                    "station": c.police_station,
                    "subtitle": f"{c.fraud_type} (₹{c.amount:,.0f})"
                }
            )
            add_edge(f"LINKED_TO-{c.complaint_id}-{root.account_id}", c.complaint_id, root.account_id, "REPORTED_TO", "LINKED_TO", is_susp=True)

        # 6. Counterparty Transactions (1 hop and 2 hop)
        txns_out = db.query(Transaction).filter(Transaction.sender_account_id == account_id).all()
        for tx in txns_out:
            rec = db.query(Account).filter(Account.account_id == tx.receiver_account_id).first()
            if rec:
                add_node(
                    nid=rec.account_id,
                    label=f"Acc: {rec.account_number[-6:]}",
                    ntype="Account",
                    risk=rec.risk_score,
                    rlevel=rec.risk_level,
                    details={
                        "account_id": rec.account_id,
                        "account_number": rec.account_number,
                        "bank": rec.bank_name,
                        "mule_type": rec.mule_type,
                        "subtitle": f"{rec.bank_name} ({rec.mule_type})"
                    }
                )
                add_edge(
                    eid=f"TX-{tx.transaction_id}",
                    src=root.account_id,
                    tgt=rec.account_id,
                    label=f"₹{tx.amount:,.0f}",
                    etype="TRANSFER",
                    is_susp=tx.is_suspicious,
                    extra={"amount": tx.amount, "channel": tx.channel, "timestamp": tx.timestamp.isoformat()}
                )

                # Hop 2 outward if depth >= 2
                if depth >= 2:
                    txns_hop2 = db.query(Transaction).filter(Transaction.sender_account_id == rec.account_id).limit(4).all()
                    for t2 in txns_hop2:
                        rec2 = db.query(Account).filter(Account.account_id == t2.receiver_account_id).first()
                        if rec2:
                            add_node(
                                nid=rec2.account_id,
                                label=f"Acc: {rec2.account_number[-6:]}",
                                ntype="Account",
                                risk=rec2.risk_score,
                                rlevel=rec2.risk_level,
                                details={"account_id": rec2.account_id, "account_number": rec2.account_number, "bank": rec2.bank_name, "mule_type": rec2.mule_type, "subtitle": rec2.mule_type}
                            )
                            add_edge(
                                eid=f"TX-{t2.transaction_id}",
                                src=rec.account_id,
                                tgt=rec2.account_id,
                                label=f"₹{t2.amount:,.0f}",
                                etype="TRANSFER",
                                is_susp=t2.is_suspicious,
                                extra={"amount": t2.amount, "channel": t2.channel}
                            )

        # Inbound transactions
        txns_in = db.query(Transaction).filter(Transaction.receiver_account_id == account_id).all()
        for tx in txns_in:
            snd = db.query(Account).filter(Account.account_id == tx.sender_account_id).first()
            if snd:
                add_node(
                    nid=snd.account_id,
                    label=f"Acc: {snd.account_number[-6:]}",
                    ntype="Account",
                    risk=snd.risk_score,
                    rlevel=snd.risk_level,
                    details={
                        "account_id": snd.account_id,
                        "account_number": snd.account_number,
                        "bank": snd.bank_name,
                        "mule_type": snd.mule_type,
                        "subtitle": f"{snd.bank_name} ({snd.mule_type})"
                    }
                )
                add_edge(
                    eid=f"TX-{tx.transaction_id}",
                    src=snd.account_id,
                    tgt=root.account_id,
                    label=f"₹{tx.amount:,.0f}",
                    etype="TRANSFER",
                    is_susp=tx.is_suspicious,
                    extra={"amount": tx.amount, "channel": tx.channel, "timestamp": tx.timestamp.isoformat()}
                )

        summary = {
            "total_nodes": len(added_nodes),
            "total_edges": len(added_edges),
            "root_account_id": account_id,
            "high_risk_nodes": sum(1 for e in elements if e.data.get("risk_score", 0) >= 60)
        }

        return CytoscapeGraphResponse(elements=elements, summary=summary)

    def build_cluster_graph(self, cluster_id: str, db: Session) -> CytoscapeGraphResponse:
        """
        Builds the complete syndicate graph for an entire network cluster.
        """
        cluster = db.query(NetworkCluster).filter(NetworkCluster.cluster_id == cluster_id).first()
        if not cluster:
            return CytoscapeGraphResponse(elements=[], summary={"total_nodes": 0, "total_edges": 0})

        cluster_accounts = db.query(Account).filter(Account.cluster_id == cluster_id).all()
        acc_ids = [a.account_id for a in cluster_accounts]

        elements: List[CytoscapeElement] = []
        added_nodes = set()
        added_edges = set()

        for acc in cluster_accounts:
            if acc.account_id not in added_nodes:
                added_nodes.add(acc.account_id)
                elements.append(CytoscapeElement(
                    data={
                        "id": acc.account_id,
                        "label": f"Acc: {acc.account_number[-6:]}",
                        "type": "Account",
                        "risk_score": acc.risk_score,
                        "risk_level": acc.risk_level,
                        "subtitle": acc.mule_type,
                        "details": {
                            "account_id": acc.account_id,
                            "account_number": acc.account_number,
                            "bank": acc.bank_name,
                            "balance": f"₹{acc.balance:,.2f}",
                            "mule_type": acc.mule_type
                        }
                    },
                    classes=f"node-account risk-{acc.risk_level.lower()}"
                ))

        # Internal transfers between cluster accounts
        txns = db.query(Transaction).filter(
            Transaction.sender_account_id.in_(acc_ids),
            Transaction.receiver_account_id.in_(acc_ids)
        ).all()

        for tx in txns:
            eid = f"TX-{tx.transaction_id}"
            if eid not in added_edges:
                added_edges.add(eid)
                elements.append(CytoscapeElement(
                    data={
                        "id": eid,
                        "source": tx.sender_account_id,
                        "target": tx.receiver_account_id,
                        "label": f"₹{tx.amount:,.0f}",
                        "type": "TRANSFER",
                        "amount": tx.amount,
                        "is_suspicious": tx.is_suspicious
                    },
                    classes="edge-transfer edge-suspicious"
                ))

        # Shared devices within cluster
        devices = db.query(Device).filter(Device.is_shared == True).all()
        for d in devices:
            owner_accs = db.query(Account).filter(
                Account.customer_id == d.customer_id,
                Account.cluster_id == cluster_id
            ).all()
            for oa in owner_accs:
                if d.device_id not in added_nodes:
                    added_nodes.add(d.device_id)
                    elements.append(CytoscapeElement(
                        data={
                            "id": d.device_id,
                            "label": f"DEV: {d.device_fingerprint[-6:]}",
                            "type": "Device",
                            "risk_score": 85.0,
                            "risk_level": "CRITICAL",
                            "subtitle": "Shared Terminal",
                            "details": {"fingerprint": d.device_fingerprint, "type": d.device_type, "ip": d.ip_address}
                        },
                        classes="node-device risk-critical"
                    ))
                e_id = f"OPERATES-{oa.account_id}-{d.device_id}"
                if e_id not in added_edges:
                    added_edges.add(e_id)
                    elements.append(CytoscapeElement(
                        data={"id": e_id, "source": oa.account_id, "target": d.device_id, "label": "OPERATES", "type": "USES"},
                        classes="edge-uses"
                    ))

        return CytoscapeGraphResponse(
            elements=elements,
            summary={"cluster_name": cluster.name, "total_nodes": len(added_nodes), "total_edges": len(added_edges)}
        )

graph_engine = GraphEngine()
