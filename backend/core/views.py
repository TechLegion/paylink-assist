from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from .models import UserProfile, Task, EscrowTransaction
from .serializers import UserProfileSerializer, TaskSerializer, EscrowTransactionSerializer
from .payaza_service import PayazaService

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        first_name = request.data.get('first_name', '')
        
        if not username or not password:
            return Response({'error': 'Please provide username and password'}, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name
        )
        UserProfile.objects.create(user=user, bio="New user", is_verified=False)
        
        return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer

    @action(detail=True, methods=['post'])
    def fund_task(self, request, pk=None):
        task = self.get_object()
        task.status = 'IN_PROGRESS'
        task.save()

        escrow, created = EscrowTransaction.objects.get_or_create(
            task=task,
            defaults={'amount': task.budget, 'status': 'HELD'}
        )

        poster = task.poster.user
        service = PayazaService()
        result = service.initialize_payment(
            amount=escrow.amount,
            email=poster.email or "user@example.com",
            first_name=poster.first_name or "Alex",
            last_name=poster.last_name or "Thompson",
            return_url=f"http://localhost:3000/dashboard"
        )

        escrow.payaza_reference = result['reference']
        escrow.save()

        return Response(result, status=status.HTTP_200_OK)

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

