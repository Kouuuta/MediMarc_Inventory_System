from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Customer, CustomUser, Product, Sale


class UpdateSaleStatusTestCase(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="tester", password="testpass123"
        )
        Category.objects.create(name="Medicine")
        Product.objects.create(
            product_id=1,
            item_code="MD-001",
            product_name="Paracetamol",
            category="Medicine",
            buying_price="10.00",
            selling_price="15.00",
            stock=50,
            original_stock=50,
            critical_stock=20,
            lot_number="LOT-A",
        )
        customer = Customer.objects.create(name="Walk-in", address="Main St.")
        Sale.objects.create(
            id=1,
            invoice_number="SI-0001",
            customer=customer,
            product_id=1,
            quantity=5,
            total="75.00",
            date=date(2026, 9, 1),
            status="Pending",
        )

    def url(self):
        return reverse("update_sale_status", args=[1])

    def test_delivering_deducts_stock(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.put(self.url(), {"status": "Delivered"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "Delivered")
        self.assertEqual(Product.objects.get(product_id=1).stock, 45)

    def test_insufficient_stock_keeps_sale_pending(self):
        Product.objects.filter(product_id=1).update(stock=3)
        self.client.force_authenticate(user=self.user)

        response = self.client.put(self.url(), {"status": "Delivered"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        sale = Sale.objects.get(id=1)
        self.assertEqual(sale.status, "Pending")
        self.assertEqual(Product.objects.get(product_id=1).stock, 3)

    def test_already_delivered_cannot_be_changed(self):
        Sale.objects.filter(id=1).update(status="Delivered")
        self.client.force_authenticate(user=self.user)

        response = self.client.put(self.url(), {"status": "Pending"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_status_rejected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.put(self.url(), {"status": "Shipped"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LowStockProductsTestCase(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="tester", password="testpass123"
        )
        Product.objects.create(
            product_id=1,
            item_code="MD-001",
            product_name="Paracetamol",
            category="Medicine",
            buying_price="10.00",
            selling_price="15.00",
            stock=5,
            original_stock=5,
            critical_stock=20,
        )
        Product.objects.create(
            product_id=2,
            item_code="MD-001",
            product_name="Paracetamol",
            category="Medicine",
            buying_price="10.00",
            selling_price="15.00",
            stock=10,
            original_stock=10,
            critical_stock=20,
        )
        Product.objects.create(
            product_id=3,
            item_code="MD-002",
            product_name="Ibuprofen",
            category="Medicine",
            buying_price="20.00",
            selling_price="30.00",
            stock=100,
            original_stock=100,
            critical_stock=20,
        )

    def test_low_stock_aggregates_by_item_code(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse("get_low_stock_products"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["item_code"], "MD-001")
        self.assertEqual(int(data[0]["total_stock"]), 15)