import { getProducts } from "@/lib/actions/products"
import { ProductsClient } from "./products-client"

export default async function ProductsPage() {
  const products = await getProducts()
  return <ProductsClient initialProducts={products} />
}
