from fastapi import APIRouter

from api.user_router import user_router
from api.group_router import group_router
from api.cart_router import cart_router
from api.transaction_router import transaction_router
from api.stock_router import stock_router
from api.chat_router import chat_router
from api.journal_router import journal_router


main_router = APIRouter(prefix="/homedash")

main_router.include_router(user_router)
main_router.include_router(group_router)
main_router.include_router(cart_router)
main_router.include_router(transaction_router)
main_router.include_router(stock_router)
main_router.include_router(chat_router)
main_router.include_router(journal_router)

__all__ = ["main_router"]