from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import UserProfile, Task, EscrowTransaction
from .serializers import UserProfileSerializer, TaskSerializer, EscrowTransactionSerializer
from .payaza_service import PayazaService

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer

class EscrowTransactionViewSet(viewsets.ModelViewSet):
    queryset = EscrowTransaction.objects.all()
    serializer_class = EscrowTransactionSerializer

    @action(detail=True, methods=['post'])
    def fund(self, request, pk=None):
        """
        Calls Payaza to fund the escrow transaction.
        """
        escrow = self.get_object()
        task = escrow.task
        poster = task.poster.user

        service = PayazaService()
        result = service.initialize_payment(
            amount=escrow.amount,
            email=poster.email or "user@example.com",
            first_name=poster.first_name or "Alex",
            last_name=poster.last_name or "Thompson",
            return_url=f"http://localhost:3000/dashboard?ref={escrow.id}"
        )

        escrow.payaza_reference = result['reference']
        escrow.save()

        return Response(result, status=status.HTTP_200_OK)

