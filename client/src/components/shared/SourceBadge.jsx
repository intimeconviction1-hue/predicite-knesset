import React from 'react';
import { CheckCircle, ExternalLink } from 'lucide-react';

export default function SourceBadge({ source_name, source_url, is_verified = false, size = 'sm', show_icon = false }) {
  const content = (
    <>
      {is_verified && <CheckCircle size={size === 'sm' ? 9 : 11} />}
      {source_name}
      {show_icon && source_url && <ExternalLink size={size === 'sm' ? 9 : 11} />}
    </>
  );

  if (!source_url) {
    return <span className="source-badge" style={{ cursor: 'default' }}>{content}</span>;
  }

  return (
    <a
      href={source_url}
      target="_blank"
      rel="noopener noreferrer"
      className="source-badge"
    >
      {content}
    </a>
  );
}