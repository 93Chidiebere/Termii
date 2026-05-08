from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.api.routes.shop.schemas import ProductCreate, ProductResponse
from app.api.routes.shop.models import Product
from app.models.user import User
from app.api.dependencies import get_current_user, get_current_admin

router = APIRouter()

@router.post("/", response_model=ProductResponse)
async def create_product(product_in: ProductCreate, current_user: User = Depends(get_current_user)):
    product = Product(seller=current_user, status="PENDING", **product_in.dict())
    await product.insert()
    return product

@router.get("/", response_model=List[ProductResponse])
async def get_approved_products():
    products = await Product.find(Product.status == "APPROVED").to_list()
    return products

@router.put("/{product_id}/approve")
async def approve_product(product_id: str, admin: User = Depends(get_current_admin)):
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.status = "APPROVED"
    await product.save()
    return {"message": "Product approved"}
