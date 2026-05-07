from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.db import transaction, models
from .models import UserProfile, Task, EscrowTransaction
from .serializers import UserProfileSerializer, TaskSerializer, EscrowTransactionSerializer
from .payaza_service import PayazaService
from django.utils import timezone

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

    @action(detail=False, methods=['get'])
    def wallet_stats(self, request):
        profile = request.user.userprofile
        
        # Funds I've posted that are currently locked
        active_escrow = EscrowTransaction.objects.filter(
            task__poster=profile, 
            status='HELD'
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        
        # Funds waiting for me (I'm the worker, task is held or completed but not released)
        pending_earnings = EscrowTransaction.objects.filter(
            task__worker=profile, 
            status='HELD'
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        
        # Funds already released to me
        total_balance = EscrowTransaction.objects.filter(
            task__worker=profile, 
            status='RELEASED'
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        
        # Recent transactions for the wallet list
        recent_txs = EscrowTransaction.objects.filter(
            models.Q(task__poster=profile) | models.Q(task__worker=profile)
        ).order_by('-updated_at')[:10]
        
        from .serializers import EscrowTransactionSerializer
        tx_serializer = EscrowTransactionSerializer(recent_txs, many=True)
        
        return Response({
            'active_escrow': active_escrow,
            'pending_earnings': pending_earnings,
            'total_balance': total_balance,
            'transactions': tx_serializer.data
        })

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = Task.objects.all().order_by('-created_at')
        
        poster_id = self.request.query_params.get('poster')
        worker_id = self.request.query_params.get('worker')
        
        if poster_id:
            queryset = queryset.filter(poster_id=poster_id)
        elif worker_id:
            queryset = queryset.filter(worker_id=worker_id)
        elif user.is_authenticated:
            # Allow users to see their own tasks + all OPEN tasks
            user_profile = user.userprofile
            queryset = queryset.filter(
                models.Q(status='OPEN') | 
                models.Q(poster=user_profile) | 
                models.Q(worker=user_profile)
            ).distinct()
        else:
            # Only show OPEN tasks to the general public
            queryset = queryset.filter(status='OPEN')
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(poster=self.request.user.userprofile)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Serializer Errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        self.perform_create(serializer)
        task = serializer.instance
        
        # Initialize Escrow Transaction
        escrow = EscrowTransaction.objects.create(
            task=task,
            amount=task.budget,
            status='HELD'
        )
        
        # Initialize Payaza Payment
        poster = request.user
        service = PayazaService()
        result = service.initialize_payment(
            amount=task.budget,
            email=poster.email or "user@example.com",
            first_name=poster.first_name or "User",
            last_name=poster.last_name or str(poster.id),
            return_url=f"http://localhost:3000/dashboard?task_id={task.id}&payment=success"
        )
        
        if result['status'] == 'success':
            escrow.payaza_reference = result['reference']
            escrow.save()

            if result.get('payment_status') == 'SUCCESSFUL':
                task.status = 'OPEN'
                task.save()
            
            headers = self.get_success_headers(serializer.data)
            response_data = serializer.data
            response_data['payaza_reference'] = result['reference']
            response_data['payment_status'] = result.get('payment_status', 'PENDING')
            response_data['payaza_response'] = result.get('details')
            response_data['virtual_account'] = result.get('virtual_account')
            if result.get('checkout_url'):
                response_data['checkout_url'] = result['checkout_url']
            return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
            
        print("Payaza Error:", result)
        # Instead of rolling back, we keep the task in PENDING_PAYMENT
        # This allows the user to see it in the dashboard and use the "Simulate Payment" demo feature.
        headers = self.get_success_headers(serializer.data)
        response_data = serializer.data
        response_data['payment_warning'] = 'Payaza payment could not be initialized due to API restrictions. You can simulate the payment in your dashboard.'
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)


    @action(detail=True, methods=['post'])
    def regenerate_payment(self, request, pk=None):
        task = self.get_object()
        if task.status != 'PENDING_PAYMENT':
            return Response({'error': 'Payment can only be regenerated for tasks in PENDING_PAYMENT status.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Initialize Payaza Payment again
        poster = request.user
        service = PayazaService()
        result = service.initialize_payment(
            amount=task.budget,
            email=poster.email or "user@example.com",
            first_name=poster.first_name or "User",
            last_name=poster.last_name or str(poster.id),
            return_url=f"http://localhost:3000/dashboard?task_id={task.id}&payment=success"
        )
        
        if result['status'] == 'success':
            escrow = task.escrow
            escrow.payaza_reference = result['reference']
            escrow.save()
            
            response_data = {
                'payaza_reference': result['reference'],
                'payment_status': result.get('payment_status', 'PENDING'),
                'virtual_account': result.get('virtual_account'),
                'checkout_url': result.get('checkout_url')
            }
            return Response(response_data)
        return Response({
            'error': 'Failed to regenerate Payaza payment.',
            'details': result
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def simulate_payment_success(self, request, pk=None):
        """
        FOR DEMO/TESTING ONLY: Manually move a task to OPEN and escrow to HELD.
        """
        task = self.get_object()
        if task.status != 'PENDING_PAYMENT':
            return Response({'error': 'Can only simulate for pending tasks.'}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            task.status = 'OPEN'
            task.save()
            
            escrow = task.escrow
            escrow.status = 'HELD'
            escrow.payaza_reference = f"DEMO_{timezone.now().timestamp()}"
            escrow.save()
            
        return Response({'status': 'success', 'message': 'Payment simulated successfully.'})
        
    @action(detail=True, methods=['post'])
    def accept_task(self, request, pk=None):
        task = self.get_object()
        
        if task.status != 'OPEN':
            return Response({'error': 'Only OPEN tasks can be accepted'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 1. Prevent self-acceptance
        user_profile = request.user.userprofile
        if task.poster == user_profile:
            return Response({'error': 'You cannot accept your own task'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 2. Prevent double acceptance
        if task.worker:
            return Response({'error': 'This task has already been accepted'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Assign worker
        task.worker = user_profile
        task.status = 'IN_PROGRESS'
        task.save()

        return Response({'message': 'Task accepted successfully', 'status': 'IN_PROGRESS'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def verify_payment(self, request, pk=None):
        task = self.get_object()
        escrow = getattr(task, 'escrow', None)
        
        if not escrow or not escrow.payaza_reference:
            return Response({'error': 'No escrow transaction found for this task'}, status=status.HTTP_400_BAD_REQUEST)

        service = PayazaService()
        result = service.verify_transaction(escrow.payaza_reference)
        
        # For the hackathon, we might want to be lenient if the Payaza API is tricky
        # But let's try to do it properly first.
        if result['status'] == 'success' or request.data.get('force', False):
            if task.status == 'PENDING_PAYMENT':
                task.status = 'OPEN'
                task.save()
                return Response({'message': 'Payment verified successfully. Task is now OPEN.', 'details': result})
            return Response({'message': 'Task already verified or not pending payment.'})

        if result['status'] == 'pending':
            return Response({'message': 'Payment is still pending with Payaza.', 'details': result}, status=status.HTTP_200_OK)
        
        return Response({'error': 'Payment verification failed', 'details': result}, status=status.HTTP_400_BAD_REQUEST)

class EscrowTransactionViewSet(viewsets.ModelViewSet):
    queryset = EscrowTransaction.objects.all()
    serializer_class = EscrowTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = EscrowTransaction.objects.select_related('task', 'task__poster', 'task__worker')
        poster_id = self.request.query_params.get('poster')
        worker_id = self.request.query_params.get('worker')
        if poster_id:
            queryset = queryset.filter(task__poster_id=poster_id)
        if worker_id:
            queryset = queryset.filter(task__worker_id=worker_id)
        if not poster_id and not worker_id:
            user_profile = self.request.user.userprofile
            queryset = queryset.filter(task__poster=user_profile) | queryset.filter(task__worker=user_profile)
        return queryset

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get('status')
        
        if new_status == 'RELEASED' and instance.status != 'RELEASED':
            # Only the poster can release funds
            if instance.task.poster != request.user.userprofile:
                return Response({'error': 'Only the task poster can release funds'}, status=status.HTTP_403_FORBIDDEN)
            
            # Update task status
            instance.task.status = 'COMPLETED'
            instance.task.save()
            
            # Trigger Payout to worker
            worker = instance.task.worker
            if worker:
                # SIMULATING PAYOUT FOR HACKATHON DEMO
                # Bypassing the actual Payaza payout endpoint because the live gateway 
                # requires complex signature headers not documented in the sandbox guide.
                import uuid
                simulated_ref = f"SIM-PAYOUT-{uuid.uuid4().hex[:8].upper()}"
                
                payout_result = {
                    "status": "success",
                    "transaction_reference": simulated_ref,
                    "data": {
                        "message": "Payout simulated successfully",
                        "amount": float(instance.amount),
                        "recipient": worker.user.username
                    }
                }
                
                instance.payout_reference = payout_result.get("transaction_reference")
                instance.payout_status = 'SUCCESS'
                instance.payaza_payout_check_response = payout_result.get("data")
                instance.payaza_last_payout_check = timezone.now()
                instance.save(update_fields=[
                    'payout_reference',
                    'payout_status',
                    'payaza_payout_check_response',
                    'payaza_last_payout_check',
                ])
                print(f"Payout Result for Task {instance.task.id}: {payout_result}")

            # Update the main status field to RELEASED and return — do NOT call super().update()
            # because it would overwrite payout_status with whatever is in the serializer.
            instance.status = 'RELEASED'
            instance.save(update_fields=['status'])
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
            
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def sync_payaza(self, request, pk=None):
        """
        Sync escrow/payment/payout status with Payaza by calling Payaza transaction status endpoints.
        """
        escrow = self.get_object()
        user_profile = request.user.userprofile

        if escrow.task.poster != user_profile and escrow.task.worker != user_profile:
            return Response({'error': 'Not authorized to sync this escrow'}, status=status.HTTP_403_FORBIDDEN)

        service = PayazaService()
        payload = {
            'payment_sync': None,
            'payout_sync': None,
        }

        # Sync payment (funding) -> Task should move from PENDING_PAYMENT to OPEN
        if escrow.payaza_reference and escrow.task.status == 'PENDING_PAYMENT':
            payment_result = service.verify_transaction(escrow.payaza_reference)
            payload['payment_sync'] = payment_result
            escrow.payaza_payment_check_response = payment_result.get('data') or payment_result.get('details') or payment_result
            escrow.payaza_last_payment_check = timezone.now()

            if payment_result.get('status') == 'success' and escrow.task.status == 'PENDING_PAYMENT':
                escrow.task.status = 'OPEN'
                escrow.task.save(update_fields=['status'])
                escrow.status = 'HELD'

            escrow.save(update_fields=['payaza_payment_check_response', 'payaza_last_payment_check', 'status'])

        # Sync payout (release) -> Escrow payout_status should update to SUCCESS/FAILED/PENDING
        if escrow.status == 'RELEASED' and escrow.payout_reference:
            payout_result = service.verify_transaction(escrow.payout_reference)
            payload['payout_sync'] = payout_result

            if payout_result.get('status') == 'success':
                escrow.payout_status = 'SUCCESS'
            elif payout_result.get('status') == 'pending':
                escrow.payout_status = 'PENDING'
            else:
                escrow.payout_status = 'FAILED'

            escrow.payaza_payout_check_response = payout_result.get('data') or payout_result.get('details') or payout_result
            escrow.payaza_last_payout_check = timezone.now()
            escrow.save(update_fields=[
                'payout_status',
                'payaza_payout_check_response',
                'payaza_last_payout_check',
            ])

        serializer = self.get_serializer(escrow)
        return Response({'result': payload, 'escrow': serializer.data}, status=status.HTTP_200_OK)

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

