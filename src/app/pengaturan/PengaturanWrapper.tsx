"use client";

import * as React from "react";
import { Plus, ArrowUp, ArrowDown, X, CheckCircle2 } from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  createStaffAccountAction,
  updateStaffAccountAction,
  toggleStaffActiveAction,
  createStageTemplateAction,
  updateStageTemplateAction,
  toggleStagePhotoRequirementAction,
  reorderStageTemplateAction,
} from "@/server/api/pengaturan/pengaturanApi";
import { PeranUser } from "@prisma/client";

interface StaffItem {
  id: number;
  nama: string;
  email: string;
  peran: PeranUser;
  aktif: boolean;
}

interface StageItem {
  id: number;
  urutan: number;
  nama: string;
  wajib_foto: boolean;
}

interface PengaturanWrapperProps {
  initialStaffList: StaffItem[];
  initialStagesList: StageItem[];
}

export function PengaturanWrapper({
  initialStaffList,
  initialStagesList,
}: PengaturanWrapperProps) {
  const [activeTab, setActiveTab] = React.useState<"staf" | "tahapan">("staf");
  const [staffList, setStaffList] = React.useState<StaffItem[]>(initialStaffList);
  const [stagesList, setStagesList] = React.useState<StageItem[]>(initialStagesList);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  React.useEffect(() => {
    setStaffList(initialStaffList);
  }, [initialStaffList]);

  React.useEffect(() => {
    setStagesList(initialStagesList);
  }, [initialStagesList]);

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Staff Modals
  const [showAddStaffModal, setShowAddStaffModal] = React.useState(false);
  const [staffNama, setStaffNama] = React.useState("");
  const [staffEmail, setStaffEmail] = React.useState("");
  const [staffPassword, setStaffPassword] = React.useState("");
  const [staffRole, setStaffRole] = React.useState<PeranUser>(PeranUser.Montir);
  const [isSubmittingStaff, setIsSubmittingStaff] = React.useState(false);

  const [editStaffItem, setEditStaffItem] = React.useState<StaffItem | null>(null);
  const [editStaffNama, setEditStaffNama] = React.useState("");
  const [editStaffEmail, setEditStaffEmail] = React.useState("");
  const [editStaffPassword, setEditStaffPassword] = React.useState("");
  const [editStaffRole, setEditStaffRole] = React.useState<PeranUser>(PeranUser.Montir);
  const [isUpdatingStaff, setIsUpdatingStaff] = React.useState(false);

  // Stage Modals
  const [showAddStageModal, setShowAddStageModal] = React.useState(false);
  const [stageNama, setStageNama] = React.useState("");
  const [stageWajibFoto, setStageWajibFoto] = React.useState(true);
  const [isSubmittingStage, setIsSubmittingStage] = React.useState(false);

  const [editStageItem, setEditStageItem] = React.useState<StageItem | null>(null);
  const [editStageNama, setEditStageNama] = React.useState("");
  const [editStageWajibFoto, setEditStageWajibFoto] = React.useState(true);
  const [isUpdatingStage, setIsUpdatingStage] = React.useState(false);

  // Staff Actions
  const handleToggleStaffActive = async (id: number, currentActive: boolean) => {
    const nextVal = !currentActive;
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, aktif: nextVal } : s))
    );

    const res = await toggleStaffActiveAction(id, nextVal);
    if (!res.success) {
      setStaffList((prev) =>
        prev.map((s) => (s.id === id ? { ...s, aktif: currentActive } : s))
      );
      showNotification("error", res.error || "Gagal mengubah status aktif staf.");
    } else {
      showNotification("success", `Status akun staf diperbarui menjadi ${nextVal ? "Aktif" : "Nonaktif"}.`);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffNama.trim() || !staffEmail.trim() || !staffPassword.trim()) {
      alert("Nama, email, dan kata sandi staf wajib diisi!");
      return;
    }

    setIsSubmittingStaff(true);
    const res = await createStaffAccountAction({
      nama: staffNama.trim(),
      email: staffEmail.trim(),
      kataSandi: staffPassword.trim(),
      peran: staffRole,
    });
    setIsSubmittingStaff(false);

    if (res.success && res.data) {
      setStaffList((prev) => [...prev, res.data]);
      setShowAddStaffModal(false);
      setStaffNama("");
      setStaffEmail("");
      setStaffPassword("");
      setStaffRole(PeranUser.Montir);
      showNotification("success", `Akun staf "${res.data.nama}" berhasil dibuat.`);
    } else {
      alert(res.error || "Gagal membuat akun staf.");
    }
  };

  const handleOpenEditStaff = (staff: StaffItem) => {
    setEditStaffItem(staff);
    setEditStaffNama(staff.nama);
    setEditStaffEmail(staff.email);
    setEditStaffPassword("");
    setEditStaffRole(staff.peran);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStaffItem) return;

    setIsUpdatingStaff(true);
    const res = await updateStaffAccountAction(editStaffItem.id, {
      nama: editStaffNama.trim(),
      email: editStaffEmail.trim(),
      peran: editStaffRole,
      kataSandi: editStaffPassword.trim() ? editStaffPassword.trim() : undefined,
    });
    setIsUpdatingStaff(false);

    if (res.success && res.data) {
      setStaffList((prev) =>
        prev.map((s) => (s.id === editStaffItem.id ? { ...s, ...res.data } : s))
      );
      setEditStaffItem(null);
      showNotification("success", `Akun staf "${res.data.nama}" berhasil diperbarui.`);
    } else {
      alert(res.error || "Gagal memperbarui akun staf.");
    }
  };

  // Stage Actions
  const handleToggleStagePhoto = async (id: number, currentWajib: boolean) => {
    const nextVal = !currentWajib;
    setStagesList((prev) =>
      prev.map((stg) => (stg.id === id ? { ...stg, wajib_foto: nextVal } : stg))
    );

    const res = await toggleStagePhotoRequirementAction(id, nextVal);
    if (!res.success) {
      setStagesList((prev) =>
        prev.map((stg) => (stg.id === id ? { ...stg, wajib_foto: currentWajib } : stg))
      );
      showNotification("error", res.error || "Gagal mengubah aturan wajib foto.");
    } else {
      showNotification("success", `Aturan foto untuk tahapan tersebut diubah.`);
    }
  };

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageNama.trim()) {
      alert("Nama tahapan wajib diisi!");
      return;
    }

    setIsSubmittingStage(true);
    const res = await createStageTemplateAction({
      nama: stageNama.trim(),
      wajib_foto: stageWajibFoto,
    });
    setIsSubmittingStage(false);

    if (res.success && res.data) {
      setStagesList((prev) => [...prev, res.data]);
      setShowAddStageModal(false);
      setStageNama("");
      setStageWajibFoto(true);
      showNotification("success", `Tahapan "${res.data.nama}" berhasil ditambahkan.`);
    } else {
      alert(res.error || "Gagal menambahkan tahapan baru.");
    }
  };

  const handleOpenEditStage = (stage: StageItem) => {
    setEditStageItem(stage);
    setEditStageNama(stage.nama);
    setEditStageWajibFoto(stage.wajib_foto);
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStageItem) return;

    setIsUpdatingStage(true);
    const res = await updateStageTemplateAction(editStageItem.id, {
      nama: editStageNama.trim(),
      wajib_foto: editStageWajibFoto,
    });
    setIsUpdatingStage(false);

    if (res.success && res.data) {
      setStagesList((prev) =>
        prev.map((stg) => (stg.id === editStageItem.id ? { ...stg, ...res.data } : stg))
      );
      setEditStageItem(null);
      showNotification("success", `Tahapan "${res.data.nama}" berhasil diperbarui.`);
    } else {
      alert(res.error || "Gagal memperbarui tahapan.");
    }
  };

  const handleMoveStage = async (stageId: number, direction: "up" | "down") => {
    const res = await reorderStageTemplateAction(stageId, direction);
    if (res.success) {
      const idx = stagesList.findIndex((s) => s.id === stageId);
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (idx !== -1 && targetIdx >= 0 && targetIdx < stagesList.length) {
        const copy = [...stagesList];
        const temp = copy[idx];
        copy[idx] = copy[targetIdx];
        copy[targetIdx] = temp;
        setStagesList(copy.map((s, i) => ({ ...s, urutan: i + 1 })));
      }
      showNotification("success", "Urutan tahapan berhasil diperbarui.");
    } else {
      showNotification("error", res.error || "Gagal mengubah urutan.");
    }
  };

  return (
    <StaffLayout>
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Pengaturan
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Manajemen hak akses akun staf bengkel dan konfigurasi template tahapan pengerjaan modifikasi.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/60 border-rose-200 text-rose-800 dark:text-rose-300"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tab Navigation Sesuai Wireframe Page 11 */}
      <div className="border-b border-slate-200 dark:border-zinc-800 flex gap-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("staf")}
          className={`pb-3 relative transition-colors ${
            activeTab === "staf"
              ? "text-orange-600 dark:text-orange-400 border-b-2 border-orange-500"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Akun Staf
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tahapan")}
          className={`pb-3 relative transition-colors ${
            activeTab === "tahapan"
              ? "text-orange-600 dark:text-orange-400 border-b-2 border-orange-500"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Template Tahapan
        </button>
      </div>

      {/* Content Tab 1: Akun Staf Sesuai Wireframe Page 11 */}
      {activeTab === "staf" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <CardTitle className="text-base">Akun Staf Bengkel</CardTitle>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Kelola hak akses untuk Admin/Kasir, Montir, dan Pemilik Usaha.
              </p>
            </div>
            <Button
              size="sm"
              className="text-xs"
              onClick={() => setShowAddStaffModal(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>+ Akun Staf</span>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Nama</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Peran</th>
                    <th className="py-3 px-4 text-center">Aktif</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {staffList.map((staf) => (
                    <tr key={staf.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {staf.nama}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-zinc-300 font-mono">
                        {staf.email}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            staf.peran === PeranUser.Admin
                              ? "info"
                              : staf.peran === PeranUser.Montir
                              ? "progress"
                              : "ready"
                          }
                          className="text-[10px]"
                        >
                          {staf.peran}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={staf.aktif}
                          onChange={() => handleToggleStaffActive(staf.id, staf.aktif)}
                          className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2.5 text-[11px]"
                          onClick={() => handleOpenEditStaff(staf)}
                        >
                          Ubah
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Content Tab 2: Template Tahapan Sesuai Wireframe Page 11 */
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <CardTitle className="text-base">Template Tahapan Pengerjaan</CardTitle>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Urutan tahapan baku yang akan diterapkan saat membuat pesanan modifikasi baru.
              </p>
            </div>
            <Button
              size="sm"
              className="text-xs"
              onClick={() => setShowAddStageModal(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>+ Tahap</span>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4 text-center w-16">Urutan</th>
                    <th className="py-3 px-4">Nama Tahap</th>
                    <th className="py-3 px-4 text-center">Wajib Foto</th>
                    <th className="py-3 px-4 text-center">Aksi & Urutan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {stagesList.map((stg, idx) => (
                    <tr key={stg.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-4 text-center font-bold text-slate-500">
                        {stg.urutan}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {stg.nama}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stg.wajib_foto}
                            onChange={() => handleToggleStagePhoto(stg.id, stg.wajib_foto)}
                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                          />
                          <span className="text-[11px] text-slate-500">
                            {stg.wajib_foto ? "Wajib" : "Opsional"}
                          </span>
                        </label>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            onClick={() => handleOpenEditStage(stg)}
                          >
                            Ubah
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={idx === 0}
                            onClick={() => handleMoveStage(stg.id, "up")}
                            className="h-6 px-1.5 text-[11px]"
                            title="Naikkan urutan"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={idx === stagesList.length - 1}
                            onClick={() => handleMoveStage(stg.id, "down")}
                            className="h-6 px-1.5 text-[11px]"
                            title="Turunkan urutan"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Tambah Staf Baru */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Tambah Akun Staf Baru
              </h3>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={staffNama}
                  onChange={(e) => setStaffNama(e.target.value)}
                  placeholder="Contoh: Andi Pratama"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="andi.montir@garagelog.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Kata Sandi</label>
                <input
                  type="password"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Peran Hak Akses</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as PeranUser)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg"
                >
                  <option value={PeranUser.Admin}>Admin / Kasir</option>
                  <option value={PeranUser.Montir}>Montir</option>
                  <option value={PeranUser.Pemilik}>Pemilik Usaha</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddStaffModal(false)}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isSubmittingStaff}>
                  {isSubmittingStaff ? "Menyimpan..." : "Simpan Akun"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ubah Staf */}
      {editStaffItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Ubah Akun Staf
              </h3>
              <button
                onClick={() => setEditStaffItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateStaff} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editStaffNama}
                  onChange={(e) => setEditStaffNama(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editStaffEmail}
                  onChange={(e) => setEditStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">
                  Kata Sandi Baru (Kosongkan bila tidak diubah)
                </label>
                <input
                  type="password"
                  value={editStaffPassword}
                  onChange={(e) => setEditStaffPassword(e.target.value)}
                  placeholder="Isi untuk reset kata sandi"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Peran Hak Akses</label>
                <select
                  value={editStaffRole}
                  onChange={(e) => setEditStaffRole(e.target.value as PeranUser)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg"
                >
                  <option value={PeranUser.Admin}>Admin / Kasir</option>
                  <option value={PeranUser.Montir}>Montir</option>
                  <option value={PeranUser.Pemilik}>Pemilik Usaha</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditStaffItem(null)}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isUpdatingStaff}>
                  {isUpdatingStaff ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Tahapan Baru */}
      {showAddStageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Tambah Template Tahapan Baru
              </h3>
              <button
                onClick={() => setShowAddStageModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStage} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Nama Tahapan</label>
                <input
                  type="text"
                  required
                  value={stageNama}
                  onChange={(e) => setStageNama(e.target.value)}
                  placeholder="Contoh: Dyno Test & Kalibrasi ECU"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg"
                />
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={stageWajibFoto}
                    onChange={(e) => setStageWajibFoto(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                  />
                  <span>Wajib Unggah Foto Sebelum Tahap Diselesaikan (FR-18)</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddStageModal(false)}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isSubmittingStage}>
                  {isSubmittingStage ? "Menyimpan..." : "Simpan Tahapan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ubah Tahapan */}
      {editStageItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Ubah Template Tahapan
              </h3>
              <button
                onClick={() => setEditStageItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateStage} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Nama Tahapan</label>
                <input
                  type="text"
                  required
                  value={editStageNama}
                  onChange={(e) => setEditStageNama(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg"
                />
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={editStageWajibFoto}
                    onChange={(e) => setEditStageWajibFoto(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                  />
                  <span>Wajib Unggah Foto Sebelum Tahap Diselesaikan (FR-18)</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditStageItem(null)}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isUpdatingStage}>
                  {isUpdatingStage ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
