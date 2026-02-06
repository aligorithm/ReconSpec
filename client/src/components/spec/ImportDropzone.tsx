import { useCallback, useState } from "react";
import { useSpec } from "../../context/SpecContext.js";

export function ImportDropzone(): JSX.Element {
  const { loadSpec, isLoading, error } = useSpec();
  const [isDragging, setIsDragging] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteContent, setPasteContent] = useState("");

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".json") && !file.name.endsWith(".yaml") && !file.name.endsWith(".yml")) {
        alert("Please upload a .json, .yaml, or .yml file");
        return;
      }

      const content = await file.text();
      await loadSpec(content);
    },
    [loadSpec]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        await handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleFile(file);
      }
    },
    [handleFile]
  );

  const handlePaste = useCallback(async () => {
    if (pasteContent.trim()) {
      await loadSpec(pasteContent);
      setPasteContent("");
      setShowPaste(false);
    }
  }, [pasteContent, loadSpec]);

  if (showPaste) {
    return (
      <div className="import-state">
        <div
          className="import-dropzone"
          style={{ maxWidth: "600px", cursor: "default" }}
        >
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="paste-input"
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Paste your OpenAPI spec (JSON or YAML):
            </label>
            <textarea
              id="paste-input"
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder='{ "openapi": "3.0.0", ... }'
              style={{
                width: "100%",
                minHeight: "300px",
                padding: "12px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                resize: "vertical",
              }}
              autoFocus
            />
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={handlePaste}>
              Parse Spec
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowPaste(false);
                setPasteContent("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="import-state">
      <div
        className={`import-dropzone${isDragging ? " drag-over" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById("file-input")?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            document.getElementById("file-input")?.click();
          }
        }}
        aria-label="Upload OpenAPI specification file"
      >
        <input
          id="file-input"
          type="file"
          accept=".json,.yaml,.yml"
          onChange={handleFileInput}
          style={{ display: "none" }}
        />
        <div className="import-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: "var(--brand-default)" }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="import-heading">Import OpenAPI Specification</div>
        <div className="import-sub">
          Drag & drop your spec file here, or click to browse
        </div>
        <div className="import-formats">
          Supports: <code>.json</code> <code>.yaml</code> <code>.yml</code>
        </div>
        <div style={{ marginTop: "16px" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowPaste(true);
            }}
          >
            Paste Raw Content
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="loading-pulse">
          <div className="spinner" aria-hidden="true" />
          <span role="status" aria-live="polite">
            Parsing specification...
          </span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            background: "var(--error-bg)",
            border: "1px solid var(--error)",
            borderRadius: "var(--radius-sm)",
            color: "var(--error)",
            fontSize: "14px",
            maxWidth: "480px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
