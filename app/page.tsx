"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  FileCode,
  FileJson,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  X,
  Link as LinkIcon,
  Key,
} from "lucide-react";

interface FileItem {
  id: string;
  name: string;
  size: string;
  type: "js" | "fwd";
  status: "uploading" | "processing" | "success" | "error";
  progress: number;
  url: string | null;
  file: File;
  errorMsg?: string;
}

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("fwh_token");
    }
    return null;
  });
  const [manageUrl, setManageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFiles = useCallback(async (newFiles: File[], currentToken: string | null) => {
    const validFiles = newFiles.filter(
      (f) => f.name.endsWith(".js") || f.name.endsWith(".fwd")
    );

    if (validFiles.length !== newFiles.length) {
      alert("仅支持 .js 和 .fwd 格式的文件");
    }
    if (validFiles.length === 0) return;

    const fileObjects: FileItem[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: (file.size / 1024).toFixed(2) + " KB",
      type: file.name.endsWith(".fwd") ? "fwd" as const : "js" as const,
      status: "uploading" as const,
      progress: 0,
      url: null,
      file,
    }));

    setFiles((prev) => [...fileObjects, ...prev]);

    // Upload files
    const formData = new FormData();
    validFiles.forEach((file) => formData.append("files", file));
    if (currentToken) formData.append("token", currentToken);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) => {
          if (fileObjects.some((fo) => fo.id === f.id) && f.status === "uploading") {
            const newProgress = Math.min(f.progress + Math.floor(Math.random() * 15) + 5, 90);
            return { ...f, progress: newProgress };
          }
          return f;
        })
      );
    }, 200);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      clearInterval(progressInterval);

      if (!res.ok) {
        setFiles((prev) =>
          prev.map((f) =>
            fileObjects.some((fo) => fo.id === f.id)
              ? { ...f, status: "error" as const, progress: 100, errorMsg: data.error }
              : f
          )
        );
        return;
      }

      // Save token
      if (data.token) {
        setToken(data.token);
        localStorage.setItem("fwh_token", data.token);
      }
      if (data.manageUrl) {
        setManageUrl(data.manageUrl);
      }

      // Update file statuses
      const siteUrl = window.location.origin;
      setFiles((prev) =>
        prev.map((f) => {
          const idx = fileObjects.findIndex((fo) => fo.id === f.id);
          if (idx !== -1 && data.modules[idx]) {
            const mod = data.modules[idx];
            return {
              ...f,
              status: "success" as const,
              progress: 100,
              url: `${siteUrl}/api/modules/${mod.id}/raw`,
            };
          }
          return f;
        })
      );
    } catch {
      clearInterval(progressInterval);
      setFiles((prev) =>
        prev.map((f) =>
          fileObjects.some((fo) => fo.id === f.id)
            ? { ...f, status: "error" as const, progress: 100, errorMsg: "网络错误" }
            : f
        )
      );
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const currentToken = localStorage.getItem("fwh_token");
      handleFiles(Array.from(e.dataTransfer.files), currentToken);
    }
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files), token);
      e.target.value = "";
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const currentManageUrl = manageUrl || (token ? `${typeof window !== "undefined" ? window.location.origin : ""}/manage/${token}` : null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            模块托管工具
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            上传您的{" "}
            <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm text-slate-700">
              .js
            </code>{" "}
            或{" "}
            <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm text-indigo-600">
              .fwd
            </code>{" "}
            文件以获取云端托管地址。系统会自动解析 .fwd
            文件并替换其内部引用的依赖链接。
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-10 md:p-16 text-center transition-all duration-200 ease-in-out cursor-pointer bg-white
            ${
              isDragging
                ? "border-indigo-500 bg-indigo-50 shadow-inner"
                : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            className="hidden"
            multiple
            accept=".js,.fwd"
          />
          <div className="flex flex-col items-center justify-center space-y-4">
            <div
              className={`p-4 rounded-full ${
                isDragging ? "bg-indigo-100" : "bg-slate-100"
              }`}
            >
              <UploadCloud
                className={`w-10 h-10 ${
                  isDragging ? "text-indigo-600" : "text-slate-400"
                }`}
              />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-700">
                点击或将文件拖拽至此处
              </p>
              <p className="text-sm text-slate-400 mt-1">
                支持 .js, .fwd 文件 (最大 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-6">
            {/* Management Link */}
            {currentManageUrl && (
              <ManageLinkBanner url={currentManageUrl} />
            )}

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">
                  上传列表 ({files.length})
                </h2>
                <button
                  onClick={() => setFiles([])}
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  清空全部
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {files.map((file) => (
                  <FileItemRow
                    key={file.id}
                    file={file}
                    onRemove={() => removeFile(file.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ManageLinkBanner({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
          <Key className="w-4 h-4" />
          管理链接
        </h3>
        <p className="text-xs text-indigo-700 mt-1 max-w-lg">
          请妥善保存此管理链接。它是您后续修改或删除已上传模块的唯一入口。
        </p>
      </div>
      <div className="flex items-center bg-white border border-indigo-200 rounded-lg p-1 w-full sm:w-auto shadow-sm">
        <input
          type="text"
          readOnly
          value={url}
          className="bg-transparent text-sm font-mono text-indigo-600 w-full sm:w-80 focus:outline-none truncate px-2"
        />
        <button
          onClick={handleCopy}
          className={`p-1.5 rounded-md transition-all flex-shrink-0 ${
            copied
              ? "bg-green-500 text-white"
              : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
          }`}
          title="复制管理链接"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function FileItemRow({
  file,
  onRemove,
}: {
  file: FileItem;
  onRemove: () => void;
}) {
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    });
  };

  return (
    <div className="p-4 sm:p-6 hover:bg-slate-50 transition-colors group">
      <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        {/* Left: Icon and info */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div
            className={`p-3 rounded-xl flex-shrink-0 ${
              file.type === "fwd"
                ? "bg-indigo-50 text-indigo-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {file.type === "fwd" ? (
              <FileJson className="w-6 h-6" />
            ) : (
              <FileCode className="w-6 h-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p
                className="font-medium text-slate-800 truncate"
                title={file.name}
              >
                {file.name}
              </p>
              {file.type === "fwd" && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                  自动解析
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{file.size}</p>
          </div>
        </div>

        {/* Right: Status */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {file.status === "uploading" && (
            <div className="flex items-center gap-3 w-full sm:w-48">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-200 ease-out rounded-full"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
              <span className="text-sm text-slate-500 w-10 text-right">
                {file.progress}%
              </span>
            </div>
          )}

          {file.status === "processing" && (
            <div className="flex items-center gap-2 text-indigo-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">解析内嵌依赖...</span>
            </div>
          )}

          {file.status === "error" && (
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {file.errorMsg || "上传失败"}
              </span>
            </div>
          )}

          {file.status === "success" && file.url && (
            <div className="flex flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <div className="flex items-center gap-2 justify-between sm:justify-end">
                <div className="hidden sm:flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">托管成功</span>
                </div>
                <div className="flex items-center bg-slate-100 rounded-md p-1 w-full sm:w-[220px]">
                  <div className="p-1 text-slate-400">
                    <LinkIcon className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={file.url}
                    className="bg-transparent text-xs text-slate-600 w-full focus:outline-none truncate px-1"
                  />
                  <button
                    onClick={() => handleCopy(file.url!)}
                    className={`p-1.5 rounded transition-all flex-shrink-0 ${
                      copiedUrl
                        ? "bg-green-500 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-200 shadow-sm"
                    }`}
                    title="复制链接"
                  >
                    {copiedUrl ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete button */}
          <button
            onClick={onRemove}
            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="移除记录"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
