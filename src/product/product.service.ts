import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@/prisma/prisma";
import { CreateProductInput, UpdateProductInput, createProductSchema } from "@/schemas";
import * as XLSX from 'xlsx';

@Injectable()
export class ProductService {

  constructor() {}

  async create(createProductDto: CreateProductInput) {
    const sizes = createProductDto.stockSize.map(item => item.size);
    const uniqueSizes = new Set(sizes);
    
    if (sizes.length !== uniqueSizes.size) {
      throw new BadRequestException('Each size must be unique in stockSize array');
    }

    const existingSeller = await prisma.seller.findUnique({
      where: { id: createProductDto.sellerId },
    });

    if (!existingSeller) {
      throw new NotFoundException(`Seller with ID ${createProductDto.sellerId} not found`);
    }

    // Calculate stockQuantity as sum of all quantities in stockSize
    const stockQuantity = createProductDto.stockSize.reduce(
      (total, item) => total + item.quantity, 
      0
    );

    // create product
    const product = await prisma.product.create({
      data: {
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        image: createProductDto.image,
        category: createProductDto.category,
        subCategory: createProductDto.subCategory,
        stockQuantity,
        sellerId: createProductDto.sellerId,
        stockSize: {
          create: createProductDto.stockSize.map(item => ({
            size: item.size,
            quantity: item.quantity,
          })),
        },
      },
      include: { 
        seller: true,
        stockSize: true, // Include the stockSize relation in the response
      },
    });

    return {
      ...product,
      stockSize: product.stockSize.map(item => ({
        size: item.size,
        quantity: item.quantity
      }))
    };
  }

  async findAll(page?: number, limit?: number) {
    if (page && limit) {
      const skip = (page - 1) * limit;
      return prisma.product.findMany({
        skip,
        take: limit,
        include: {
          seller: true,
          stockSize: true
        }
      });
    } else {
      return prisma.product.findMany({
        include: {
          seller: true,
          stockSize: true
        }
      });
    }
  }

  async findOne(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: true,
        stockSize: true
      }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateData: UpdateProductInput) {
    const product = await prisma.product.findUnique({ where: { id } });
    console.log(product)
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    const data: any = { ...updateData };

     if (updateData.stockSize) {
      const sizes = updateData.stockSize.map(item => item.size);
      const uniqueSizes = new Set(sizes);
      
      if (sizes.length !== uniqueSizes.size) {
        throw new BadRequestException('Each size must be unique in stockSize array');
      }

      data.stockQuantity = updateData.stockSize.reduce(
        (total, item) => total + item.quantity, 
        0
      );

      data.stockSize = {
        deleteMany: { productId: id },
        create: updateData.stockSize.map(item => ({
          size: item.size,
          quantity: item.quantity,
        })),
      };
    }
    return await prisma.product.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data,
      include: {
        seller: true,
        stockSize: true
      }
    });
  } 

  async remove(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { stockSize: true }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.stockSize.length > 0) {
      await prisma.sizeStock.deleteMany({
        where: { productId: id }
      });
    }

    return prisma.product.delete({ where: { id } });
  }

  async findBySeller(id: string) {
    const products = await prisma.product.findMany(
  {
      where: {
        sellerId: id,
      },
      include: {
        stockSize: true,
      }
  } 
)
    if (!products) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return products
  }

  async importProducts(buffer: Buffer): Promise<any> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const productsData: any[] = XLSX.utils.sheet_to_json(worksheet);

      const createdProducts: any[] = [];
      for (const productData of productsData) {
        // Map Excel column names to CreateProductInput fields
        const createProductInput: CreateProductInput = {
          name: productData.Name,
          description: productData.Description,
          price: parseFloat(productData.Price),
          image: productData.ImageURLs ? productData.ImageURLs.split(',') : [],
          category: productData.Category, 
          subCategory: productData.SubCategory, 
          sellerId: productData.SellerId,
          stockSize: [], 
        };

        // Parse stockSize from 'SizesAndQuantities' column
        if (productData.SizesAndQuantities) {
          createProductInput.stockSize = productData.SizesAndQuantities.split(',').map(sq => {
            const [size, quantity] = sq.split(':');
            return {
              size: size as any, 
              quantity: parseInt(quantity, 10),
            };
          });
        }

        // Validate using Zod schema before creating
        const validated = createProductSchema.safeParse(createProductInput);
        if (!validated.success) {
          throw new BadRequestException(`Validation failed for product: ${productData.Name} - ${JSON.stringify(validated.error.format())}`);
        }

        // Use the existing create method in ProductService to handle product creation and stockSize
        const createdProduct = await this.create(validated.data);
        createdProducts.push(createdProduct);
      }

      return createdProducts;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to process Excel file: ${error.message}`);
    }
  }

  async exportProductsToExcel(): Promise<Buffer> {
    try {
      const products = await prisma.product.findMany({
        include: {
          stockSize: true,
          seller: {
            include: {
              user: true,
            },
          },
        },
      });

      const dataForExcel = products.map(product => ({
        ID: product.id,
        Name: product.name,
        Description: product.description,
        Price: product.price,
        ImageURLs: product.image.join(','),
        Category: product.category,
        SubCategory: product.subCategory,
        SellerId: product.sellerId,
        SellerName: product.seller?.user?.name || 'N/A', 
        StockQuantity: product.stockQuantity,
        SizesAndQuantities: product.stockSize.map(ss => `${ss.size}:${ss.quantity}`).join(','),
        CreatedAt: product.createdAt.toISOString(),
        UpdatedAt: product.updatedAt.toISOString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return excelBuffer;
    } catch (error) {
      throw new BadRequestException(`Failed to export products to Excel: ${error.message}`);
    }
  }
}