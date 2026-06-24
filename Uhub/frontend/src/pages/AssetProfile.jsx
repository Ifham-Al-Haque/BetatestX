import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Edit, Trash, Monitor, Laptop, Smartphone, Server,
  Printer, Network, User, Calendar, DollarSign, FileText,
  CheckCircle, AlertTriangle, Shield, TrendingUp, History, Info,
  Download, Share2, QrCode, Wrench, BarChart3, Printer as PrintIcon,
  X, MoreHorizontal, ExternalLink, ArrowLeft, Clock,
} from "lucide-react";
import { useAsset, useDeleteAsset } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmDialog from "../components/operation/ConfirmDialog";

function getAssetIcon(type, className = "w-10 h-10") {
  const props = { className };
  switch (type?.toLowerCase()) {
    case "laptop": return <Laptop {...props} />;
    case "desktop": return <Monitor {...props} />;
    case "mobile": return <Smartphone {...props} />;
    case "server": return <Server {...props} />;
    case "printer": return <Printer {...props} />;
    case "network": return <Network {...props} />;
    default: return <Monitor {...props} />;
  }
}

function getStatusColor(status) {
  switch (status) {
    case "In Stock": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "Assigned": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "Maintenance": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "Retired": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
}

function DetailRow({ label, value, mono }) {
  if (value == null || value === "") return null;
  return (
    <div className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{label}</dt>
      <dd className={`text-sm font-semibold text-gray-900 dark:text-white ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function SummaryMetric({ icon: Icon, label, value, sub, accent = "blue" }) {
  const accents = {
    blue: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400",
    green: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-600 dark:text-green-400",
    amber: "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-600 dark:text-amber-400",
    purple: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-600 dark:text-purple-400",
  };
  return (
    <div className={`rounded-xl p-4 bg-gradient-to-br ${accents[accent] || accents.blue}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 opacity-80" />
        <span className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function TimelineEvent({ icon: Icon, iconClass, title, date, description, isLast, children }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-2 min-h-[2rem]" />}
      </div>
      <div className={`flex-1 ${isLast ? "" : "pb-8"}`}>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
        {date && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{date}</p>}
        {description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{description}</p>}
        {children}
      </div>
    </div>
  );
}

export default function AssetProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "admin";

  const { data: asset, isLoading, error } = useAsset(id);
  const deleteAssetMutation = useDeleteAsset();

  const [showQRCode, setShowQRCode] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteDeleteId, setNoteDeleteId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "", type: "general" });

  const notesStorageKey = id ? `uhub-asset-notes-${id}` : null;

  useEffect(() => {
    if (!notesStorageKey) return;
    try {
      const saved = localStorage.getItem(notesStorageKey);
      if (saved) setNotes(JSON.parse(saved));
    } catch {
      setNotes([]);
    }
  }, [notesStorageKey]);

  useEffect(() => {
    if (!notesStorageKey) return;
    localStorage.setItem(notesStorageKey, JSON.stringify(notes));
  }, [notes, notesStorageKey]);

  const qrCodeUrl = useMemo(() => {
    if (!id) return "";
    const profileUrl = `${window.location.origin}/assets/${id}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(profileUrl)}`;
  }, [id]);

  const assetMetrics = useMemo(() => {
    if (!asset?.purchase_date) return null;
    const purchaseDate = new Date(asset.purchase_date);
    const now = new Date();
    const ageInDays = Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24));
    const ageInYears = ageInDays / 365;
    const depreciationRate = 0.2;
    const depreciationYears = Math.min(ageInYears, 5);
    const purchasePrice = parseFloat(asset.purchase_price) || 0;
    const currentValue = purchasePrice * Math.pow(1 - depreciationRate, depreciationYears);
    const depreciationPercentage = purchasePrice
      ? Math.min(((purchasePrice - currentValue) / purchasePrice) * 100, 100)
      : 0;
    const warrantyEndDate = new Date(purchaseDate);
    warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 3);
    const warrantyDaysLeft = Math.floor((warrantyEndDate - now) / (1000 * 60 * 60 * 24));
    const warrantyPercentage = Math.max(0, Math.min(100, (warrantyDaysLeft / (3 * 365)) * 100));

    return {
      ageInDays,
      ageInYears: ageInYears.toFixed(1),
      currentValue: Math.max(currentValue, 0),
      depreciationPercentage,
      warrantyDaysLeft,
      warrantyEndDate,
      warrantyPercentage,
      warrantyActive: warrantyDaysLeft > 0,
      warrantyExpiringSoon: warrantyDaysLeft > 0 && warrantyDaysLeft <= 30,
    };
  }, [asset]);

  const assigneeName = asset?.assigned_employee?.full_name || null;
  const assigneeId = asset?.assigned_employee?.id || asset?.assigned_to || null;
  const employeeCode = asset?.assigned_employee?.employee_id || null;

  const warrantyLabel = useMemo(() => {
    if (!assetMetrics) return "Unknown";
    if (!assetMetrics.warrantyActive) return "Expired";
    if (assetMetrics.warrantyExpiringSoon) return "Expiring soon";
    return "Active";
  }, [assetMetrics]);

  const timelineEvents = useMemo(() => {
    if (!asset) return [];
    const events = [
      {
        key: "created",
        icon: CheckCircle,
        iconClass: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
        title: "Added to inventory",
        date: new Date(asset.created_at).toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
        }),
        description: "Asset record created in UHub.",
      },
    ];
    if (asset.purchase_date) {
      events.push({
        key: "purchase",
        icon: DollarSign,
        iconClass: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
        title: "Purchased",
        date: new Date(asset.purchase_date).toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric",
        }),
        description: asset.supplier ? `Supplier: ${asset.supplier}` : null,
      });
    }
    if (asset.assigned_to) {
      events.push({
        key: "assigned",
        icon: User,
        iconClass: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
        title: "Currently assigned",
        date: "Current assignment",
        description: assigneeName || "Assigned employee",
        assigneeLink: assigneeId,
      });
    }
    if (asset.status === "Maintenance") {
      events.push({
        key: "maintenance",
        icon: Wrench,
        iconClass: "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400",
        title: "In maintenance",
        date: "Current status",
        description: "This asset is marked as under maintenance.",
      });
    }
    return events;
  }, [asset, assigneeName, assigneeId]);

  const handleShare = useCallback((method) => {
    if (!asset) return;
    const url = window.location.href;
    const text = `Asset: ${asset.name}`;
    if (method === "copy") {
      navigator.clipboard.writeText(url);
      success("Copied", "Link copied to clipboard.");
    } else if (method === "email") {
      window.location.href = `mailto:?subject=${encodeURIComponent(asset.name)}&body=${encodeURIComponent(`${text}\n${url}`)}`;
    }
    setShowMoreMenu(false);
  }, [asset, success]);

  const handleAddNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      showError("Error", "Please fill in both title and content.");
      return;
    }
    setNotes((prev) => [{
      id: Date.now(),
      title: newNote.title.trim(),
      content: newNote.content.trim(),
      type: newNote.type,
      created_at: new Date().toISOString(),
      author: userProfile?.full_name || "You",
    }, ...prev]);
    setNewNote({ title: "", content: "", type: "general" });
    setShowAddNoteForm(false);
    success("Success", "Note saved locally.");
  };

  const confirmDeleteNote = () => {
    if (!noteDeleteId) return;
    setNotes((prev) => prev.filter((n) => n.id !== noteDeleteId));
    setNoteDeleteId(null);
    success("Success", "Note deleted.");
  };

  const handleDelete = async () => {
    try {
      await deleteAssetMutation.mutateAsync(id);
      if (notesStorageKey) localStorage.removeItem(notesStorageKey);
      success("Success", "Asset deleted successfully.");
      navigate("/assets");
    } catch (err) {
      showError("Delete Failed", err.message);
    }
  };

  const handleDownloadDetails = () => {
    if (!asset) return;
    const details = [
      "ASSET DETAILS",
      "=============",
      `Name: ${asset.name}`,
      `Type: ${asset.type}`,
      `Status: ${asset.status}`,
      `Asset Code: ${asset.asset_code || "N/A"}`,
      `Purchase Price: AED ${asset.purchase_price ? parseFloat(asset.purchase_price).toLocaleString() : "N/A"}`,
      `Purchase Date: ${asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : "N/A"}`,
      `Supplier: ${asset.supplier || "N/A"}`,
      `LPO Number: ${asset.lpo_number || "N/A"}`,
      `Assigned To: ${assigneeName ? `${assigneeName}${employeeCode ? ` (${employeeCode})` : ""}` : "N/A"}`,
      `Created: ${new Date(asset.created_at).toLocaleDateString()}`,
    ].join("\n");
    const blob = new Blob([details], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asset-${asset.asset_code || asset.id}-details.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    success("Downloaded", "Asset details exported.");
  };

  const getNoteTypeColor = (type) => {
    const map = {
      maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      issue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      update: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      general: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    return map[type] || map.general;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Asset</h3>
              <p className="text-red-600 dark:text-red-400 mt-1">{error?.message || "Asset not found"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 print:bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <ol className="flex items-center flex-wrap gap-2 text-sm">
            <li>
              <button type="button" onClick={() => navigate("/assets")} className="inline-flex items-center gap-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                <ArrowLeft className="w-4 h-4" />
                Assets
              </button>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 dark:text-white font-semibold truncate max-w-xs">{asset.name}</li>
          </ol>
        </nav>

        {/* Warranty alert */}
        {assetMetrics?.warrantyExpiringSoon && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 print:hidden"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Warranty expires in {assetMetrics.warrantyDaysLeft} day{assetMetrics.warrantyDaysLeft !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-0.5">
                Expires on {assetMetrics.warrantyEndDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} — plan renewal or replacement.
              </p>
            </div>
          </motion.div>
        )}

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden mb-6"
        >
          <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-750 px-6 py-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-2xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-inner flex items-center justify-center overflow-hidden shrink-0">
                {asset.asset_picture_url ? (
                  <img src={asset.asset_picture_url} alt={asset.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="text-blue-600 dark:text-blue-400">{getAssetIcon(asset.type, "w-12 h-12")}</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(asset.status)}`}>
                    {asset.status}
                  </span>
                  {asset.asset_code && (
                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-xs text-gray-700 dark:text-gray-300">
                      {asset.asset_code}
                    </span>
                  )}
                  {assetMetrics && (
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      !assetMetrics.warrantyActive
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : assetMetrics.warrantyExpiringSoon
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}>
                      Warranty: {warrantyLabel}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">{asset.name}</h1>
                <p className="text-gray-600 dark:text-gray-400">{asset.type}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 print:hidden">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => navigate(`/assets/${id}/edit`)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowQRCode(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <QrCode className="w-4 h-4" />
                  QR
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMoreMenu((v) => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    More
                  </button>
                  {showMoreMenu && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-20">
                      <button type="button" onClick={() => handleShare("copy")} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Share2 className="w-4 h-4" /> Copy link
                      </button>
                      <button type="button" onClick={() => handleShare("email")} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Email
                      </button>
                      <button type="button" onClick={() => { handleDownloadDetails(); setShowMoreMenu(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                      </button>
                      <button type="button" onClick={() => { window.print(); setShowMoreMenu(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <PrintIcon className="w-4 h-4" /> Print
                      </button>
                      {isAdmin && (
                        <>
                          <hr className="my-1 border-gray-200 dark:border-gray-700" />
                          <button type="button" onClick={() => { setShowDeleteConfirm(true); setShowMoreMenu(false); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                            <Trash className="w-4 h-4" /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-gray-200 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-white dark:bg-gray-800 p-4 col-span-1">
              <SummaryMetric icon={CheckCircle} label="Status" value={asset.status} accent="green" />
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 col-span-1">
              <SummaryMetric
                icon={User}
                label="Assignee"
                value={assigneeName || "Unassigned"}
                sub={employeeCode || undefined}
                accent="purple"
              />
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 col-span-1">
              <SummaryMetric
                icon={DollarSign}
                label="Purchase"
                value={asset.purchase_price ? `AED ${parseFloat(asset.purchase_price).toLocaleString()}` : "—"}
                sub={asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : undefined}
                accent="blue"
              />
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 col-span-1">
              <SummaryMetric
                icon={TrendingUp}
                label="Est. value"
                value={assetMetrics && asset.purchase_price ? `AED ${assetMetrics.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
                sub={assetMetrics ? `${assetMetrics.ageInYears} yrs old` : undefined}
                accent="amber"
              />
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 col-span-2 lg:col-span-1">
              <SummaryMetric
                icon={Shield}
                label="Warranty"
                value={warrantyLabel}
                sub={assetMetrics?.warrantyActive ? `${assetMetrics.warrantyDaysLeft} days left` : assetMetrics ? "Expired" : undefined}
                accent={assetMetrics?.warrantyExpiringSoon ? "amber" : "green"}
              />
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6 overflow-hidden print:hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: "details", label: "Details", icon: Info },
              { id: "history", label: "Timeline", icon: History },
              { id: "notes", label: "Notes", icon: FileText, badge: notes.length || null },
            ].map(({ id: tabId, label, icon: TabIcon, badge }) => (
              <button
                key={tabId}
                type="button"
                onClick={() => setActiveTab(tabId)}
                className={`flex-1 px-4 py-3.5 text-sm font-semibold transition-colors ${
                  activeTab === tabId
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <TabIcon className="w-4 h-4" />
                  {label}
                  {badge ? (
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">{badge}</span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={`grid gap-6 ${activeTab === "details" ? "lg:grid-cols-3" : ""}`}>
          <div className={activeTab === "details" ? "lg:col-span-2 space-y-6" : "space-y-6"}>
            {activeTab === "details" && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6"
                >
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-indigo-500" />
                    Procurement & assignment
                  </h2>
                  <dl className="grid sm:grid-cols-2 gap-x-8">
                    <DetailRow label="Asset code" value={asset.asset_code} mono />
                    <DetailRow label="Type" value={asset.type} />
                    <DetailRow
                      label="Purchase date"
                      value={asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null}
                    />
                    <DetailRow label="Supplier" value={asset.supplier} />
                    <DetailRow label="LPO number" value={asset.lpo_number} mono />
                    <DetailRow
                      label="Added to inventory"
                      value={new Date(asset.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    />
                    <div className="py-3 border-b border-gray-100 dark:border-gray-700 sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Assigned to</dt>
                      <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                        {assigneeId && assigneeName ? (
                          <Link
                            to={`/employee/${assigneeId}`}
                            className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {assigneeName}
                            {employeeCode && <span className="text-gray-500 font-normal">({employeeCode})</span>}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          "Not assigned"
                        )}
                      </dd>
                    </div>
                  </dl>
                </motion.div>

                {assetMetrics && asset.purchase_price > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6"
                  >
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-500" />
                      Financial overview
                      <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">(estimated)</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Depreciation</span>
                          <span className="font-bold text-orange-600">{assetMetrics.depreciationPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${assetMetrics.depreciationPercentage}%` }}
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Straight-line at 20% per year, max 5 years</p>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Warranty coverage</span>
                          <span className="font-bold text-blue-600">
                            {assetMetrics.warrantyActive ? `${assetMetrics.warrantyPercentage.toFixed(0)}%` : "Expired"}
                          </span>
                        </div>
                        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${assetMetrics.warrantyActive ? assetMetrics.warrantyPercentage : 0}%` }}
                            className={`h-full rounded-full ${
                              assetMetrics.warrantyExpiringSoon
                                ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                : assetMetrics.warrantyActive
                                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                : "bg-gray-400"
                            }`}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {assetMetrics.warrantyActive
                            ? `Expires ${assetMetrics.warrantyEndDate.toLocaleDateString()} (3-year estimate from purchase)`
                            : `Expired ${assetMetrics.warrantyEndDate.toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {asset.asset_picture_url && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6"
                  >
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Full-size image</h2>
                    <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      <img src={asset.asset_picture_url} alt={asset.name} className="w-full h-full object-contain bg-white dark:bg-gray-800" />
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {activeTab === "history" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 lg:p-8"
              >
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-500" />
                  Activity timeline
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Key milestones inferred from this asset record. Full audit history requires database logging.
                </p>
                <div>
                  {timelineEvents.map((event, index) => (
                    <TimelineEvent
                      key={event.key}
                      icon={event.icon}
                      iconClass={event.iconClass}
                      title={event.title}
                      date={event.date}
                      description={event.description}
                      isLast={index === timelineEvents.length - 1}
                    >
                      {event.assigneeLink && assigneeName && (
                        <Link
                          to={`/employee/${event.assigneeLink}`}
                          className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View employee profile <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </TimelineEvent>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "notes" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 lg:p-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-yellow-500" />
                      Notes
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Saved locally on this device</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddNoteForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl text-sm font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    Add note
                  </button>
                </div>

                {showAddNoteForm && (
                  <div className="mb-6 p-5 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10 space-y-4">
                    <select
                      value={newNote.type}
                      onChange={(e) => setNewNote({ ...newNote, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                    >
                      <option value="general">General</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="issue">Issue</option>
                      <option value="update">Update</option>
                    </select>
                    <input
                      type="text"
                      value={newNote.title}
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                      placeholder="Note title"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                    />
                    <textarea
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      placeholder="Note content"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={handleAddNote} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">Save</button>
                      <button type="button" onClick={() => { setShowAddNoteForm(false); setNewNote({ title: "", content: "", type: "general" }); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
                    </div>
                  </div>
                )}

                {notes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No notes yet. Add maintenance logs, issues, or updates here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getNoteTypeColor(note.type)}`}>{note.type}</span>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{note.title}</h4>
                          </div>
                          <button type="button" onClick={() => setNoteDeleteId(note.id)} className="text-gray-400 hover:text-red-500">
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{note.content}</p>
                        <p className="text-xs text-gray-500">{note.author} · {new Date(note.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar — details tab only */}
          {activeTab === "details" && (
            <div className="space-y-6">
              {assigneeId && assigneeName && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-500" />
                    Assigned employee
                  </h3>
                  <p className="font-semibold text-gray-900 dark:text-white">{assigneeName}</p>
                  {employeeCode && <p className="text-sm text-gray-500 font-mono mt-0.5">{employeeCode}</p>}
                  <Link
                    to={`/employee/${assigneeId}`}
                    className="mt-4 inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30"
                  >
                    View employee profile
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Quick actions
                </h3>
                <div className="space-y-2">
                  <button type="button" onClick={() => setShowQRCode(true)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700">
                    <QrCode className="w-4 h-4" /> Show QR code
                  </button>
                  <button type="button" onClick={() => setActiveTab("history")} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700">
                    <History className="w-4 h-4" /> View timeline
                  </button>
                  <button type="button" onClick={() => setActiveTab("notes")} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700">
                    <FileText className="w-4 h-4" /> {notes.length ? `${notes.length} note(s)` : "Add a note"}
                  </button>
                  <button type="button" onClick={handleDownloadDetails} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Download className="w-4 h-4" /> Export details
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  At a glance
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex justify-between"><span>Type</span><span className="font-medium text-gray-900 dark:text-white">{asset.type}</span></li>
                  <li className="flex justify-between"><span>Status</span><span className="font-medium text-gray-900 dark:text-white">{asset.status}</span></li>
                  {asset.supplier && <li className="flex justify-between gap-4"><span>Supplier</span><span className="font-medium text-gray-900 dark:text-white text-right truncate">{asset.supplier}</span></li>}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {showQRCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden" onClick={() => setShowQRCode(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Asset QR code</h3>
              <button type="button" onClick={() => setShowQRCode(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center">
              <img src={qrCodeUrl} alt={`QR for ${asset.name}`} className="w-56 h-56 mx-auto border border-gray-200 rounded-xl" />
              <p className="text-sm text-gray-500 mt-3 font-mono">{asset.asset_code || asset.name}</p>
              <div className="flex gap-2 mt-4">
                <a href={qrCodeUrl} download={`asset-${asset.asset_code || asset.id}-qr.png`} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium text-center">Download</a>
                <button
                  type="button"
                  onClick={() => {
                    const w = window.open("", "_blank");
                    if (w) {
                      w.document.write(`<img src="${qrCodeUrl}" style="width:256px" />`);
                      w.document.close();
                      w.print();
                    }
                  }}
                  className="flex-1 py-2.5 bg-gray-600 text-white rounded-xl text-sm font-medium"
                >
                  Print
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete asset?"
        message={`Permanently remove "${asset.name}" from inventory? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteAssetMutation.isLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmDialog
        open={Boolean(noteDeleteId)}
        title="Delete note?"
        message="Remove this note from local storage?"
        confirmLabel="Delete"
        onConfirm={confirmDeleteNote}
        onCancel={() => setNoteDeleteId(null)}
      />
    </div>
  );
}
