import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';

interface ExportResultsProps {
  searchQuery: string;
  aiAnswer?: string;
  searchResults: any[];
  disabled?: boolean;
}

const ExportResults: React.FC<ExportResultsProps> = ({
  searchQuery,
  aiAnswer,
  searchResults,
  disabled = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const exportToJSON = () => {
    const data = {
      query: searchQuery,
      exportDate: new Date().toISOString(),
      aiAnswer,
      results: searchResults,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    handleClose();
  };

  const exportToText = () => {
    let text = `Search Query: ${searchQuery}\n`;
    text += `Export Date: ${new Date().toLocaleString()}\n`;
    text += `\n${'='.repeat(60)}\n\n`;

    if (aiAnswer) {
      text += `AI Answer:\n${aiAnswer}\n\n`;
      text += `${'='.repeat(60)}\n\n`;
    }

    text += `Search Results (${searchResults.length}):\n\n`;

    searchResults.forEach((result, index) => {
      text += `${index + 1}. ${result.title}\n`;
      text += `   URL: ${result.url}\n`;
      if (result.snippet) {
        text += `   ${result.snippet}\n`;
      }
      text += `\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    handleClose();
  };

  const exportToHTML = () => {
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Search Results - ${searchQuery}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    .header {
      border-bottom: 3px solid #1976d2;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .query {
      font-size: 24px;
      font-weight: bold;
      color: #1976d2;
      margin-bottom: 10px;
    }
    .meta {
      color: #666;
      font-size: 14px;
    }
    .ai-answer {
      background: #e3f2fd;
      border-left: 4px solid #1976d2;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .ai-answer h2 {
      margin-top: 0;
      color: #1976d2;
    }
    .results {
      margin-top: 30px;
    }
    .result {
      padding: 20px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .result:last-child {
      border-bottom: none;
    }
    .result-title {
      font-size: 18px;
      font-weight: 500;
      color: #1976d2;
      text-decoration: none;
      display: block;
      margin-bottom: 8px;
    }
    .result-title:hover {
      text-decoration: underline;
    }
    .result-url {
      color: #4caf50;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .result-snippet {
      color: #555;
    }
    @media print {
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="query">${searchQuery}</div>
    <div class="meta">
      Exported on ${new Date().toLocaleString()} | ${searchResults.length} results
    </div>
  </div>

  ${
    aiAnswer
      ? `
  <div class="ai-answer">
    <h2>AI Answer</h2>
    <p>${aiAnswer}</p>
  </div>
  `
      : ''
  }

  <div class="results">
    <h2>Search Results</h2>
    ${searchResults
      .map(
        (result, index) => `
    <div class="result">
      <a href="${result.url}" class="result-title" target="_blank">
        ${index + 1}. ${result.title}
      </a>
      <div class="result-url">${result.url}</div>
      ${result.snippet ? `<div class="result-snippet">${result.snippet}</div>` : ''}
    </div>
    `
      )
      .join('')}
  </div>
</body>
</html>
`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    handleClose();
  };

  const printResults = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Search Results - ${searchQuery}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #1976d2; }
    .result { margin: 20px 0; page-break-inside: avoid; }
    .result-title { font-weight: bold; color: #1976d2; }
    .result-url { color: #4caf50; font-size: 12px; }
    .ai-answer { background: #e3f2fd; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>${searchQuery}</h1>
  <p>Exported: ${new Date().toLocaleString()}</p>
  ${
    aiAnswer
      ? `
  <div class="ai-answer">
    <h2>AI Answer</h2>
    <p>${aiAnswer}</p>
  </div>
  `
      : ''
  }
  <h2>Search Results</h2>
  ${searchResults
    .map(
      (result, index) => `
  <div class="result">
    <div class="result-title">${index + 1}. ${result.title}</div>
    <div class="result-url">${result.url}</div>
    ${result.snippet ? `<p>${result.snippet}</p>` : ''}
  </div>
  `
    )
    .join('')}
</body>
</html>
`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    handleClose();
  };

  return (
    <>
      <Tooltip title="Export results">
        <IconButton
          onClick={handleClick}
          disabled={disabled || searchResults.length === 0}
          color="primary"
        >
          {isExporting ? <CircularProgress size={24} /> : <FileDownloadIcon />}
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={printResults}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print Results</ListItemText>
        </MenuItem>

        <MenuItem onClick={exportToHTML}>
          <ListItemIcon>
            <CodeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as HTML</ListItemText>
        </MenuItem>

        <MenuItem onClick={exportToText}>
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as Text</ListItemText>
        </MenuItem>

        <MenuItem onClick={exportToJSON}>
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as JSON</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportResults;
