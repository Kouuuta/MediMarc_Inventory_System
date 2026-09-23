from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Category, Customer, CustomUser, Product, Sale


class UserSerializer(serializers.ModelSerializer):
    user_type_display = serializers.SerializerMethodField()  

    class Meta:
        model = CustomUser
        fields = ["id", "username", "email", "first_name", "last_name", "user_type", "user_type_display"]

    def get_user_type_display(self, obj):
        """ Return correct user type name for frontend display """
        if obj.is_superuser:
            return "SUPER ADMIN"
        return dict(CustomUser.USER_TYPES).get(obj.user_type, "USER")


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'user_type_display': self.user.get_user_type_display()
        }
        return data

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category', read_only=True)  # ✅ Ensures correct display
    product_id = serializers.IntegerField(read_only=True)
    shipment_date = serializers.DateField(required=False)
    

    class Meta:
        model = Product
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class SaleSerializer(serializers.ModelSerializer):
    status = serializers.CharField(required=True)  
    date = serializers.DateField() 
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    product_id = serializers.IntegerField(source="product.product_id", read_only=True) 
    product_name = serializers.CharField(source="product.product_name", read_only=True)
    item_code = serializers.CharField(source="product.item_code", read_only=True)
    selling_price = serializers.DecimalField(
        source="product.selling_price", read_only=True, max_digits=10, decimal_places=2
    )
    lot_number = serializers.CharField(source="product.lot_number", read_only=True)
    expiration_date = serializers.DateField(source="product.expiration_date", read_only=True)

    class Meta:
        model = Sale
        fields = ["invoice_number","id", "customer", "customer_name", "product", "product_id", "product_name",
                  "item_code", "lot_number", "expiration_date", "quantity", "selling_price", "total", "date", "status"]
