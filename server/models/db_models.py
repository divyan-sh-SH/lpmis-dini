from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import UUID, Column, Integer, String, Float, Text, TIMESTAMP, BigInteger, ForeignKey, Enum, CheckConstraint
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime
import uuid
from constants import UserRole

Base = declarative_base()

# Define User model here
class User(Base):
    __tablename__ = "homedash_user"
    
    user_id = Column(BigInteger, primary_key=True)
    username = Column(String(50), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    otp = Column(Integer, nullable=False)
    
    __table_args__ = (
        CheckConstraint("user_id >= 1000000000 AND user_id <= 9999999999", name="check_user_id_range"),
        CheckConstraint("otp >= 1000 AND otp <= 9999", name="check_otp_range"),
    )

class Group(Base):
    __tablename__ = "homedash_group"
    
    group_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    users = Column(ARRAY(BigInteger), nullable=False)  # Array of user IDs
    group_name = Column(String(100), nullable=False)
    created_on = Column(TIMESTAMP, default=datetime.utcnow)
    created_by = Column(BigInteger, ForeignKey("homedash_user.user_id"), nullable=False)

class Stock(Base):
    __tablename__ = "homedash_stock"
    
    stock_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(BigInteger, ForeignKey("homedash_user.user_id"), nullable=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("homedash_group.group_id"), nullable=True)
    stock_item = Column(String, nullable=False)
    quantity = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    
    __table_args__ = (
        CheckConstraint(
            "(user_id IS NOT NULL AND group_id IS NULL) OR (user_id IS NULL AND group_id IS NOT NULL)",
            name="check_owner_exists_stock"
        ),
    )

class Cart(Base):
    __tablename__ = "homedash_cart"
    
    cart_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(BigInteger, ForeignKey("homedash_user.user_id"), nullable=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("homedash_group.group_id"), nullable=True)
    stock_item = Column(String, nullable=False)
    store_name = Column(String, nullable=True)
    quantity = Column(String, nullable=True)
    cost = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    
    __table_args__ = (
        CheckConstraint(
            "(user_id IS NOT NULL AND group_id IS NULL) OR (user_id IS NULL AND group_id IS NOT NULL)",
            name="check_owner_exists_cart"
        ),
    )

class Transaction(Base):
    __tablename__ = "homedash_transaction"
    
    transaction_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(BigInteger, ForeignKey("homedash_user.user_id"), nullable=True)
    group_id = Column(UUID(as_uuid=True), ForeignKey("homedash_group.group_id"), nullable=True)
    date = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    
    __table_args__ = (
        CheckConstraint(
            "(user_id IS NOT NULL AND group_id IS NULL) OR (user_id IS NULL AND group_id IS NOT NULL)",
            name="check_owner_exists_transaction"
        ),
    )