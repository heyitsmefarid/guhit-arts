// Wraps content with printer's crop marks at the four corners.
export default function CropFrame({ children, className = '', as: Tag = 'div', ...rest }) {
  return (
    <Tag className={`crop ${className}`} {...rest}>
      {children}
      <span className="crop__mark crop__mark--tl" aria-hidden="true" />
      <span className="crop__mark crop__mark--tr" aria-hidden="true" />
      <span className="crop__mark crop__mark--bl" aria-hidden="true" />
      <span className="crop__mark crop__mark--br" aria-hidden="true" />
    </Tag>
  );
}
