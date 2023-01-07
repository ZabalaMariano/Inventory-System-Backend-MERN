import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'El campo {name} es obligatorio'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'El campo {sku} es obligatorio'],
      default: 'SKU',
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'El campo {category} es obligatorio'],
      trim: true,
    },
    quantity: {
      type: String,
      required: [true, 'El campo {quantity} es obligatorio'],
      trim: true,
    },
    price: {
      type: String,
      required: [true, 'El campo {price} es obligatorio'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'El campo {description} es obligatorio'],
      trim: true,
    },
    image: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
