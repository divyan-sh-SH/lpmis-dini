"""add_habit_habitlog_todo_calendar_tables

Revision ID: 079b106a99e0
Revises:
Create Date: 2026-08-29 16:44:20.018919

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '079b106a99e0'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'homedash_habit',
        sa.Column('habit_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('frequency', sa.String(length=20), nullable=False),
        sa.Column('target_value', sa.Integer(), nullable=True),
        sa.Column('unit', sa.String(length=30), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('group_id', sa.UUID(), nullable=True),
        sa.CheckConstraint(
            '(user_id IS NOT NULL AND group_id IS NULL) OR (user_id IS NULL AND group_id IS NOT NULL)',
            name='check_owner_exists_habit',
        ),
        sa.ForeignKeyConstraint(['group_id'], ['homedash_group.group_id']),
        sa.ForeignKeyConstraint(['user_id'], ['homedash_user.user_id']),
        sa.PrimaryKeyConstraint('habit_id'),
    )

    op.create_table(
        'homedash_habit_log',
        sa.Column('log_id', sa.UUID(), nullable=False),
        sa.Column('habit_id', sa.UUID(), nullable=False),
        sa.Column('date', sa.String(length=10), nullable=False),
        sa.Column('completed', sa.Boolean(), nullable=False),
        sa.Column('value', sa.Integer(), nullable=True),
        sa.Column('logged_at', sa.TIMESTAMP(), nullable=False),
        sa.ForeignKeyConstraint(['habit_id'], ['homedash_habit.habit_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('log_id'),
        sa.UniqueConstraint('habit_id', 'date', name='uq_habit_log_habit_date'),
    )

    op.create_table(
        'homedash_todo',
        sa.Column('todo_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('due_date', sa.String(length=10), nullable=True),
        sa.Column('priority', sa.String(length=10), nullable=False),
        sa.Column('completed', sa.Boolean(), nullable=False),
        sa.Column('completed_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('group_id', sa.UUID(), nullable=True),
        sa.CheckConstraint(
            '(user_id IS NOT NULL AND group_id IS NULL) OR (user_id IS NULL AND group_id IS NOT NULL)',
            name='check_owner_exists_todo',
        ),
        sa.ForeignKeyConstraint(['group_id'], ['homedash_group.group_id']),
        sa.ForeignKeyConstraint(['user_id'], ['homedash_user.user_id']),
        sa.PrimaryKeyConstraint('todo_id'),
    )

    op.create_table(
        'homedash_calendar',
        sa.Column('event_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('date', sa.String(length=10), nullable=False),
        sa.Column('time_start', sa.String(length=5), nullable=True),
        sa.Column('time_end', sa.String(length=5), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        sa.Column('group_id', sa.UUID(), nullable=True),
        sa.CheckConstraint(
            '(user_id IS NOT NULL AND group_id IS NULL) OR (user_id IS NULL AND group_id IS NOT NULL)',
            name='check_owner_exists_calendar',
        ),
        sa.ForeignKeyConstraint(['group_id'], ['homedash_group.group_id']),
        sa.ForeignKeyConstraint(['user_id'], ['homedash_user.user_id']),
        sa.PrimaryKeyConstraint('event_id'),
    )


def downgrade() -> None:
    op.drop_table('homedash_habit_log')
    op.drop_table('homedash_habit')
    op.drop_table('homedash_todo')
    op.drop_table('homedash_calendar')
