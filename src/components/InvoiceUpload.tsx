import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { OCRResult } from '../types';
import {
  Upload,
  FileText,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Image as ImageIcon,
  FileSpreadsheet,
} from 'lucide-react';
import InvoiceForm from './InvoiceForm';

export default function InvoiceUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setOcrResult(null);
    setShowForm(false);

    // Create preview
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type === 'application/pdf') {
      setPreview('pdf');
    }

    setLoading(true);

    try {
      // Upload to Supabase Storage
      const timestamp = Date.now();
      const ext = selectedFile.name.split('.').pop() || 'jpg';
      const fileName = `invoices/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(uploadData.path);
      setUploadedImageUrl(urlData.publicUrl);

      // Convert image to base64 for OCR
      const base64 = await fileToBase64(selectedFile);

      // Call edge function for OCR
      const { data, error: ocrError } = await supabase.functions.invoke('ocr-invoice', {
        body: { image: base64, type: selectedFile.type },
      });

      if (ocrError) throw ocrError;

      if (data?.error) {
        setError(data.error);
        setShowForm(false);
        return;
      }

      setOcrResult(data);
      setShowForm(true);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Error al procesar la factura. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith('image/') || droppedFile.type === 'application/pdf')) {
      processFile(droppedFile);
    } else {
      setError('Formato no soportado. Use imágenes (JPG, PNG) o PDF.');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach((track) => track.stop());

      canvas.toBlob((blob) => {
        if (blob) {
          const photoFile = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          processFile(photoFile);
        }
      }, 'image/jpeg');
    } catch {
      setError('No se pudo acceder a la cámara. Verifique los permisos.');
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPreview(null);
    setOcrResult(null);
    setError(null);
    setShowForm(false);
    setUploadedImageUrl(null);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="w-5 h-5 text-navy-600" />
          <h3 className="text-lg font-semibold text-navy-900">Nueva Factura</h3>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
            isDragging
              ? 'border-navy-400 bg-navy-50 scale-[1.02]'
              : 'border-gray-200 hover:border-navy-300 hover:bg-gray-50'
          }`}
        >
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-navy-100 to-navy-200 flex items-center justify-center">
              <Upload className="w-8 h-8 text-navy-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-navy-900">
                Arrastra tu factura aquí
              </p>
              <p className="text-sm text-gray-500 mt-1">
                o haz clic para seleccionar un archivo
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <ImageIcon className="w-4 h-4" />
              <span>JPG, PNG</span>
              <span className="text-gray-300">|</span>
              <FileSpreadsheet className="w-4 h-4" />
              <span>PDF</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <label className="btn-primary flex-1 justify-center cursor-pointer">
            <FileText className="w-5 h-5" />
            <span>Seleccionar archivo</span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <button onClick={handleCameraCapture} className="btn-secondary flex-1 justify-center">
            <Camera className="w-5 h-5" />
            <span>Tomar foto</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-navy-600 animate-spin mb-4" />
          <p className="text-navy-900 font-medium">Analizando factura...</p>
          <p className="text-sm text-gray-500 mt-1">Extrayendo información con IA</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error al procesar</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
            <button onClick={resetUpload} className="text-red-400 hover:text-red-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Preview and OCR result */}
      {preview && !loading && ocrResult && showForm && (
        <div className="space-y-6 animate-fade-in">
          {/* Preview card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-navy-900">Vista previa</h4>
              <button onClick={resetUpload} className="text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-gray-100">
              {preview === 'pdf' ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Documento PDF</p>
                    <p className="text-sm text-gray-400">{file?.name}</p>
                  </div>
                </div>
              ) : (
                <img src={preview} alt="Preview" className="w-full max-h-96 object-contain" />
              )}
            </div>
          </div>

          {/* OCR extraction status */}
          <div className={`card ${ocrResult?.needsReview ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ocrResult?.needsReview ? 'bg-amber-100' : 'bg-green-100'}`}>
                {ocrResult?.needsReview ? (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div>
                <p className={ocrResult?.needsReview ? 'text-amber-800 font-medium' : 'text-green-800 font-medium'}>
                  {ocrResult?.needsReview ? 'Se necesita revisión manual' : 'Información extraída correctamente'}
                </p>
                <p className={ocrResult?.needsReview ? 'text-amber-600 text-sm' : 'text-green-600 text-sm'}>
                  {ocrResult?.needsReview
                    ? (ocrResult.descripcion || 'No se pudo leer con claridad la factura. Revise los datos antes de guardar.')
                    : 'Revise y confirme los datos antes de guardar'}
                </p>
              </div>
            </div>
          </div>

          <InvoiceForm
            initialData={{
              fecha: ocrResult.fecha || '',
              numeroFactura: ocrResult.numero_factura || '',
              razonSocial: ocrResult.razon_social || '',
              ruc: ocrResult.ruc || '',
              dv: ocrResult.dv || '',
              subtotal: ocrResult.subtotal?.toString() || '',
              itbms: ocrResult.itbms?.toString() || '',
              descuento: ocrResult.descuento?.toString() || '0',
              total: ocrResult.total?.toString() || '',
              descripcion: ocrResult.descripcion || '',
              observaciones: '',
            }}
            imagenUrl={uploadedImageUrl}
            needsReview={ocrResult.needsReview || false}
            onSuccess={resetUpload}
          />
        </div>
      )}
    </div>
  );
}
