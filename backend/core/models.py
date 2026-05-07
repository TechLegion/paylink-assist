from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_verified = models.BooleanField(default=False)
    bio = models.TextField(blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    reviews_count = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"

class Task(models.Model):
    URGENCY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING_PAYMENT', 'Pending Payment'),
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)
    urgency = models.CharField(max_length=10, choices=URGENCY_CHOICES, default='LOW')
    budget = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    location = models.CharField(max_length=255, blank=True, null=True)
    
    poster = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='posted_tasks')
    worker = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='accepted_tasks')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING_PAYMENT')
    completion_note = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class EscrowTransaction(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Payment Pending'),
        ('HELD', 'Held in Escrow'),
        ('RELEASED', 'Released to Worker'),
        ('REFUNDED', 'Refunded to Poster'),
        ('DISPUTED', 'In Dispute'),
    ]

    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name='escrow')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    payaza_reference = models.CharField(max_length=100, blank=True, null=True)

    # Payaza payout tracking (verification is done by calling Payaza transaction status endpoints).
    payout_reference = models.CharField(max_length=100, blank=True, null=True)
    payout_status = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        default='PENDING',
    )
    payaza_payment_check_response = models.JSONField(blank=True, null=True)
    payaza_payout_check_response = models.JSONField(blank=True, null=True)
    payaza_last_payment_check = models.DateTimeField(blank=True, null=True)
    payaza_last_payout_check = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Escrow for {self.task.title} - {self.status}"
