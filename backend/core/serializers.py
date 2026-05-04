from rest_framework import serializers
from .models import UserProfile, Task, EscrowTransaction

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'is_verified', 'bio', 'rating', 'reviews_count']

class EscrowTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EscrowTransaction
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    poster_details = UserProfileSerializer(source='poster', read_only=True)
    worker_details = UserProfileSerializer(source='worker', read_only=True)
    escrow = EscrowTransactionSerializer(read_only=True)

    class Meta:
        model = Task
        fields = '__all__'
