// src/components/PdfViewer.js
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf'; // Importamos pdfjs directamente
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'; // Estilos para las anotaciones
import 'react-pdf/dist/esm/Page/TextLayer.css'; // Estilos para la capa de texto
import './PdfViewer.css'; // Tu archivo CSS personalizado

// --- CONFIGURACIÓN CRÍTICA DEL WORKER PARA CREATE REACT APP ---
// Apunta directamente al archivo worker que has COPIADO en la carpeta 'public'.
// Create React App sirve los archivos de la carpeta 'public' directamente desde la raíz.
// Asegúrate de que el archivo pdf.worker.min.mjs (o .js) esté en tu carpeta public/.
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`; // <-- ¡VERIFICA LA EXTENSIÓN! Podría ser .js o .mjs
// --- FIN CONFIGURACIÓN CRÍTICA ---

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
            file={pdfUrl} // La URL del PDF a cargar
            onLoadSuccess={onDocumentLoadSuccess} // Callback al cargar exitosamente
            onLoadError={(error) => console.error('Error al cargar PDF:', error)} // Callback en caso de error
            className="pdf-document" // Clase para estilos del contenedor del documento
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
