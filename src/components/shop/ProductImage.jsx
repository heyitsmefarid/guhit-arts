import { Droplets, Feather, Flag, FolderClosed, Frame, Layers, Shirt, Square, IdCard, Package } from 'lucide-react';
import { productImageUrl } from '../../utils/images';
import { getCategory } from '../../data/products';

// Products without a photo yet get a halftone tile in their category's ink.
const FALLBACK_ICONS = {
  canvas: Frame,
  board: Square,
  envelope: FolderClosed,
  ream: Layers,
  'ream-a4': Layers,
  ink: Droplets,
  laminate: IdCard,
  shuttlecock: Feather,
  jersey: Shirt,
  banner: Flag,
};

export default function ProductImage({ product, className = '', eager = false }) {
  const url = productImageUrl(product.image);
  if (url) {
    return (
      <img
        className={`product-img ${className}`}
        src={url}
        alt={product.name}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        width="720"
        height="720"
      />
    );
  }
  const Icon = FALLBACK_ICONS[product.image] ?? Package;
  return (
    <div
      className={`product-img product-img--fallback ${className}`}
      data-ink={getCategory(product.category)?.ink ?? 'ink'}
      role="img"
      aria-label={product.name}
    >
      <Icon strokeWidth={1.25} aria-hidden="true" />
    </div>
  );
}
