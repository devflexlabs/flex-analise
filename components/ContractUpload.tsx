"use client";

import { useRef, useState, useEffect } from "react";
import { Loader2, FileText, Search, FileCheck, Calculator, Calendar, CheckCircle } from "lucide-react";

interface ContractUploadProps {
  onUpload: (file: File) => void;
  loading: boolean;
  loadingMessage?: string | null;
}

const loadingMessages = [
  { text: "Lendo documento...", icon: FileText },
  { text: "Extraindo texto...", icon: FileText },
  { text: "Analisando informações...", icon: Search },
  { text: "Processando dados do contrato...", icon: Calculator },
  { text: "Identificando valores...", icon: Calculator },
  { text: "Extraindo datas...", icon: Calendar },
  { text: "Finalizando análise...", icon: CheckCircle },
];

export function ContractUpload({ onUpload, loading, loadingMessage }: ContractUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading) {
      setCurrentMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        const next = (prev + 1) % loadingMessages.length;
        return next;
      });
    }, 2000); // Muda a mensagem a cada 2 segundos

    return () => clearInterval(interval);
  }, [loading]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!validTypes.includes(file.type)) {
      alert("Por favor, envie um arquivo PDF ou imagem (JPEG/PNG)");
      return;
    }

    onUpload(file);
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed transition-all duration-300 rounded-xl p-16 text-center ${
          dragActive
            ? "border-[#1e3a8a] bg-[#1e3a8a]/5 scale-[1.01]"
            : "border-[#64748b] bg-white"
        } ${loading ? "opacity-60 pointer-events-none" : ""} shadow-sm`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
          className="hidden"
          disabled={loading}
        />

        <div className="space-y-6">
          <div className="flex justify-center">
            {loading ? (
              <div className={`p-6 rounded-full border-2 border-[#1e3a8a] bg-[#1e3a8a]/5 transition-transform`} key={`icon-${currentMessageIndex}`}>
                {(() => {
                  const currentMsg = loadingMessages[currentMessageIndex];
                  const CurrentIcon = currentMsg?.icon || FileText;
                  return <CurrentIcon className="h-12 w-12 text-[#1e3a8a] animate-pulse" />;
                })()}
              </div>
            ) : (
              <div className={`p-6 rounded-full border-2 border-[#1e3a8a] bg-[#1e3a8a]/5 transition-transform ${dragActive ? "scale-110" : ""}`}>
                <FileText className="h-12 w-12 text-[#1e3a8a]" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xl font-semibold text-[#1e293b]">
              {loading ? (
                <span className="inline-flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1e3a8a]" />
                  <span className="animate-pulse">
                    {loadingMessage || loadingMessages[currentMessageIndex]?.text || "Processando..."}
                  </span>
                </span>
              ) : (
                "Arraste e solte seu arquivo aqui"
              )}
            </p>
            {!loading && (
              <>
                <p className="text-sm font-light text-[#64748b]">
                  ou
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="px-8 py-3.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm"
                >
                  Selecionar Arquivo
                </button>
              </>
            )}
          </div>

          {!loading && (
            <p className="text-xs font-light text-[#64748b] pt-4">
              Formatos aceitos: PDF, JPEG ou PNG (máx. 200MB)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


