import { useRef, useState } from 'react';
import { FileUp, Paperclip, X } from 'lucide-react';
import { formatFileSize } from '../../utils/format';

const MAX_FILES = 5;
const MAX_SIZE = 25 * 1024 * 1024;

// File picker with drag-and-drop. In the prototype only file names and sizes
// are kept; a real backend would upload the files to storage.
export default function FileDrop({ files, onChange, accept, label = 'Attach files' }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const addFiles = (list) => {
    const incoming = Array.from(list);
    const tooBig = incoming.filter((f) => f.size > MAX_SIZE);
    const ok = incoming.filter((f) => f.size <= MAX_SIZE).map((f) => ({ name: f.name, size: f.size }));
    const merged = [...files, ...ok].slice(0, MAX_FILES);
    if (tooBig.length) {
      setError(`${tooBig.map((f) => f.name).join(', ')} is over 25 MB. Paste a Google Drive link in the instructions instead.`);
    } else if (files.length + ok.length > MAX_FILES) {
      setError(`You can attach up to ${MAX_FILES} files. Only the first ${MAX_FILES} were kept.`);
    } else {
      setError('');
    }
    onChange(merged);
  };

  return (
    <div className="filedrop-wrap">
      <div
        className={`filedrop ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <FileUp size={26} strokeWidth={1.5} aria-hidden="true" />
        <p>
          <strong>Drag files here</strong> or{' '}
          <button type="button" className="btn--text filedrop__browse" onClick={() => inputRef.current?.click()}>
            browse your device
          </button>
        </p>
        <p className="tiny muted">
          Images, PDF, Word, or PowerPoint. Up to {MAX_FILES} files, 25 MB each.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          aria-label={label}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {error && <p className="error small">{error}</p>}
      {files.length > 0 && (
        <ul className="filelist" role="list">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <Paperclip size={16} aria-hidden="true" />
              <span className="filelist__name">{f.name}</span>
              <span className="tiny muted num">{formatFileSize(f.size)}</span>
              <button
                type="button"
                className="icon-btn filelist__remove"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                aria-label={`Remove ${f.name}`}
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
