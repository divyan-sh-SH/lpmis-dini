from fastapi import APIRouter

from api.user_router import user_router
from api.group_router import group_router
from api.cart_router import cart_router
from api.transaction_router import transaction_router
from api.stock_router import stock_router
from api.chat_router import chat_router
from api.notes_router import notes_router
from api.habit_router import habit_router
from api.habit_log_router import habit_log_router
from api.todo_router import todo_router
from api.calendar_router import calendar_router


main_router = APIRouter(prefix="/homedash")

main_router.include_router(user_router)
main_router.include_router(group_router)
main_router.include_router(cart_router)
main_router.include_router(transaction_router)
main_router.include_router(stock_router)
main_router.include_router(chat_router)
main_router.include_router(notes_router)
main_router.include_router(habit_router)
main_router.include_router(habit_log_router)
main_router.include_router(todo_router)
main_router.include_router(calendar_router)

__all__ = ["main_router"]