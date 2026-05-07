from rest_framework import serializers
from .models import UserProfile, Task, EscrowTransaction

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'is_verified', 'bio', 'rating', 'reviews_count']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        username = user_data.get('username')
        if username:
            instance.user.username = username
            instance.user.save()
        
        instance.bio = validated_data.get('bio', instance.bio)
        instance.save()
        return instance

class EscrowTransactionSerializer(serializers.ModelSerializer):
    task_details = serializers.SerializerMethodField()

    class Meta:
        model = EscrowTransaction
        fields = '__all__'

    def get_task_details(self, obj):
        return {
            'id': obj.task.id,
            'title': obj.task.title,
            'description': obj.task.description,
            'status': obj.task.status,
            'category': obj.task.category,
            'created_at': obj.task.created_at,
        }

class TaskSerializer(serializers.ModelSerializer):
    poster_details = UserProfileSerializer(source='poster', read_only=True)
    worker_details = UserProfileSerializer(source='worker', read_only=True)
    escrow = EscrowTransactionSerializer(read_only=True)

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['poster', 'worker']
