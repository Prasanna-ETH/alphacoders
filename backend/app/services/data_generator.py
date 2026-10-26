import random
import datetime
import uuid
from faker import Faker
from sqlalchemy.orm import Session
from app.models.entities import (
    Customer, Account, Phone, Device, UPI, Transaction, Complaint,
    NetworkCluster, Investigation, Note, Evidence, Alert, AuditLog
)

fake = Faker('en_IN')
Faker.seed(42)
random.seed(42)

def generate_synthetic_data(db: Session, force_reset: bool = False):
    # Check if already seeded
    existing_acc = db.query(Account).first()
    if existing_acc and not force_reset:
        return {"status": "already_seeded", "message": "Database already populated."}

    if force_reset:
        db.query(AuditLog).delete()
        db.query(Evidence).delete()
        db.query(Note).delete()
        db.query(Investigation).delete()
        db.query(Alert).delete()
        db.query(Complaint).delete()
        db.query(Transaction).delete()
        db.query(UPI).delete()
        db.query(Device).delete()
        db.query(Phone).delete()
        db.query(Account).delete()
        db.query(Customer).delete()
        db.query(NetworkCluster).delete()
        db.commit()

    now = datetime.datetime.utcnow()

    # 1. Create Network Clusters
    clusters = []
    cluster_definitions = [
        ("NCL-101", "Syndicate 'ShadowFlow' Mumbai Hub", "CRITICAL", "SHARED_INFRASTRUCTURE", "Multi-layered pass-through and rapid diversion syndicate linked to fake job scams."),
        ("NCL-102", "CyberLaunder North Gateway", "CRITICAL", "COMPLAINT_CONVERGENCE", "High-frequency layering cluster routing illicit funds via shared UPI handles and virtual devices."),
        ("NCL-103", "Apex Dormant Resurgence Group", "HIGH", "DORMANT_ACTIVATION", "Network of previously inactive savings accounts activated concurrently following bulk UPI credits."),
        ("NCL-104", "Bengaluru Tech Park Phishing Ring", "HIGH", "SHARED_DEVICE", "Cluster of 12 accounts operating from emulated mobile devices and common proxy IPs."),
        ("NCL-105", "Eastern Corridor Funnel Group", "MEDIUM", "FUNNEL_DISBURSEMENT", "Regional mule funnel collecting small-ticket investment scam deposits."),
    ]
    for cid, name, risk, ctype, desc in cluster_definitions:
        cluster = NetworkCluster(
            cluster_id=cid,
            name=name,
            risk_level=risk,
            cluster_type=ctype,
            description=desc,
            created_at=now - datetime.timedelta(days=random.randint(60, 180))
        )
        db.add(cluster)
        clusters.append(cluster)
    db.commit()

    # 2. Customers and Accounts collection
    customers = []
    accounts = []
    phones = []
    devices = []
    upis = []

    fraud_types = [
        "UPI fraud", "Phishing", "Investment fraud", "Impersonation",
        "Marketplace fraud", "Loan scam", "Job scam"
    ]

    banks = ["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank", "Federal Sentinel Bank", "Punjab National Bank"]

    # --- SEED SCENARIO 1: DEMO HERO CASE ACC-2847 ---
    # Pass-through mule:
    # 6 complaints, ₹3,20,000 suspicious flow, rapid transfer under 10 min, shared device & phone, 14 entities in cluster
    cust_hero = Customer(
        customer_id="CUST-HERO-2847",
        name="Vikramaditya Sharma",
        email="vikram.sharma.mule@sentinel-mock.in",
        national_id="AADHAR-9821-4401-2847",
        occupation="Self-Employed Commission Agent",
        income_range="₹2L - ₹5L",
        risk_profile="CRITICAL",
        address="Flat 402, Sai Sagar Residency, Kurla West",
        city="Mumbai",
        state="Maharashtra",
        postal_code="400070",
        created_at=now - datetime.timedelta(days=120)
    )
    db.add(cust_hero)
    customers.append(cust_hero)

    acc_hero = Account(
        account_id="ACC-2847",
        customer_id=cust_hero.customer_id,
        account_number="SB-501004822847",
        account_type="SAVINGS",
        bank_name="Federal Sentinel Bank",
        branch="Kurla Business Hub, Mumbai",
        balance=14250.0,
        opening_date=now - datetime.timedelta(days=95),
        status="ACTIVE",
        kyc_status="VERIFIED",
        risk_score=91.0,
        risk_level="CRITICAL",
        mule_type="PASS-THROUGH MULE",
        confidence=94.0,
        behaviour_risk=92.5,
        network_risk=89.0,
        complaint_risk=91.5,
        flagged_reason="Rapid fund dispersion within 6 minutes of cybercrime victim deposits; multiple shared device fingerprints and 6 linked National Cyber Crime Portal complaints.",
        cluster_id="NCL-101",
        last_active_at=now - datetime.timedelta(hours=2)
    )
    db.add(acc_hero)
    accounts.append(acc_hero)

    phone_hero = Phone(
        phone_id="PHN-HERO-2847",
        customer_id=cust_hero.customer_id,
        phone_number="+91 98201 44829",
        is_shared=True,
        carrier="Jio Telecom",
        status="ACTIVE"
    )
    db.add(phone_hero)
    phones.append(phone_hero)

    device_hero = Device(
        device_id="DEV-D17-HERO",
        customer_id=cust_hero.customer_id,
        device_fingerprint="FP-MUM-AND-8891-X17",
        device_type="MOBILE_ANDROID",
        ip_address="103.212.45.18",
        is_shared=True,
        status="ACTIVE"
    )
    db.add(device_hero)
    devices.append(device_hero)

    upi_hero = UPI(
        upi_id="UPI-2847-1",
        account_id=acc_hero.account_id,
        vpa_handle="quickpay.vikram@oksentinel",
        status="ACTIVE"
    )
    db.add(upi_hero)
    upis.append(upi_hero)

    # Connected accounts for Demo Hero Network (Intermediaries & Beneficiaries)
    # Mule B in pass-through chain:
    cust_mule_b = Customer(
        customer_id="CUST-MULE-7721",
        name="Sunil Ramesh Kadam",
        email="sunil.kadam91@mock.com",
        national_id="AADHAR-5102-9981-7721",
        occupation="Delivery Partner",
        risk_profile="HIGH",
        address="Room 12, Chawl No 4, Chembur",
        city="Mumbai",
        state="Maharashtra",
        postal_code="400071"
    )
    db.add(cust_mule_b)
    customers.append(cust_mule_b)

    acc_mule_b = Account(
        account_id="ACC-7721",
        customer_id=cust_mule_b.customer_id,
        account_number="SB-501004827721",
        account_type="SAVINGS",
        bank_name="HDFC Bank",
        branch="Chembur Branch",
        balance=8400.0,
        opening_date=now - datetime.timedelta(days=70),
        status="ACTIVE",
        kyc_status="VERIFIED",
        risk_score=88.0,
        risk_level="CRITICAL",
        mule_type="LAYERING MULE",
        confidence=91.0,
        behaviour_risk=86.0,
        network_risk=91.0,
        complaint_risk=87.0,
        flagged_reason="Intermediary layering node receiving high-velocity transfers from ACC-2847 and fanning out to overseas remittance gateways.",
        cluster_id="NCL-101",
        last_active_at=now - datetime.timedelta(hours=1)
    )
    db.add(acc_mule_b)
    accounts.append(acc_mule_b)

    # Shares device D17 with ACC-2847! (Hidden link feature)
    dev_mule_b = Device(
        device_id="DEV-D17-LINKED",
        customer_id=cust_mule_b.customer_id,
        device_fingerprint="FP-MUM-AND-8891-X17", # SAME FINGERPRINT!
        device_type="MOBILE_ANDROID",
        ip_address="103.212.45.18",
        is_shared=True,
        status="ACTIVE"
    )
    db.add(dev_mule_b)
    devices.append(dev_mule_b)

    # Mule C (Layer 3)
    cust_mule_c = Customer(
        customer_id="CUST-MULE-1029",
        name="Mohd Farooq Ansari",
        risk_profile="HIGH",
        city="Thane",
        state="Maharashtra"
    )
    db.add(cust_mule_c)
    acc_mule_c = Account(
        account_id="ACC-1029",
        customer_id=cust_mule_c.customer_id,
        account_number="SB-501004821029",
        account_type="SAVINGS",
        bank_name="ICICI Bank",
        branch="Thane West",
        balance=25300.0,
        opening_date=now - datetime.timedelta(days=110),
        status="ACTIVE",
        risk_score=84.0,
        risk_level="CRITICAL",
        mule_type="FUNNEL MULE",
        confidence=89.0,
        behaviour_risk=82.0,
        network_risk=86.0,
        complaint_risk=84.0,
        flagged_reason="Funnel consolidation node gathering funds from 4 distinct mules before liquidation.",
        cluster_id="NCL-101",
        last_active_at=now - datetime.timedelta(minutes=45)
    )
    db.add(acc_mule_c)
    accounts.append(acc_mule_c)

    # Beneficiary / Cash-out Node
    cust_beneficiary = Customer(
        customer_id="CUST-CASH-9904",
        name="Global Gold Bullion Merchants (Proxy Account)",
        risk_profile="CRITICAL",
        city="Surat",
        state="Gujarat"
    )
    db.add(cust_beneficiary)
    acc_beneficiary = Account(
        account_id="ACC-9904",
        customer_id=cust_beneficiary.customer_id,
        account_number="CA-889100229904",
        account_type="CURRENT",
        bank_name="Axis Bank",
        branch="Ring Road, Surat",
        balance=450000.0,
        opening_date=now - datetime.timedelta(days=200),
        status="ACTIVE",
        risk_score=78.0,
        risk_level="HIGH",
        mule_type="CASH-OUT MULE",
        confidence=87.0,
        behaviour_risk=79.0,
        network_risk=81.0,
        complaint_risk=72.0,
        flagged_reason="Final disbursement and cash-out gateway for syndicated cybercrime proceeds.",
        cluster_id="NCL-101"
    )
    db.add(acc_beneficiary)
    accounts.append(acc_beneficiary)

    # Victims who deposited into ACC-2847
    victims = []
    victim_names = [
        ("Rajesh K. Mehta", "Cyber Impersonation (Fake CBI Officer)", 80000.0),
        ("Pooja Singhania", "Part-time Job Work-From-Home Scam", 75000.0),
        ("Amitabh Verma", "Pre-approved Instant Loan App Extortion", 65000.0),
        ("Kavita Nair", "Electricity Bill Disconnection Phishing", 42000.0),
        ("Rohan Deshmukh", "FedEx Parcel Drug Contraband Threat", 38000.0),
        ("Dr. Manisha Kulkarni", "High Return Crypto/Forex Scheme", 20000.0)
    ]
    
    for i, (v_name, f_type, v_amt) in enumerate(victim_names, start=1):
        v_cust = Customer(
            customer_id=f"CUST-VIC-{i}",
            name=v_name,
            risk_profile="LOW",
            city="Pune" if i % 2 == 0 else "Mumbai",
            state="Maharashtra"
        )
        db.add(v_cust)
        v_acc = Account(
            account_id=f"ACC-VIC-{i}",
            customer_id=v_cust.customer_id,
            account_number=f"SB-9900112233{i:02d}",
            account_type="SAVINGS",
            bank_name="State Bank of India",
            balance=125000.0,
            opening_date=now - datetime.timedelta(days=400),
            status="ACTIVE",
            risk_score=12.0,
            risk_level="LOW",
            mule_type="NORMAL",
            confidence=95.0,
            behaviour_risk=10.0,
            network_risk=15.0,
            complaint_risk=0.0
        )
        db.add(v_acc)
        victims.append((v_acc, v_name, f_type, v_amt))
    db.commit()

    # --- SEED SCENARIO 2 to 8 ACCOUNTS ---
    scenario_accounts = []
    scenario_configs = [
        ("ACC-3101", "FUNNEL MULE", 85.0, "CRITICAL", "Funnel mule concentrating small deposits from 18 distinct senders within 48h.", "NCL-102"),
        ("ACC-3102", "LAYERING MULE", 79.0, "HIGH", "Layering node passing 98% of received funds to downstream shell accounts.", "NCL-102"),
        ("ACC-3103", "DORMANT ACTIVATION", 82.0, "CRITICAL", "Account dormant for 310 days suddenly received 8 high-value RTGS transfers.", "NCL-103"),
        ("ACC-3104", "COMPLAINT LINKED", 86.0, "CRITICAL", "Account linked to 5 cybercrime complaints across Karnataka and Telangana.", "NCL-102"),
        ("ACC-3105", "SHARED DEVICE NETWORK", 80.0, "HIGH", "Operated from device fingerprint shared with 6 flagged mule accounts.", "NCL-104"),
        ("ACC-3106", "CIRCULAR FLOW", 75.0, "HIGH", "Participates in closed triangular wash transactions: A -> B -> C -> A.", "NCL-101"),
        ("ACC-3107", "DISTRIBUTOR MULE", 83.0, "CRITICAL", "Bulk recipient fanning out micro-transfers to 24 separate digital wallets.", "NCL-105"),
        ("ACC-3108", "NETWORK INTERMEDIARY", 74.0, "HIGH", "High betweenness centrality bridging two disparate phishing syndicates.", "NCL-104"),
        ("ACC-3109", "CASH-OUT MULE", 81.0, "CRITICAL", "Frequent night-time ATM withdrawals and jewel-merchant POS debits right after credits.", "NCL-105"),
    ]

    for acc_id, m_type, r_score, r_lvl, reason, c_id in scenario_configs:
        sc_cust = Customer(
            customer_id=f"CUST-{acc_id}",
            name=fake.name(),
            email=fake.email(),
            national_id=f"AADHAR-{random.randint(1000,9999)}-{random.randint(1000,9999)}-{random.randint(1000,9999)}",
            occupation=random.choice(["Trader", "Student", "Unemployed", "Consultant", "Driver"]),
            risk_profile=r_lvl,
            city=random.choice(["Delhi", "Bengaluru", "Hyderabad", "Jaipur", "Kolkata"]),
            state="India"
        )
        db.add(sc_cust)
        sc_acc = Account(
            account_id=acc_id,
            customer_id=sc_cust.customer_id,
            account_number=f"SB-9100{random.randint(10000000, 99999999)}",
            account_type=random.choice(["SAVINGS", "CURRENT"]),
            bank_name=random.choice(banks),
            branch=f"{sc_cust.city} Main",
            balance=float(random.randint(5000, 85000)),
            opening_date=now - datetime.timedelta(days=random.randint(60, 365)),
            status="ACTIVE",
            risk_score=r_score,
            risk_level=r_lvl,
            mule_type=m_type,
            confidence=float(random.randint(88, 96)),
            behaviour_risk=round(r_score * random.uniform(0.9, 1.05), 1),
            network_risk=round(r_score * random.uniform(0.85, 1.02), 1),
            complaint_risk=round(r_score * random.uniform(0.8, 1.1), 1),
            flagged_reason=reason,
            cluster_id=c_id,
            last_active_at=now - datetime.timedelta(hours=random.randint(1, 24))
        )
        db.add(sc_acc)
        scenario_accounts.append(sc_acc)
        accounts.append(sc_acc)

        # Phone & Device for scenario account
        sc_phn = Phone(
            phone_id=f"PHN-{acc_id}",
            customer_id=sc_cust.customer_id,
            phone_number=f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
            is_shared=True if r_score >= 80 else False,
            carrier="Airtel",
            status="ACTIVE"
        )
        db.add(sc_phn)

        sc_dev = Device(
            device_id=f"DEV-{acc_id}",
            customer_id=sc_cust.customer_id,
            device_fingerprint=f"FP-{random.randint(1000,9999)}-{random.randint(100,999)}",
            device_type="MOBILE_ANDROID",
            ip_address=f"103.{random.randint(10,250)}.{random.randint(1,250)}.{random.randint(1,250)}",
            is_shared=True if r_score >= 80 else False,
            status="ACTIVE"
        )
        db.add(sc_dev)
    db.commit()

    # --- SEED REGULAR / NORMAL POPULATION (400 accounts) ---
    for i in range(1, 401):
        n_id = f"ACC-NORM-{i:04d}"
        n_cust = Customer(
            customer_id=f"CUST-NORM-{i:04d}",
            name=fake.name(),
            email=fake.email(),
            national_id=f"AADHAR-{random.randint(1000,9999)}-{random.randint(1000,9999)}-{random.randint(1000,9999)}",
            occupation=random.choice(["Software Engineer", "Teacher", "Physician", "Accountant", "Bank Officer", "Retail Merchant"]),
            risk_profile="LOW",
            city=random.choice(["Mumbai", "Bengaluru", "Chennai", "Delhi", "Pune", "Ahmedabad", "Kolkata"]),
            state="India"
        )
        db.add(n_cust)
        r_val = round(random.uniform(2.0, 24.0), 1)
        n_acc = Account(
            account_id=n_id,
            customer_id=n_cust.customer_id,
            account_number=f"SB-1000{random.randint(10000000, 99999999)}",
            account_type=random.choice(["SAVINGS", "CURRENT", "SALARY"]),
            bank_name=random.choice(banks),
            branch=f"{n_cust.city} Branch",
            balance=float(random.randint(15000, 350000)),
            opening_date=now - datetime.timedelta(days=random.randint(180, 1800)),
            status="ACTIVE",
            risk_score=r_val,
            risk_level="LOW",
            mule_type="NORMAL",
            confidence=round(random.uniform(92.0, 98.0), 1),
            behaviour_risk=round(r_val * random.uniform(0.8, 1.2), 1),
            network_risk=round(r_val * random.uniform(0.7, 1.1), 1),
            complaint_risk=0.0,
            flagged_reason=None,
            cluster_id=None,
            last_active_at=now - datetime.timedelta(days=random.randint(0, 5))
        )
        db.add(n_acc)
        accounts.append(n_acc)

        # Normal phone & device
        db.add(Phone(
            phone_id=f"PHN-NORM-{i:04d}",
            customer_id=n_cust.customer_id,
            phone_number=f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
            is_shared=False,
            carrier=random.choice(["Jio", "Airtel", "Vodafone Idea"]),
            status="ACTIVE"
        ))
        db.add(Device(
            device_id=f"DEV-NORM-{i:04d}",
            customer_id=n_cust.customer_id,
            device_fingerprint=f"FP-NORM-{uuid.uuid4().hex[:10]}",
            device_type=random.choice(["MOBILE_IOS", "MOBILE_ANDROID", "DESKTOP_MAC", "DESKTOP_WINDOWS"]),
            ip_address=f"49.{random.randint(10,250)}.{random.randint(1,250)}.{random.randint(1,250)}",
            is_shared=False,
            status="ACTIVE"
        ))
        db.add(UPI(
            upi_id=f"UPI-NORM-{i:04d}",
            account_id=n_id,
            vpa_handle=f"{n_cust.name.split()[0].lower()}.{random.randint(10,99)}@okhdfc",
            status="ACTIVE"
        ))
    db.commit()

    # --- SEED DEMO SCENARIO 1 TRANSACTIONS FOR ACC-2847 ---
    # Total flow: ~₹3,20,000 incoming from 6 victims
    # Outgoing: rapid pass-through to Mule B (ACC-7721) in < 10 mins
    # Mule B passes to Mule C (ACC-1029)
    # Mule C passes to Beneficiary (ACC-9904)
    transactions = []
    base_time = now - datetime.timedelta(hours=6)

    # Inflow from victims to ACC-2847
    cum_in = 0.0
    for idx, (v_acc, v_name, f_type, v_amt) in enumerate(victims):
        t_in_time = base_time + datetime.timedelta(minutes=idx * 25)
        tx_in = Transaction(
            transaction_id=f"TXN-VIC-{idx+1}-TO-2847",
            sender_account_id=v_acc.account_id,
            receiver_account_id=acc_hero.account_id,
            amount=v_amt,
            channel="UPI",
            timestamp=t_in_time,
            status="COMPLETED",
            description=f"Fund transfer ref: {f_type[:20]}",
            is_suspicious=True,
            scenario_tag="VICTIM_DEPOSIT"
        )
        db.add(tx_in)
        transactions.append(tx_in)
        cum_in += v_amt

        # RAPID PASS-THROUGH OUTFLOW (within 4-8 minutes of victim deposit!)
        t_out_time = t_in_time + datetime.timedelta(minutes=random.randint(4, 7), seconds=random.randint(10, 50))
        tx_out = Transaction(
            transaction_id=f"TXN-2847-TO-7721-HOP1-{idx+1}",
            sender_account_id=acc_hero.account_id,
            receiver_account_id=acc_mule_b.account_id,
            amount=round(v_amt * 0.95, 2),  # 95% passed through (mule cuts 5% commission)
            channel="IMPS",
            timestamp=t_out_time,
            status="COMPLETED",
            description=f"Rapid dispersion layer 1 to ACC-7721",
            is_suspicious=True,
            scenario_tag="PASS_THROUGH_MULE_HOP1"
        )
        db.add(tx_out)
        transactions.append(tx_out)

        # Hop 2: Mule B (ACC-7721) -> Mule C (ACC-1029) within 8 minutes
        t_hop2_time = t_out_time + datetime.timedelta(minutes=random.randint(6, 12))
        tx_hop2 = Transaction(
            transaction_id=f"TXN-7721-TO-1029-HOP2-{idx+1}",
            sender_account_id=acc_mule_b.account_id,
            receiver_account_id=acc_mule_c.account_id,
            amount=round(v_amt * 0.91, 2),
            channel="RTGS",
            timestamp=t_hop2_time,
            status="COMPLETED",
            description=f"Syndicate consolidation layer 2 to ACC-1029",
            is_suspicious=True,
            scenario_tag="LAYERING_HOP2"
        )
        db.add(tx_hop2)
        transactions.append(tx_hop2)

        # Hop 3: Mule C (ACC-1029) -> Beneficiary (ACC-9904)
        t_hop3_time = t_hop2_time + datetime.timedelta(minutes=random.randint(15, 25))
        tx_hop3 = Transaction(
            transaction_id=f"TXN-1029-TO-9904-HOP3-{idx+1}",
            sender_account_id=acc_mule_c.account_id,
            receiver_account_id=acc_beneficiary.account_id,
            amount=round(v_amt * 0.88, 2),
            channel="NEFT",
            timestamp=t_hop3_time,
            status="COMPLETED",
            description=f"Disbursement to gold merchant gateway ACC-9904",
            is_suspicious=True,
            scenario_tag="CASH_OUT_HOP3"
        )
        db.add(tx_hop3)
        transactions.append(tx_hop3)

    # 6 Linked Complaints for ACC-2847
    complaints = []
    police_stations = [
        "Cyber Crime Police Station, Bandra Kurla Complex, Mumbai",
        "Cyber Cell Pune Urban, Shivaji Nagar",
        "National Cyber Crime Reporting Portal (NCRP), New Delhi",
        "Cyber Crime Police Station, Bengaluru City",
        "CID Cyber Crime Cell, Hyderabad",
        "West Bengal Cyber Security Division, Kolkata"
    ]
    for idx, (v_acc, v_name, f_type, v_amt) in enumerate(victims):
        comp = Complaint(
            complaint_id=f"CMP-2026-MUM-{idx+1042}",
            reported_date=base_time + datetime.timedelta(hours=idx + 1),
            fraud_type=f_type,
            amount=v_amt,
            victim_name=v_name,
            victim_contact=f"+91 98{random.randint(10000000, 99999999)}",
            linked_account_id=acc_hero.account_id,
            channel="NCRP_PORTAL",
            status="UNDER_INVESTIGATION",
            police_station=police_stations[idx],
            acknowledgement_no=f"NCRP-2026-MH-{random.randint(100000, 999999)}",
            description=f"Victim reported fraudulent inducement via {f_type}. Funds routed to recipient account {acc_hero.account_number}."
        )
        db.add(comp)
        complaints.append(comp)

    # --- SEED SCENARIO 6: CIRCULAR FLOW (ACC-3106 -> ACC-3101 -> ACC-3102 -> ACC-3106) ---
    circ_time = now - datetime.timedelta(days=2)
    db.add(Transaction(
        transaction_id="TXN-CIRC-1",
        sender_account_id="ACC-3106",
        receiver_account_id="ACC-3101",
        amount=150000.0,
        channel="RTGS",
        timestamp=circ_time,
        status="COMPLETED",
        description="Wash trading cycle leg 1",
        is_suspicious=True,
        scenario_tag="CIRCULAR_FLOW"
    ))
    db.add(Transaction(
        transaction_id="TXN-CIRC-2",
        sender_account_id="ACC-3101",
        receiver_account_id="ACC-3102",
        amount=148500.0,
        channel="RTGS",
        timestamp=circ_time + datetime.timedelta(minutes=15),
        status="COMPLETED",
        description="Wash trading cycle leg 2",
        is_suspicious=True,
        scenario_tag="CIRCULAR_FLOW"
    ))
    db.add(Transaction(
        transaction_id="TXN-CIRC-3",
        sender_account_id="ACC-3102",
        receiver_account_id="ACC-3106",
        amount=147000.0,
        channel="RTGS",
        timestamp=circ_time + datetime.timedelta(minutes=32),
        status="COMPLETED",
        description="Wash trading cycle leg 3 (closed loop)",
        is_suspicious=True,
        scenario_tag="CIRCULAR_FLOW"
    ))

    # --- SEED SCENARIO 8: DISTRIBUTOR MULE (ACC-3107 distributes to 10 normal accounts) ---
    dist_time = now - datetime.timedelta(days=1)
    for i in range(1, 11):
        db.add(Transaction(
            transaction_id=f"TXN-DIST-{i}",
            sender_account_id="ACC-3107",
            receiver_account_id=f"ACC-NORM-{i:04d}",
            amount=random.choice([4900.0, 9500.0, 12000.0]),
            channel="UPI",
            timestamp=dist_time + datetime.timedelta(minutes=i * 3),
            status="COMPLETED",
            description=f"Micro fan-out distribution {i}",
            is_suspicious=True,
            scenario_tag="DISTRIBUTOR_MULE"
        ))

    # --- SEED SCENARIO 4: DORMANT ACTIVATION (ACC-3103 bursts) ---
    dorm_time = now - datetime.timedelta(hours=14)
    for i in range(1, 6):
        db.add(Transaction(
            transaction_id=f"TXN-DORM-{i}",
            sender_account_id=f"ACC-NORM-{i+20:04d}",
            receiver_account_id="ACC-3103",
            amount=random.uniform(45000.0, 95000.0),
            channel="IMPS",
            timestamp=dorm_time + datetime.timedelta(minutes=i * 12),
            status="COMPLETED",
            description=f"Sudden reactivation burst deposit {i}",
            is_suspicious=True,
            scenario_tag="DORMANT_ACTIVATION"
        ))

    # --- SEED ADDITIONAL COMPLAINTS FOR OTHER HIGH RISK ACCOUNTS ---
    for i, s_acc in enumerate(scenario_accounts):
        if s_acc.account_id != "ACC-2847":
            c_cnt = 3 if s_acc.risk_level == "CRITICAL" else 1
            for j in range(c_cnt):
                c_amt = random.randint(25000, 180000)
                f_tp = random.choice(fraud_types)
                db.add(Complaint(
                    complaint_id=f"CMP-2026-NAT-{i+1}{j+1}{random.randint(100,999)}",
                    reported_date=now - datetime.timedelta(days=random.randint(1, 20)),
                    fraud_type=f_tp,
                    amount=float(c_amt),
                    victim_name=fake.name(),
                    victim_contact=f"+91 98{random.randint(10000000, 99999999)}",
                    linked_account_id=s_acc.account_id,
                    channel="PORTAL",
                    status="UNDER_INVESTIGATION",
                    police_station="State Cyber Crime Police Station",
                    acknowledgement_no=f"NCRP-2026-IND-{random.randint(100000, 999999)}",
                    description=f"Victim filed formal complaint regarding {f_tp}. Funds traced to {s_acc.account_number}."
                ))

    # --- SEED NORMAL RANDOM TRANSACTIONS (2,000 transactions across normal population) ---
    normal_acc_ids = [f"ACC-NORM-{i:04d}" for i in range(1, 350)]
    for i in range(1, 2000):
        s_id = random.choice(normal_acc_ids)
        r_id = random.choice(normal_acc_ids)
        if s_id != r_id:
            db.add(Transaction(
                transaction_id=f"TXN-GEN-{i:05d}",
                sender_account_id=s_id,
                receiver_account_id=r_id,
                amount=round(random.uniform(150.0, 18500.0), 2),
                channel=random.choice(["UPI", "IMPS", "NEFT", "CARD"]),
                timestamp=now - datetime.timedelta(days=random.randint(0, 30), hours=random.randint(0, 23)),
                status="COMPLETED",
                description="Routine transfer / merchant payment",
                is_suspicious=False,
                scenario_tag="NORMAL"
            ))

    # --- SEED INVESTIGATION FOR ACC-2847 ---
    inv_hero = Investigation(
        investigation_id="INV-2026-00421",
        case_number="CASE MXL-2026-00421",
        title="High-Velocity Pass-Through Mule Syndicate (ACC-2847 / ShadowFlow)",
        subject_account_id=acc_hero.account_id,
        status="OPEN",
        priority="CRITICAL",
        investigator_name="Special Agent A. Roy / Financial Crimes Intelligence",
        summary="Automated escalation: Account exhibits 91.0/100 risk score, 6 linked National Cybercrime Portal reports, 4-minute pass-through velocity to downstream layering account ACC-7721, and shared hardware fingerprint with known cybercrime syndicate infrastructure.",
        created_at=now - datetime.timedelta(hours=4)
    )
    db.add(inv_hero)
    db.commit()

    # Notes for the investigation
    db.add(Note(
        note_id="NOTE-421-1",
        investigation_id=inv_hero.investigation_id,
        author="Analyst R. Varma",
        text="Preliminary review completed. Immediate fund freeze recommended under Sec 102 CrPC for balance and downstream hops.",
        created_at=now - datetime.timedelta(hours=3, minutes=45)
    ))
    db.add(Note(
        note_id="NOTE-421-2",
        investigation_id=inv_hero.investigation_id,
        author="Lead Inspector K. Nair",
        text="Subpoena served to telecom provider for IMSI/IMEI logs associated with mobile terminal FP-MUM-AND-8891-X17. Common device shared with ACC-7721 verified.",
        created_at=now - datetime.timedelta(hours=2, minutes=10)
    ))

    # Evidence items
    db.add(Evidence(
        evidence_id="EVD-421-1",
        investigation_id=inv_hero.investigation_id,
        evidence_type="TRANSACTION_CHAIN",
        entity_id="TXN-2847-TO-7721-HOP1-1",
        description="First hop transfer record showing ₹76,000 sent within 312 seconds of victim deposit.",
        added_at=now - datetime.timedelta(hours=3)
    ))
    db.add(Evidence(
        evidence_id="EVD-421-2",
        investigation_id=inv_hero.investigation_id,
        evidence_type="DEVICE_FINGERPRINT",
        entity_id="DEV-D17-HERO",
        description="Hardware fingerprint FP-MUM-AND-8891-X17 concurrently active across ACC-2847 and ACC-7721.",
        added_at=now - datetime.timedelta(hours=2, minutes=30)
    ))
    db.add(Evidence(
        evidence_id="EVD-421-3",
        investigation_id=inv_hero.investigation_id,
        evidence_type="CYBERCRIME_COMPLAINT",
        entity_id="CMP-2026-MUM-1042",
        description="Verified victim FIR report acknowledging ₹80,000 coerced transfer under impersonation threat.",
        added_at=now - datetime.timedelta(hours=2)
    ))

    # --- SEED ALERTS ---
    alerts_data = [
        ("ALT-8801", "RAPID PASS-THROUGH", "ACC-2847", "CRITICAL", "₹3.2L received from 6 complaint sources transferred out within avg 5.4 mins.", "NEW"),
        ("ALT-8802", "SHARED DEVICE DETECTED", "ACC-7721", "CRITICAL", "Hardware fingerprint FP-MUM-AND-8891-X17 concurrently bound to ACC-2847.", "REVIEWED"),
        ("ALT-8803", "DORMANT ACTIVATION", "ACC-3103", "HIGH", "Zero transactions for 310 days followed by 5 rapid high-ticket credits in 1 hour.", "NEW"),
        ("ALT-8804", "HIGH COMPLAINT LINKAGE", "ACC-3104", "CRITICAL", "5 distinct victim fraud complaints registered within 72 hours.", "INVESTIGATING"),
        ("ALT-8805", "CIRCULAR MONEY FLOW", "ACC-3106", "HIGH", "Closed-loop wash transaction identified across 3 accounts without economic substance.", "NEW"),
        ("ALT-8806", "DISTRIBUTOR FAN-OUT", "ACC-3107", "CRITICAL", "Account dispersed funds to 10 distinct recipient endpoints within 30 minutes.", "NEW"),
    ]
    for a_id, a_type, a_acc, a_sev, a_rsn, a_st in alerts_data:
        db.add(Alert(
            alert_id=a_id,
            alert_type=a_type,
            account_id=a_acc,
            severity=a_sev,
            reason=a_rsn,
            status=a_st,
            created_at=now - datetime.timedelta(hours=random.randint(1, 36))
        ))

    # --- AUDIT LOGS ---
    db.add(AuditLog(
        log_id="LOG-001",
        entity_type="ACCOUNT",
        entity_id="ACC-2847",
        action="RISK_EVALUATION_TRIGGERED",
        investigator="System AI Risk Engine",
        details="Automated recalculation triggered by NCRP complaint webhook CMP-2026-MUM-1047.",
        timestamp=now - datetime.timedelta(hours=5)
    ))
    db.add(AuditLog(
        log_id="LOG-002",
        entity_type="INVESTIGATION",
        entity_id="INV-2026-00421",
        action="CASE_OPENED",
        investigator="Special Agent A. Roy",
        details="Priority escalated to CRITICAL due to multi-hop syndicate correlation.",
        timestamp=now - datetime.timedelta(hours=4)
    ))

    # Update cluster statistics
    for cl in clusters:
        cl_accs = db.query(Account).filter(Account.cluster_id == cl.cluster_id).all()
        cl.account_count = len(cl_accs)
        # Calculate cluster complaints and flow
        acc_ids = [a.account_id for a in cl_accs]
        comp_count = db.query(Complaint).filter(Complaint.linked_account_id.in_(acc_ids)).count() if acc_ids else 0
        cl.complaint_count = comp_count
        cl.total_flow = 320000.0 if cl.cluster_id == "NCL-101" else float(random.randint(150000, 650000))

    db.commit()
    return {"status": "success", "message": "Synthetic dataset seeded successfully."}
