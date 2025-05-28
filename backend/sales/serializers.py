from rest_framework import serializers
from .models import Sale, SaleNote
from django.contrib.auth import get_user_model
from customers.models import Customer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'full_name']
    
    def get_full_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.email

class SaleNoteSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    created_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M")
    
    class Meta:
        model = SaleNote
        fields = ['id', 'content', 'author', 'created_at', 'is_update']
        read_only_fields = ['author', 'created_at']

class SaleSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)
    updated_at = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)
    expected_close_date = serializers.DateField(format="%Y-%m-%d", required=False, allow_null=True)
    notes = SaleNoteSerializer(many=True, read_only=True)
    
    # Add related fields
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    customer_details = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    priority_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Sale
        fields = '__all__'
        extra_kwargs = {
            'title': {'required': True},
            'customer': {'required': True},
            'status': {'required': False},
            'amount': {'required': False},
            'priority': {'required': False},
            'assigned_to': {'required': False}, 
        }
    
    def get_customer_details(self, obj):
        if obj.customer:
            return {
                'id': obj.customer.id,
                'name': obj.customer.name,
                'email': obj.customer.email,
                'company': obj.customer.company,
            }
        return None
    
    def get_status_display(self, obj):
        for status_code, status_name in Sale.STATUS_CHOICES:
            if obj.status == status_code:
                return status_name
        return obj.status
    
    def get_priority_display(self, obj):
        for priority_code, priority_name in Sale.PRIORITY_CHOICES:
            if obj.priority == priority_code:
                return priority_name
        return obj.priority
        
    def validate_customer(self, value):
        """
        Check that the customer exists
        """
        if not value:
            raise serializers.ValidationError("Customer is required")
        
        try:
            Customer.objects.get(pk=value.id)
        except Customer.DoesNotExist:
            raise serializers.ValidationError("Selected customer does not exist")
        return value 