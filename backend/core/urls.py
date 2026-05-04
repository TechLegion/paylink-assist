from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserProfileViewSet, TaskViewSet, EscrowTransactionViewSet

router = DefaultRouter()
router.register(r'profiles', UserProfileViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'escrows', EscrowTransactionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
