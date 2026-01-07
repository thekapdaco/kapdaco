// src/components/Customize/ProductSelection.jsx
import React from "react";
import { PRODUCTS } from './customizeConstants';
import styles from './styles';

const ProductSelection = React.memo(({ selectedProduct, onSelectProduct }) => (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>Choose Your Canvas</h2>
      <div style={styles.productGrid}>
        {PRODUCTS.map((prod) => (
          <div
            key={prod.id}
            style={{
              ...styles.productCard,
              ...(selectedProduct.id === prod.id ? styles.selectedCard : {})
            }}
            onClick={() => onSelectProduct(prod)}
          >
            <div style={styles.productImageWrapper}>
              <img src={prod.imageUrl} alt={prod.name} style={styles.productImageCard} />
            </div>
            <h3 style={styles.productName}>{prod.name}</h3>
            <p style={styles.productPrice}>₹{prod.price}</p>
            <span style={styles.productCategory}>{prod.category}</span>
          </div>
        ))}
      </div>
    </div>
  ));
  
  export default ProductSelection;