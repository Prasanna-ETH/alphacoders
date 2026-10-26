import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(128), nullable=True)
    national_id = Column(String(64), nullable=True, index=True)
    occupation = Column(String(64), nullable=True)
    income_range = Column(String(64), nullable=True)
    risk_profile = Column(String(32), default="LOW")
    address = Column(String(256), nullable=True)
    city = Column(String(64), nullable=True)
    state = Column(String(64), nullable=True)
    postal_code = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    accounts = relationship("Account", back_populates="customer")
    phones = relationship("Phone", back_populates="customer")
    devices = relationship("Device", back_populates="customer")

class Account(Base):
    __tablename__ = "accounts"

    account_id = Column(String(64), primary_key=True, index=True)
    customer_id = Column(String(64), ForeignKey("customers.customer_id"), nullable=False, index=True)
    account_number = Column(String(32), unique=True, index=True, nullable=False)
    account_type = Column(String(32), default="SAVINGS")
    bank_name = Column(String(64), default="Federal Sentinel Bank")
    branch = Column(String(64), default="Metro Branch")
    balance = Column(Float, default=0.0)
    opening_date = Column(DateTime, nullable=False)
    status = Column(String(32), default="ACTIVE")
    kyc_status = Column(String(32), default="VERIFIED")
    
    # Risk & Mule Features
    risk_score = Column(Float, default=0.0, index=True)
    risk_level = Column(String(32), default="LOW", index=True)
    mule_type = Column(String(64), default="NORMAL", index=True)
    confidence = Column(Float, default=0.0)
    behaviour_risk = Column(Float, default=0.0)
    network_risk = Column(Float, default=0.0)
    complaint_risk = Column(Float, default=0.0)
    flagged_reason = Column(Text, nullable=True)
    cluster_id = Column(String(64), ForeignKey("network_clusters.cluster_id"), nullable=True, index=True)
    
    last_active_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="accounts")
    cluster = relationship("NetworkCluster", back_populates="accounts")
    sent_transactions = relationship("Transaction", foreign_keys="Transaction.sender_account_id", back_populates="sender_account")
    received_transactions = relationship("Transaction", foreign_keys="Transaction.receiver_account_id", back_populates="receiver_account")
    complaints = relationship("Complaint", back_populates="account")
    upi_ids = relationship("UPI", back_populates="account")
    investigations = relationship("Investigation", back_populates="account")
    alerts = relationship("Alert", back_populates="account")

class Phone(Base):
    __tablename__ = "phones"

    phone_id = Column(String(64), primary_key=True, index=True)
    customer_id = Column(String(64), ForeignKey("customers.customer_id"), nullable=False, index=True)
    phone_number = Column(String(32), index=True, nullable=False)
    is_shared = Column(Boolean, default=False)
    carrier = Column(String(32), nullable=True)
    status = Column(String(32), default="ACTIVE")

    customer = relationship("Customer", back_populates="phones")

class Device(Base):
    __tablename__ = "devices"

    device_id = Column(String(64), primary_key=True, index=True)
    customer_id = Column(String(64), ForeignKey("customers.customer_id"), nullable=False, index=True)
    device_fingerprint = Column(String(64), index=True, nullable=False)
    device_type = Column(String(32), default="MOBILE_ANDROID")
    ip_address = Column(String(64), nullable=True)
    is_shared = Column(Boolean, default=False)
    status = Column(String(32), default="ACTIVE")

    customer = relationship("Customer", back_populates="devices")

class UPI(Base):
    __tablename__ = "upi_ids"

    upi_id = Column(String(64), primary_key=True, index=True)
    account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=False, index=True)
    vpa_handle = Column(String(128), index=True, nullable=False)
    status = Column(String(32), default="ACTIVE")

    account = relationship("Account", back_populates="upi_ids")

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String(64), primary_key=True, index=True)
    sender_account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=False, index=True)
    receiver_account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=False, index=True)
    amount = Column(Float, nullable=False, index=True)
    channel = Column(String(32), default="UPI", index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    status = Column(String(32), default="COMPLETED")
    description = Column(String(256), nullable=True)
    is_suspicious = Column(Boolean, default=False, index=True)
    scenario_tag = Column(String(64), nullable=True)

    sender_account = relationship("Account", foreign_keys=[sender_account_id], back_populates="sent_transactions")
    receiver_account = relationship("Account", foreign_keys=[receiver_account_id], back_populates="received_transactions")

class Complaint(Base):
    __tablename__ = "complaints"

    complaint_id = Column(String(64), primary_key=True, index=True)
    reported_date = Column(DateTime, nullable=False, index=True)
    fraud_type = Column(String(64), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    victim_name = Column(String(128), nullable=False)
    victim_contact = Column(String(64), nullable=True)
    linked_account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=False, index=True)
    channel = Column(String(32), default="CYBER_PORTAL")
    status = Column(String(32), default="UNDER_INVESTIGATION")
    police_station = Column(String(128), nullable=True)
    acknowledgement_no = Column(String(64), unique=True, index=True, nullable=True)
    description = Column(Text, nullable=True)

    account = relationship("Account", back_populates="complaints")

class NetworkCluster(Base):
    __tablename__ = "network_clusters"

    cluster_id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    risk_level = Column(String(32), default="HIGH", index=True)
    cluster_type = Column(String(64), default="SHARED_INFRASTRUCTURE")
    account_count = Column(Integer, default=0)
    total_flow = Column(Float, default=0.0)
    complaint_count = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    accounts = relationship("Account", back_populates="cluster")

class Investigation(Base):
    __tablename__ = "investigations"

    investigation_id = Column(String(64), primary_key=True, index=True)
    case_number = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(256), nullable=False)
    subject_account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=False, index=True)
    status = Column(String(32), default="OPEN", index=True)
    priority = Column(String(32), default="CRITICAL", index=True)
    investigator_name = Column(String(128), default="Special Agent / Analyst")
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    account = relationship("Account", back_populates="investigations")
    notes = relationship("Note", back_populates="investigation", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="investigation", cascade="all, delete-orphan")

class Note(Base):
    __tablename__ = "notes"

    note_id = Column(String(64), primary_key=True, index=True)
    investigation_id = Column(String(64), ForeignKey("investigations.investigation_id"), nullable=False, index=True)
    author = Column(String(128), default="Analyst")
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    investigation = relationship("Investigation", back_populates="notes")

class Evidence(Base):
    __tablename__ = "evidence"

    evidence_id = Column(String(64), primary_key=True, index=True)
    investigation_id = Column(String(64), ForeignKey("investigations.investigation_id"), nullable=False, index=True)
    evidence_type = Column(String(64), nullable=False)
    entity_id = Column(String(64), nullable=False)
    description = Column(Text, nullable=False)
    added_at = Column(DateTime, default=datetime.datetime.utcnow)

    investigation = relationship("Investigation", back_populates="evidence_items")

class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(String(64), primary_key=True, index=True)
    alert_type = Column(String(64), nullable=False, index=True)
    account_id = Column(String(64), ForeignKey("accounts.account_id"), nullable=False, index=True)
    severity = Column(String(32), default="CRITICAL", index=True)
    reason = Column(Text, nullable=False)
    status = Column(String(32), default="NEW", index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    account = relationship("Account", back_populates="alerts")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(String(64), primary_key=True, index=True)
    entity_type = Column(String(64), nullable=False)
    entity_id = Column(String(64), nullable=False)
    action = Column(String(64), nullable=False)
    investigator = Column(String(128), default="Analyst")
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
