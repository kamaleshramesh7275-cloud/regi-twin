import React, { useRef, useState } from "react";
import { Upload, CheckCircle2, XCircle, Loader2, FileText, Wifi } from "lucide-react";
import { api } from "./api";

interface WearableImportModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const FORMAT_LABELS: Record<string, { label: string; color: string; hint: string }> = {
  garmin:      { label: "Garmin Connect",  color: "text-blue-400",   hint: "Detected: Heart Rate + HRV columns" },
  fitbit:      { label: "Fitbit",          color: "text-indigo-400", hint: "Detected: datetime + value columns" },
  apple_health:{ label: "Apple Health",    color: "text-rose-400",   hint: "Detected: Source Name column" },
  generic:     { label: "Generic CSV",     color: "text-amber-400",  hint: "Standard date + metric columns" },
};

export default function WearableImportModal({ userId, onClose, onSuccess }: WearableImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; source: string } | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".csv")) { setError("Please upload a .csv file."); return; }
    setFile(f); setError(""); setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const res = await api.importWearableCsv(userId, file);
      setResult(res);
      if (res.imported > 0) onSuccess();
    } catch (e: any) {
      setError("Import failed. Check the file format and try again.");
    } finally {
      setLoading(false);
    }
  };

  const fmt = result ? FORMAT_LABELS[result.source] || FORMAT_LABELS.generic : null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              <Wifi className="w-5 h-5 text-primary" /> Import Wearable Data
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Upload a CSV export from Garmin, Fitbit, or Apple Health</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Drag & Drop Zone */}
        {!result && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragging ? "border-primary bg-primary/10" : "border-white/10 hover:border-primary/50 hover:bg-white/5"
            }`}
          >
            <input ref={inputRef} type="file" accept=".csv" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Upload className="w-10 h-10 mx-auto text-primary mb-3 opacity-80" />
            {file ? (
              <div>
                <div className="flex items-center justify-center gap-2 font-semibold text-foreground">
                  <FileText className="w-4 h-4 text-primary" /> {file.name}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-foreground">Drop your CSV here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              </div>
            )}
          </div>
        )}

        {/* Supported Formats */}
        {!result && (
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(FORMAT_LABELS).slice(0, 3).map(([k, v]) => (
              <div key={k} className="bg-white/5 rounded-lg p-2 text-center">
                <div className={`text-xs font-bold ${v.color}`}>{v.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm">
            <XCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
              <CheckCircle2 className="w-6 h-6" /> Import Successful
            </div>
            {fmt && <div className={`text-sm font-semibold ${fmt.color}`}>{fmt.label} — {fmt.hint}</div>}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-3xl font-black text-emerald-400">{result.imported}</div>
                <div className="text-xs text-muted-foreground">rows imported</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-3xl font-black text-amber-400">{result.skipped}</div>
                <div className="text-xs text-muted-foreground">duplicates skipped</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!result ? (
            <>
              <button onClick={onClose} className="flex-1 btn-secondary py-2.5 rounded-lg text-sm">Cancel</button>
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</> : <><Upload className="w-4 h-4" /> Import</>}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="flex-1 btn-primary py-2.5 rounded-lg text-sm font-bold">Done</button>
          )}
        </div>
      </div>
    </div>
  );
}
