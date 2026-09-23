import csv
import logging
from datetime import timedelta
from io import BytesIO
from pathlib import Path

from django.conf import settings
from django.contrib.auth import logout
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Count, F, Max, Sum
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from easyaudit.models import CRUDEvent
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Category, Customer, CustomUser, Product, Sale
from .serializers import (
    CategorySerializer,
    CustomerSerializer,
    LoginSerializer,
    ProductSerializer,
    SaleSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_critical_stock(request, product_id):
    """Update critical stock value for a product."""
    try:
        product = Product.objects.get(product_id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

    critical_stock = request.data.get("critical_stock")

    if critical_stock is None or critical_stock == '':
        return Response({"error": "Critical stock value is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Ensure the critical stock is a valid number
        critical_stock = int(critical_stock)
    except ValueError:
        return Response({"error": "Critical stock must be a valid number"}, status=status.HTTP_400_BAD_REQUEST)

    # Save the updated critical stock value
    product.critical_stock = critical_stock
    product.save()

    return Response({"message": "Critical stock updated successfully"}, status=status.HTTP_200_OK)

class ActivityLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        events = CRUDEvent.objects.select_related('user', 'content_type') \
            .exclude(content_type__model__in=["outstandingtoken", "blacklistedtoken", "token"]) \
            .order_by('-datetime')[:100]

        action_map = {
            1: "Created",
            2: "Updated",
            3: "Deleted",
            
        }

        data = []
        for event in events:
            user = event.user
            data.append({
                "id": event.id,
                "username": user.username if user else "Login",
                "role": user.get_user_type_display() if user else "Success",
                "action": action_map.get(event.event_type, "Unknown"),
                "page": event.content_type.model.replace("_", " ").title(),
                "timestamp": event.datetime.isoformat(),
            })

        return Response(data)

    
class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """Logout user, destroy session, and blacklist JWT token"""

    # Destroy session
    logout(request)

    # Blacklist token (Only works if SimpleJWT's blacklist app is enabled)
    try:
        refresh_token = request.data.get("refresh")
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()  # ✅ Add token to blacklist (Requires SimpleJWT blacklist enabled)
    except Exception as e:
        return Response(
            {"error": "Failed to blacklist token"}, status=status.HTTP_400_BAD_REQUEST
        )

    return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_users(request):
    """Fetch all users including user type"""
    users = (
        CustomUser.objects.all()
    )  # Make sure you use `CustomUser` if using a custom model
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def register(request):
    """Allow superusers and admin user types to create new users"""

    if not (request.user.is_superuser or request.user.user_type == "ADMIN"):
        return Response(
            {"error": "Only admins can add users."}, status=status.HTTP_403_FORBIDDEN
        )

    user_type = request.data.get("user_type", "USER").upper()
    if user_type not in ["ADMIN", "USER"]:
        return Response(
            {"error": "Invalid user type"}, status=status.HTTP_400_BAD_REQUEST
        )

    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        new_user = serializer.save()
        new_user.set_password(request.data["password"])
        new_user.save()
        return Response(
            {"message": "User created successfully", "data": serializer.data},
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get("email", "").strip()

    if not email:
        return Response(
            {"error": "No email address provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = CustomUser.objects.get(email=email)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        reset_link = f"{settings.FRONTEND_URL}/reset-password/{uidb64}/{token}"

        logger.info("Password reset requested for %s", email)

        send_mail(
        subject="Medimarc Trading",
        message="",  # Leave this empty since we're using `html_message`
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[email],
        fail_silently=False,
        html_message=f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #2c3e50;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>You have requested to reset your password. Please click the button below to proceed:</p>
                <p>
                    <a href="{reset_link}" style="display: inline-block; padding: 5px 10px; background-color: #3498db; 
                    color: white; text-decoration: none; border-radius: 5px;">Reset Your Password</a>
                </p>
                <p>If you did not request this, please ignore this email.</p>
                <p>Thank you,<br><strong>Medimarc Team</strong></p>
            </body>
        </html>
        """
        )
        # Use when domain is available already
        # resend.api_key = settings.RESEND_API_KEY
        # params: resend.Emails.SendParams = {
        #     "from": 'onboarding@resend.dev',
        #     "to": [email],
        #     "subject": "[hey there, here is your reset link]",
        #     "html": f"<p>{reset_link}</p>",
        # }
        # resend.Emails.send(params)

        return Response(status=status.HTTP_204_NO_CONTENT)

    except CustomUser.DoesNotExist:
        return Response({"error": "Email not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@permission_classes([AllowAny])  # ✅ Allow unauthenticated access
def reset_password(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = CustomUser.objects.get(pk=uid)

        if not default_token_generator.check_token(user, token):
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        new_password = request.data.get("password")
        if not new_password:
            return Response({"error": "Password not provided."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)  # ✅ Hashes password correctly
        user.save()

        return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)

    except CustomUser.DoesNotExist:
        return Response({"error": "Invalid token or user not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def edit_user(request, user_id):
    user = get_object_or_404(CustomUser, id=user_id)

    if request.user.user_type == "USER" and request.user.id != user.id:
        return Response({"error": "Users can only edit their own account."}, status=status.HTTP_403_FORBIDDEN)

    if request.user.user_type == "ADMIN" and user.user_type == "ADMIN" and request.user.id != user.id:
        return Response({"error": "Admins cannot edit other Admins."}, status=status.HTTP_403_FORBIDDEN)

    serializer = UserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_user(request, user_id):
    """Allow superusers and admin user types to delete users (except themselves and superusers)"""

    try:
        user_to_delete = CustomUser.objects.get(id=user_id)

        # Prevent deleting superusers
        if user_to_delete.is_superuser:
            return Response(
                {"error": "You cannot delete a superuser."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Prevent self-deletion
        if request.user.id == user_id:
            return Response(
                {"error": "You cannot delete your own account."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Only allow superusers and admins to delete users
        if not (request.user.is_superuser or request.user.user_type == "ADMIN"):
            return Response(
                {"error": "Only admins can delete users."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user_to_delete.delete()
        return Response(
            {"message": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT
        )

    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_sale(request, id):
    sale = get_object_or_404(Sale, id=id)
    sale.delete()
    return JsonResponse({"message": "Sale deleted successfully"}, status=200)
    
        
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_product_details(request, product_id):
    """Fetch product details including Lot Number & Expiration Date"""
    try:
        product = Product.objects.get(product_id=product_id)
        serializer = ProductSerializer(product)
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_sale(request, sale_id):
    """Prevent editing if status is 'Delivered'"""
    try:
        sale = Sale.objects.get(id=sale_id)
    except Sale.DoesNotExist:
        return Response({"error": "Sale not found"}, status=status.HTTP_404_NOT_FOUND)

    # ✅ Prevent editing if status is already "Delivered"
    if sale.status == "Delivered":
        return Response({"error": "Cannot edit a delivered sale"}, status=status.HTTP_403_FORBIDDEN)

    # ✅ Allow partial updates for non-delivered sales
    serializer = SaleSerializer(sale, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_products(request):
    """Fetch all products including category details."""
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True)

    formatted_products = [
        {
            "product_id": product["product_id"] or f"P{index+1}",
            "item_code": product["item_code"] or "N/A",
            "product_name": product["product_name"] or "N/A",
            "category": product["category"] or "Uncategorized",
            "buying_price": product["buying_price"] or 0,
            "selling_price": product["selling_price"] or 0,
            "stock": product["stock"] or 0,
            "original_stock": product["original_stock"] or 0,
            "lot_number": product["lot_number"] or "N/A",  # ✅ Ensure Lot Number is included
            "expiration_date": product["expiration_date"] or "N/A",  # ✅ Ensure Expiration Date is included
            "shipment_date": product["shipment_date"] or "N/A", 
            "critical_stock": product["critical_stock"] or 0,  # Ensure critical stock is included
        }
        for index, product in enumerate(serializer.data)
    ]

    return Response(formatted_products, status=status.HTTP_200_OK)



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_product(request):
    """Create a new product with a selected category."""
    category_name = request.data.get("category", "").strip()

    # Validate category existence
    category_instance = Category.objects.filter(name=category_name).first()
    if not category_instance:
        return Response(
            {"error": "Category not found"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Create Product
    data = request.data.copy()
    serializer = ProductSerializer(data=data)

    if serializer.is_valid():
        serializer.save(category=category_instance.name)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def edit_product(request, product_id):
    """Edit product details."""
    try:
        product = Product.objects.get(product_id=product_id)
    except Product.DoesNotExist:
        return Response(
            {"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND
        )

    serializer = ProductSerializer(product, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_product(request, product_id):
    """Delete a product by product_id."""
    try:
        product = Product.objects.get(product_id=product_id)
        product.delete()
        return Response(
            {"message": "Product deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )
    except Product.DoesNotExist:
        return Response(
            {"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_stock(request, product_id):
    """Add new stock for a product, creating a new entry with the same product data."""
    try:
        product = Product.objects.get(product_id=product_id)
    except Product.DoesNotExist:
        return Response(
            {"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND
        )

    try:
        logger.info("Adding stock to product %s: data=%s", product_id, request.data)

        stock_to_add = int(request.data.get("stock", 0))  # Ensure 'stock' is present
        shipment_date = request.data.get("shipment_date", None)

        if stock_to_add < 0:
            return Response(
                {"error": "Stock value cannot be negative"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create a new product entry with the same details but new stock
        new_product_entry = Product.objects.create(
            item_code=product.item_code,
            product_name=product.product_name,
            category=product.category,
            buying_price=product.buying_price,
            selling_price=product.selling_price,
            stock=stock_to_add,  # New sales stock
            original_stock=stock_to_add,  # New original stock
            lot_number=product.lot_number,
            expiration_date=product.expiration_date,
            shipment_date=shipment_date,  # Save the new shipment date
        )

        return Response(
            {"message": "Stock added successfully", "new_product_id": new_product_entry.product_id},
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_total2_products(request):
    """Fetch total count of products"""
    total2_products = Product.objects.count()
    return Response({"total2_products": total2_products}, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_total_users(request):
    """Returns the total count of users"""
    total_users = CustomUser.objects.count()
    return JsonResponse({"count": total_users})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_total_customers(request):
    """Returns the total count of customers"""
    total_customers = Customer.objects.count()
    return JsonResponse({"count": total_customers})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_total_categories(request):
    """Returns the total count of categories"""
    total_categories = Category.objects.count()
    return JsonResponse({"count": total_categories})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_total_sales_count(request):
    """Returns the total count of sales"""
    total_sales = Sale.objects.count()
    return JsonResponse({"count": total_sales})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_total_products(request):
    """Returns the total count of products"""
    total_products = Product.objects.count()

    # ✅ Handle case when no products exist
    if total_products == 0:
        return Response({"error": "No products found"}, status=status.HTTP_200_OK)

    return Response({"count": total_products}, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_latest_sales(request):
    """Fetch the 10 most recent sales."""
    latest_sales = Sale.objects.filter(status="Delivered").order_by("-id")[:20]
    serializer = SaleSerializer(latest_sales, many=True)
    return JsonResponse(serializer.data, safe=False, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_recently_added_products(request):
    """Fetch the 5 most recently added products"""
    recent_products = Product.objects.order_by("-created_at")[:20]  # Query by `created_at` to get recent products
    serializer = ProductSerializer(recent_products, many=True)
    return JsonResponse(serializer.data, safe=False, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_low_stock_products(request):
    """Fetch item codes whose aggregated total stock is at or below their critical stock level."""
    low_stock_products = list(
        Product.objects.values("item_code")
        .annotate(total_stock=Sum("stock"), critical_stock=Max("critical_stock"))
        .filter(total_stock__lte=F("critical_stock"))
        .order_by("item_code")
    )

    return JsonResponse(low_stock_products, safe=False, status=status.HTTP_200_OK)



@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def get_category(request):
    if request.method == "GET":
        # Fetch all categories
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=200)
    elif request.method == "POST":
        # Create a new category
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def category_detail(request, pk):
    try:
        category = Category.objects.get(pk=pk)
    except Category.DoesNotExist:
        return Response({"error": "Category not found"}, status=404)

    if request.method == "PUT":
        serializer = CategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    elif request.method == "DELETE":
        category.delete()
        return Response({"message": "Category deleted successfully!"}, status=204)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def customer_list(request):
    if request.method == "GET":
        customers = Customer.objects.all()
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == "POST":
        serializer = CustomerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def customer_detail(request, pk):
    try:
        customer = Customer.objects.get(pk=pk)
    except Customer.DoesNotExist:
        return Response(
            {"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "PUT":
        serializer = CustomerSerializer(customer, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        customer.delete()
        return Response(
            {"message": "Customer deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_customer(request, customer_id):
    try:
        customer = Customer.objects.get(id=customer_id)
    except Customer.DoesNotExist:
        return Response(
            {"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND
        )

    serializer = CustomerSerializer(customer, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_customers(request):
    """Fetch all customers for dropdown"""
    customers = Customer.objects.all()
    return Response(
        [{"id": customer.id, "name": customer.name} for customer in customers]
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_sale(request):
    """Add a new sale but only deduct stock when status is 'Delivered'."""
    logger.info("Incoming Sale Data: %s", request.data)

    # ✅ Ensure product exists
    product_id = request.data.get("product")
    try:
        product = Product.objects.get(product_id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_400_BAD_REQUEST)

    sale_data = request.data.copy()
    sale_data["product"] = product.product_id  # ✅ FIXED HERE

    serializer = SaleSerializer(data=sale_data)
    if serializer.is_valid():
        sale = serializer.save()
        logger.info("Sale created: %s", sale)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    logger.warning("Sale validation errors: %s", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_sale_status(request, sale_id):
    """Update status for a specific sale entry (not product-wide)"""
    try:
        sale = Sale.objects.get(id=sale_id)  # ✅ Ensure each sale is unique
    except Sale.DoesNotExist:
        return Response({"error": "Sale not found"}, status=status.HTTP_404_NOT_FOUND)

    previous_status = sale.status
    new_status = request.data.get("status", sale.status)

    if new_status not in dict(Sale.STATUS_CHOICES):
        return Response(
            {"error": "Invalid status value."}, status=status.HTTP_400_BAD_REQUEST
        )

    # ✅ Prevent changing status if already delivered
    if sale.status == "Delivered":
        return Response(
            {"error": "This sale has already been delivered and cannot be changed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ✅ Deduct stock only when transitioning to "Delivered".
    #    Validate stock BEFORE saving the new status so a failed delivery
    #    cannot leave the sale marked as "Delivered".
    if previous_status != "Delivered" and new_status == "Delivered":
        with transaction.atomic():
            product = Product.objects.select_for_update().get(
                product_id=sale.product.product_id
            )
            if product.stock < sale.quantity:
                return Response(
                    {"error": "Not enough stock available to deliver this order"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            product.stock -= sale.quantity
            product.save()

            sale.status = new_status
            sale.save()

        logger.info(
            "Sale %s marked as Delivered; deducted %s from product %s",
            sale_id,
            sale.quantity,
            product.product_id,
        )
    else:
        sale.status = new_status
        sale.save()

    return Response({"message": "Sale status updated successfully", "status": sale.status})



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_sales(request):
    """Fetch all sales ensuring the status is properly saved"""
    sales = Sale.objects.all()
    serializer = SaleSerializer(sales, many=True)

    # ✅ Ensure status is retained correctly
    for sale in serializer.data:
        if sale["status"] is None:
            sale["status"] = "Pending"

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_sale(request, pk):
    """Fetch all sales with product details."""
    sale = get_object_or_404(Sale, pk=pk)
    serializer = SaleSerializer(sale)
    return Response(serializer.data, status=status.HTTP_200_OK)


class GenerateSalesReport(APIView):
    def get(self, request, *args, **kwargs):
        # Get the filters from the request
        start_date = request.GET.get("start_date", "N/A")
        end_date = request.GET.get("end_date", "N/A")
        customer_name = request.GET.get("customer_name", "")
        item_code = request.GET.get("item_code", "")
        format_type = request.GET.get("format_type", "csv").lower()

        # Get all sales, but filter to only include "Delivered" status sales
        sales = Sale.objects.filter(status="Delivered")

        # Apply date filtering
        if start_date and end_date:
            sales = sales.filter(date__gte=start_date, date__lte=end_date)

        # Further filter by customer if provided
        if customer_name:
            sales = sales.filter(customer__name=customer_name)
        
        if item_code and item_code != "all":
            sales = sales.filter(product__item_code=item_code)


        # Check if there are sales after filtering
        if not sales.exists():
            return Response({"message": "No sales found"}, status=404)

        # Handle different formats
        if format_type == "csv":
            return generate_csv_report(sales)
        elif format_type == "pdf":
            return generate_pdf_report(sales, start_date, end_date, customer_name)
        
        return Response({"error": "Invalid format. Use 'pdf' or 'csv'."}, status=400)



def generate_csv_report(sales):
    """Generate CSV report with only 'Delivered' sales."""
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="sales_report.csv"'

    writer = csv.writer(response)

    # Add headers for the CSV file
    writer.writerow(["SI No.", "Date Invoice", "Item Code", "Customer", "Product Name", "Quantity", "Total Sale", "Lot Number", "Expiration Date"])

    for sale in sales:
        writer.writerow([
            sale.invoice_number,
            sale.date.strftime("%Y-%m-%d"),
            sale.product.item_code,
            sale.customer.name,
            sale.product.product_name,
            sale.quantity,
            sale.total,
            sale.product.lot_number,
            sale.product.expiration_date.strftime("%Y-%m-%d"),
        ])

    return response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_product_csv(request):
    """Generate CSV report for products."""
    item_code = request.GET.get("item_code", "")
    
    if item_code:
        products = Product.objects.filter(item_code=item_code)
    else:
        products = Product.objects.all()

    if not products:
        return Response({"message": "No products found"}, status=404)
    
    # Generate CSV file
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="product-shipment_report.csv"'
    writer = csv.writer(response)
    
    # Write header to CSV file
    writer.writerow(["Shipment Date", "Item Code", "Lot Number", "Product Name", "Category", "Original Stock", "Expiration Date" ])

    for product in products:
        writer.writerow([
            product.shipment_date.strftime('%Y-%m-%d') if product.shipment_date else "N/A",
            product.item_code,
            product.lot_number,
            product.product_name,
            product.category,
            product.original_stock,
            product.expiration_date.strftime("%Y-%m-%d"),
        ])

    return response

def generate_pdf_report(sales, start_date, end_date, customer_name):
    """Generate a formatted PDF Sales Report with only 'Delivered' sales."""
    # Try to register Arial (Unicode) for the report body, falling back to a
    # built-in font so a missing font file never crashes report generation.
    arial_candidates = [
        settings.BASE_DIR / "arial.ttf",
        Path(__file__).resolve().parent.parent / "arial.ttf",
        Path.cwd() / "arial.ttf",
    ]
    arial_path = next((p for p in arial_candidates if Path(p).is_file()), None)
    content_font = "Helvetica"
    if arial_path:
        pdfmetrics.registerFont(TTFont("ArialUnicode", str(arial_path)))
        content_font = "ArialUnicode"

    buffer = BytesIO()

    pdf = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        rightMargin=15, leftMargin=15, topMargin=20, bottomMargin=20
    )

    elements = []
    styles = getSampleStyleSheet()

    # Styles for title and headers
    title_style = ParagraphStyle(name="Title", fontSize=16, alignment=1, spaceAfter=10, fontName="Helvetica-Bold")
    header_style = ParagraphStyle(name="Header", fontSize=12, alignment=1, spaceAfter=5, fontName="Helvetica-Bold")
    body_style = ParagraphStyle(name="Normal", fontName=content_font, fontSize=8.5)
    right_align_style = ParagraphStyle(name="RightAlign", fontName=content_font, alignment=2, fontSize=8.5)
    total_style = ParagraphStyle(name="Total", fontName=content_font, alignment=2, textColor=colors.red, fontSize=9.5)

    # Title/Header for PDF
    title = Paragraph("MediMarc Trading Inventory - Sales Report", title_style)
    date_range = Paragraph(f"<b>{start_date} -TILL DATE- {end_date}</b>", header_style)
    customer_display = Paragraph(f"<b>{customer_name}</b>", header_style)

    elements.extend([title, date_range, customer_display, Spacer(1, 15)])

    # Table headers
    table_data = [["SI No.", "Date Invoice", "Item Code", "Customer", "Product Name", "Quantity", "Total Sale", "Lot Number", "Expiration Date"]]
    grand_total = 0

    for sale in sales:
        table_data.append([
            sale.invoice_number,
            sale.date.strftime("%Y-%m-%d"),
            sale.product.item_code,
            Paragraph(sale.customer.name, body_style),
            Paragraph(sale.product.product_name, body_style),
            sale.quantity,
            Paragraph(f"₱{sale.total:,.2f}", right_align_style),
            sale.product.lot_number,
            sale.product.expiration_date.strftime("%Y-%m-%d")
        ])
        grand_total += sale.total

    # Grand total row
    table_data.append([
        "", "", "", "", "Grand Total", "",
        Paragraph(f"₱{grand_total:,.2f}", total_style),
        "", ""
    ])

    # Optimized column widths for full page fit
    col_widths = [35, 65, 75, 90, 250, 45, 80, 70, 80]

    # Build and style table
    table = Table(table_data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TEXTCOLOR", (6, -1), (6, -1), colors.red),
        ("FONTSIZE", (0, 1), (-1, -1), 8.5),
        ("WORDWRAP", (3, 1), (3, -2), "CJK"),
        ("WORDWRAP", (4, 1), (4, -2), "CJK"),
    ]))

    elements.append(table)
    pdf.build(elements)

    # Return response
    pdf_data = buffer.getvalue()
    buffer.close()

    response = HttpResponse(pdf_data, content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="sales_report.pdf"'
    return response



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_total_sales(request):
    days = request.data.get("days")
    if not days: 
        return Response({"error": "Days field is required"}, status=400)

    # Get date range
    current_date = timezone.now().date()
    start_date = current_date - timedelta(days=int(days))
    end_date = current_date + timedelta(days=1)

    data = []
    current_day = start_date

    while current_day <= end_date:
        sales_data = Sale.objects.filter(
            status="Delivered",
            date=current_day
        ).aggregate(
            total_sales=Count("id"),  
            total_revenue=Sum("total")  
        )
        
        data.append({
            "date": current_day.strftime("%Y-%m-%d"),
            "sales": sales_data["total_sales"] or 0,  # Default to 0 if no sales
            "revenue": sales_data["total_revenue"] or 0  # Default to 0 if no revenue
        })

        current_day += timedelta(days=1)

    return Response(data, status=200)