//customizeConstants.js


export const PRODUCTS = [
  {
    id: 1,
    name: "Classic T-Shirt",
    price: 899,
    category: "apparel",
    imageUrl: "/images/products/red-Tshirt.png",
    hasSize: true,
    hasFrontBack: true,
    colorVariants: {
      "White": {
        front: "/images/products/White-TShirt.png",
        back: "/images/products/WhiteBack-Tshirt.png"
      },
      "Black": {
        front: "/images/products/tshirt-black-front.png",
        back: "/images/products/WhiteBack-Tshirt.png"
      },
      "Navy": {
        front: "/images/products/Nblue-Tshirt.png",
        back: "/images/products/NavyBack-Tshirt.png"
      },
      "Gray": {
        front: "/images/products/grey-Tshirt.png",
        back: "/images/products/GrayBack-Tshirt.png"
      },
      "Red": {
        front: "/images/products/red-Tshirt.png",
        back: "/images/products/RedBack-Tshirt.png"
      },
      "Blue": {
        front: "/images/products/blue-TShirt.png",
        back: "/images/products/BlueBack-Tshirt.png"
      }
    }
  },
  {
    id: 2,
    name: "Premium Hoodie",
    price: 1599,
    category: "apparel",
    imageUrl: "/images/products/Black-Hoodie.png",
    hasSize: true,
    hasFrontBack: true,
    colorVariants: {
      "White": {
        front: "/images/products/white-Hoodie.png",
        back: "/images/products/WhiteBack-Hoodie.png"
      },
      "Black": {
        front: "/images/products/Black-Hoodie.png",
        back: "/images/products/BlackBack-Hoodie.png"
      },
      "Navy": {
        front: "/images/products/Navy-Hoodie.png",
        back: "/images/products/NavyBlueBack-Hoodie.png"
      },
      "Gray": {
        front: "/images/products/Gray-Hoodie.png",
        back: "/images/products/GreyBack-Hoodie.png"
      },
      "Red": {
        front: "/images/products/red-Hoodie.png",
        back: "/images/products/RedBack-Hoodie.png"
      },
      "Blue": {
        front: "/images/products/blue-Hoodie.png",
        back: "/images/products/BlueBack-Hoodie.png"
      }
    }
  },
  { 
    id: 4, 
    name: "Canvas Tote", 
    price: 599, 
    category: "accessories", 
    imageUrl: "/images/products/tote.png",
    hasSize: false, 
    options: ["Medium", "Large"],
    hasFrontBack: false,  
    hasColorOptions: true,  
    colorVariants: {
      "Black": "/images/products/blacktote.png",
      "White": "/images/products/tote.png"
    }
  },
  {
    id: 5, 
    name: "Snapback Cap", 
    price: 799, 
    category: "apparel", 
    imageUrl: "/images/products/NavyBlueCap.png",
    hasSize: false, 
    options: ["One Size"],
    hasFrontBack: false,
    colorVariants: {
      "White": "/images/products/WhiteCap.png",
      "Black": "/images/products/BlackCap.png",
      "Navy": "/images/products/NavyBlueCap.png",
      "Gray": "/images/products/GrayCap.png",
      "Red": "/images/products/RedCap.png",
      "Blue": "/images/products/BlueCap.png"
    }
  },
];

export const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export const COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Black", value: "#1B1B1B" },
  { name: "Navy", value: "#1E3A8A" },
  { name: "Gray", value: "#6B7280" },
  { name: "Red", value: "#DC2626" },
  { name: "Blue", value: "#2563EB" },
];

export const TEXT_STYLES = [
  { name: "Bold", style: { fontWeight: '700' } },
  { name: "Italic", style: { fontStyle: 'italic' } },
  { name: "Underline", style: { textDecoration: 'underline' } },
  { name: "Shadow", style: { textShadow: '2px 2px 6px rgba(0,0,0,0.6)' } },
];

export const STEP_LABELS = ["Select Product", "Size & Color", "Design", "Preview"];