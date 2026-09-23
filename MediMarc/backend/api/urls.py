from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views
from .views import (
    GenerateSalesReport,
    get_latest_sales,
    get_low_stock_products,
    get_recently_added_products,
    get_total2_products,
    get_total_categories,
    get_total_customers,
    get_total_products,
    get_total_sales,
    get_total_users,
    LoginView,
    get_product_details,
    ActivityLogView,
    generate_product_csv,
    update_critical_stock,
)

urlpatterns = [
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("sales-report/", GenerateSalesReport.as_view(), name="generate_sales_report"),
    path("forgot-password/", views.forgot_password, name="forgot_password"),
    path("users/", views.get_users, name="get_users"),
    path("users/<int:user_id>/edit/", views.edit_user, name="edit_user"),
    path("users/<int:user_id>/delete/", views.delete_user, name="delete_user"),
    path("register/", views.register, name="register"),
    path(
        "reset-password/<uidb64>/<token>/", views.reset_password, name="reset_password"
    ),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", views.logout_user, name="logout"),
    path("products/", views.get_products, name="get_products"),
    path("products/add/", views.add_product, name="add_product"),
    path(
        "products/<int:product_id>/delete/", views.delete_product, name="delete_product"
    ),
    path("products/<int:product_id>/", views.get_product_details, name="get_product_details"),

    path("products/<int:product_id>/edit/", views.edit_product, name="edit_product"),
    path(
        "products/<int:product_id>/update-stock/",
        views.update_stock,
        name="update_stock",
    ),
    path("sales/<int:sale_id>/update-status/", views.update_sale_status, name="update_sale_status"),
    path("products/total2/", get_total2_products, name="get_total2_products"),
    path("categories/", views.get_category, name="get_category"),
    path("categories/<int:pk>/", views.category_detail, name="category_detail"),
    path("customers/", views.customer_list, name="customer_list"),
    path("customers/<int:pk>/", views.customer_detail, name="customer_detail"),
    path("sales/customers/", views.get_customers, name="get_customers"),
    path("sales/products/", views.get_products, name="sales_product_options"),
    path("sales/add/", views.add_sale, name="add_sale"),
    path("sales/<int:id>/delete/", views.delete_sale, name="delete_sale"),
    path("sales/<int:id>/get", views.get_sale, name="get_sale"),
    path("sales/", views.get_sales, name="get_sales"),
    path("sales/<int:sale_id>/edit/", views.update_sale, name="update_sale"),
    path("sales/total/", views.get_total_sales, name="get_total_sales"),
    path("sales/total/count/", views.get_total_sales_count, name="get_total_sales_count"),
    path("users/total/", views.get_total_users, name="get_total_users"),
    path("customers/total/", views.get_total_customers, name="get_total_customers"),
    path("categories/total/", views.get_total_categories, name="get_total_categories"),
    path("products/total/", views.get_total_products, name="get_total_products"),
    path("sales/latest/", views.get_latest_sales, name="get_latest_sales"),
    path("products/recent/", views.get_recently_added_products, name="get_recently_added_products"),
    path("products/low-stock/", views.get_low_stock_products, name="get_low_stock_products"),
    path("activity-logs/", ActivityLogView.as_view(), name="activity_log_class"),
    path("products/generate-csv/", generate_product_csv, name="generate_product_csv"),
    path("products/<int:product_id>/update-critical-stock/", update_critical_stock, name="update_critical_stock"),
]