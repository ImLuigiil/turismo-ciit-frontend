// src/components/PdfViewer.js
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf'; 
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'; 
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './PdfViewer.css'; 

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

function PdfViewer({ pdfUrl, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const goToPrevPage = () => setPageNumber(prevPageNumber => prevPageNumber - 1);
  const goToNextPage = () => setPageNumber(prevPageNumber => prevPageNumber + 1);

  if (!pdfUrl) {
    return null;
  }

  return (
    <div className="pdf-viewer-overlay">
      <div className="pdf-viewer-content">
        <button onClick={onClose} className="pdf-viewer-close-btn">X</button>
        <div className="pdf-document-container">
          <Document
            file={pdfUrl} 
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error('Error al cargar PDF:', error)}
            className="pdf-document" 
          >
            <Page
              pageNumber={pageNumber}
              renderAnnotationLayer={true}
              renderTextLayer={true}
              className="pdf-page"
              scale={1.0}
            />
          </Document>
        </div>

        {numPages && (
          <div className="pdf-navigation">
            <button onClick={goToPrevPage} disabled={pageNumber <= 1}>
              Anterior
            </button>
            <span>Página {pageNumber} de {numPages}</span>
            <button onClick={goToNextPage} disabled={pageNumber >= numPages}>
              Siguiente
            </button>
          </div>
        )}
        {numPages && (
            <a href={pdfUrl} download className="pdf-download-btn">Descargar PDF</a>
        )}
      </div>
    </div>
  );
}

export default PdfViewer;
