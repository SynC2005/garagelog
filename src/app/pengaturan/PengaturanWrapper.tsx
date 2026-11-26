"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  Save,
  Lock,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { LandingSettingsTab } from "./LandingSettingsTab";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createStaffAccountAction,
  updateStaffAccountAction,
  toggleStaffActiveAction,
  createStageTemplateAction,
  updateStageTemplateAction,
  toggleStagePhotoRequirementAction,
  reorderStageTemplateAction,
  updateRolePermissionsAction,
  resetRolePermissionsAction,
} from "@/server/api/pengaturan/pengaturanApi";
import {
  DEFAULT_LANDING_SETTINGS,
  type CustomerReviewItem,
  type LandingSettingsData,
} from "@/lib/landingDefaults";
import { PeranUser } from "@prisma/client";
import {
  DEFAULT_ROLE_PERMISSIONS,
  RBAC_FEATURES,
  type FeatureCode,
  type RolePermissionsMap,
} from "@/lib/rbac";

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

interface RolePermissionRecord {
  id: number;
  peran: PeranUser;
  fitur_kode: string;
  nama_fitur: string;
  rute: string;
  dapat_akses: boolean;
  dapat_kelola: boolean;
}

interface PengaturanWrapperProps {
  initialStaffList: StaffItem[];
  initialStagesList: StageItem[];
  initialPermissionsList: RolePermissionRecord[];
  initialLandingSettings?: LandingSettingsData;
  initialReviewsList?: CustomerReviewItem[];
  activeStaff?: {
    nama: string;
    peran: PeranUser;
  };
  allowedFeatures?: Partial<Record<FeatureCode, boolean>>;
  canManage?: boolean;
}

type MatrixState = Record<PeranUser, RolePermissionsMap>;

function buildMatrixFromList(list: RolePermissionRecord[]): MatrixState {
  const matrix: MatrixState = {
    Admin: structuredClone(DEFAULT_ROLE_PERMISSIONS.Admin),
    Montir: structuredClone(DEFAULT_ROLE_PERMISSIONS.Montir),
    Pemilik: structuredClone(DEFAULT_ROLE_PERMISSIONS.Pemilik),
  };
  for (const row of list) {
    const code = row.fitur_kode as FeatureCode;
    if (matrix[row.peran] && code in matrix[row.peran]) {
      matrix[row.peran][code] = {
        dapat_akses: row.dapat_akses,
        dapat_kelola: row.dapat_kelola,
      };
    }
  }
  matrix.Admin.pengaturan = { dapat_akses: true, dapat_kelola: true };
  return matrix;
}

const ROLE_OPTIONS: {
  peran: PeranUser;
  label: string;
  deskripsi: string;
}[] = [
  {
    peran: PeranUser.Montir,
    label: "Montir",
    deskripsi:
      "Fokus pengerjaan modifikasi motor di lapangan (Tugas Pengerjaan, upload foto progres, dan lihat pesanan).",
  },
  {
    peran: PeranUser.Admin,
    label: "Admin / Kasir",
    deskripsi:
      "Operasional harian bengkel: kelola pelanggan, pesanan, pembayaran, stok suku cadang, dan pengaturan sistem.",
  },
  {
    peran: PeranUser.Pemilik,
    label: "Pemilik Usaha",
    deskripsi:
      "Pemantauan bisnis, analitik omzet & durasi pengerjaan, serta pemantauan data master secara baca-saja.",
  },
];

export function PengaturanWrapper({
  initialStaffList,
  initialStagesList,
  initialPermissionsList,
  initialLandingSettings = DEFAULT_LANDING_SETTINGS,
  initialReviewsList = [],
  activeStaff,
  allowedFeatures,
  canManage = true,
}: PengaturanWrapperProps) {
  const router = useRouter();
  const [staffList, setStaffList] =
    React.useState<StaffItem[]>(initialStaffList);
  const [stagesList, setStagesList] =
    React.useState<StageItem[]>(initialStagesList);
  const [permissionMatrix, setPermissionMatrix] = React.useState<MatrixState>(
    () => buildMatrixFromList(initialPermissionsList)
  );
  const [selectedRole, setSelectedRole] = React.useState<PeranUser>(
    PeranUser.Montir
  );
  const [hasUnsavedPermissions, setHasUnsavedPermissions] =
    React.useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = React.useState(false);

  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  React.useEffect(() => {
    setStaffList(initialStaffList);
  }, [initialStaffList]);

  React.useEffect(() => {
    setStagesList(initialStagesList);
  }, [initialStagesList]);

  React.useEffect(() => {
    setPermissionMatrix(buildMatrixFromList(initialPermissionsList));
    setHasUnsavedPermissions(false);
  }, [initialPermissionsList]);

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  // Staff Modals
  const [showAddStaffModal, setShowAddStaffModal] = React.useState(false);
  const [staffNama, setStaffNama] = React.useState("");
  const [staffEmail, setStaffEmail] = React.useState("");
  const [staffPassword, setStaffPassword] = React.useState("");
  const [staffRole, setStaffRole] = React.useState<PeranUser>(PeranUser.Montir);
  const [isSubmittingStaff, setIsSubmittingStaff] = React.useState(false);

  const [editStaffItem, setEditStaffItem] = React.useState<StaffItem | null>(
    null
  );
  const [editStaffNama, setEditStaffNama] = React.useState("");
  const [editStaffEmail, setEditStaffEmail] = React.useState("");
  const [editStaffPassword, setEditStaffPassword] = React.useState("");
  const [editStaffRole, setEditStaffRole] = React.useState<PeranUser>(
    PeranUser.Montir
  );
  const [isUpdatingStaff, setIsUpdatingStaff] = React.useState(false);

  // Stage Modals
  const [showAddStageModal, setShowAddStageModal] = React.useState(false);
  const [stageNama, setStageNama] = React.useState("");
  const [stageWajibFoto, setStageWajibFoto] = React.useState(true);
  const [isSubmittingStage, setIsSubmittingStage] = React.useState(false);

  const [editStageItem, setEditStageItem] = React.useState<StageItem | null>(
    null
  );
  const [editStageNama, setEditStageNama] = React.useState("");
  const [editStageWajibFoto, setEditStageWajibFoto] = React.useState(true);
  const [isUpdatingStage, setIsUpdatingStage] = React.useState(false);

  // Staff Actions
  const handleToggleStaffActive = async (
    id: number,
    currentActive: boolean
  ) => {
    const nextVal = !currentActive;
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, aktif: nextVal } : s))
    );

    const res = await toggleStaffActiveAction(id, nextVal);
    if (!res.success) {
      setStaffList((prev) =>
        prev.map((s) => (s.id === id ? { ...s, aktif: currentActive } : s))
      );
      showNotification(
        "error",
        res.error || "Gagal mengubah status aktif staf."
      );
    } else {
      showNotification(
        "success",
        `Status akun staf diperbarui menjadi ${nextVal ? "Aktif" : "Nonaktif"}.`
      );
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffNama.trim() || !staffEmail.trim() || !staffPassword.trim()) {
      toast.error("Nama, email, dan kata sandi staf wajib diisi!");
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
      showNotification(
        "success",
        `Akun staf "${res.data.nama}" berhasil dibuat.`
      );
    } else {
      toast.error(res.error || "Gagal membuat akun staf.");
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
      kataSandi: editStaffPassword.trim()
        ? editStaffPassword.trim()
        : undefined,
    });
    setIsUpdatingStaff(false);

    if (res.success && res.data) {
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === editStaffItem.id ? { ...s, ...res.data } : s
        )
      );
      setEditStaffItem(null);
      showNotification(
        "success",
        `Akun staf "${res.data.nama}" berhasil diperbarui.`
      );
    } else {
      toast.error(res.error || "Gagal memperbarui akun staf.");
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
        prev.map((stg) =>
          stg.id === id ? { ...stg, wajib_foto: currentWajib } : stg
        )
      );
      showNotification("error", res.error || "Gagal mengubah aturan wajib foto.");
    } else {
      showNotification(
        "success",
        "Aturan foto untuk tahapan tersebut diubah."
      );
    }
  };

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageNama.trim()) {
      toast.error("Nama tahapan wajib diisi!");
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
      showNotification(
        "success",
        `Tahapan "${res.data.nama}" berhasil ditambahkan.`
      );
    } else {
      toast.error(res.error || "Gagal menambahkan tahapan baru.");
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
        prev.map((stg) =>
          stg.id === editStageItem.id ? { ...stg, ...res.data } : stg
        )
      );
      setEditStageItem(null);
      showNotification(
        "success",
        `Tahapan "${res.data.nama}" berhasil diperbarui.`
      );
    } else {
      toast.error(res.error || "Gagal memperbarui tahapan.");
    }
  };

  const handleMoveStage = async (
    stageId: number,
    direction: "up" | "down"
  ) => {
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

  // RBAC Permission Handlers
  const handleTogglePermission = (
    featureCode: FeatureCode,
    field: "dapat_akses" | "dapat_kelola",
    nextVal: boolean
  ) => {
    if (selectedRole === PeranUser.Admin && featureCode === "pengaturan") {
      return;
    }

    const meta = RBAC_FEATURES.find((f) => f.kode === featureCode);

    setPermissionMatrix((prev) => {
      const rolePerms = { ...prev[selectedRole] };
      const current = { ...rolePerms[featureCode] };

      if (field === "dapat_akses") {
        current.dapat_akses = nextVal;
        if (!nextVal) {
          current.dapat_kelola = false;
        } else if (meta && !meta.supportsManage) {
          current.dapat_kelola = true;
        }
      } else {
        current.dapat_kelola = nextVal;
        if (nextVal) {
          current.dapat_akses = true;
        }
      }

      rolePerms[featureCode] = current;
      return { ...prev, [selectedRole]: rolePerms };
    });

    setHasUnsavedPermissions(true);
  };

  const handleSavePermissions = async () => {
    setIsSavingPermissions(true);
    const currentRoleMatrix = permissionMatrix[selectedRole];
    const updates = RBAC_FEATURES.map((f) => ({
      fitur_kode: f.kode,
      dapat_akses: currentRoleMatrix[f.kode].dapat_akses,
      dapat_kelola: currentRoleMatrix[f.kode].dapat_kelola,
    }));

    const res = await updateRolePermissionsAction(selectedRole, updates);
    setIsSavingPermissions(false);

    if (res.success) {
      setHasUnsavedPermissions(false);
      showNotification(
        "success",
        `Konfigurasi hak akses peran ${selectedRole} berhasil disimpan.`
      );
      router.refresh();
    } else {
      showNotification(
        "error",
        res.error || "Gagal menyimpan konfigurasi hak akses."
      );
    }
  };

  const handleResetRolePermissions = async () => {
    setIsSavingPermissions(true);
    const res = await resetRolePermissionsAction(selectedRole);
    setIsSavingPermissions(false);

    if (res.success) {
      setPermissionMatrix((prev) => ({
        ...prev,
        [selectedRole]: structuredClone(DEFAULT_ROLE_PERMISSIONS[selectedRole]),
      }));
      setHasUnsavedPermissions(false);
      showNotification(
        "success",
        `Hak akses peran ${selectedRole} dikembalikan ke pengaturan bawaan.`
      );
      router.refresh();
    } else {
      showNotification(
        "error",
        res.error || "Gagal mereset hak akses ke default."
      );
    }
  };

  const selectedRoleInfo = ROLE_OPTIONS.find((r) => r.peran === selectedRole)!;
  const activeRoleRules = permissionMatrix[selectedRole];
  const accessCount = RBAC_FEATURES.filter(
    (f) => activeRoleRules[f.kode].dapat_akses
  ).length;
  const manageCount = RBAC_FEATURES.filter(
    (f) =>
      activeRoleRules[f.kode].dapat_akses &&
      activeRoleRules[f.kode].dapat_kelola
  ).length;

  return (
    <StaffLayout activeStaff={activeStaff} allowedFeatures={allowedFeatures}>
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Pengaturan
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manajemen akun staf bengkel, konfigurasi template tahapan, dan matriks
          hak akses tiap peran.
        </p>
      </div>

      {feedback && (
        <Alert
          variant={feedback.type === "error" ? "destructive" : "default"}
          className={
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : undefined
          }
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="size-4" />
          )}
          <AlertDescription className="text-xs font-medium text-current">
            {feedback.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs Navigation */}
      <Tabs defaultValue="staf" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="staf" className="text-xs sm:text-sm">
            Akun Staf
          </TabsTrigger>
          <TabsTrigger value="tahapan" className="text-xs sm:text-sm">
            Template Tahapan
          </TabsTrigger>
          <TabsTrigger value="hak-akses" className="text-xs sm:text-sm gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            <span>Konfigurasi Hak Akses</span>
          </TabsTrigger>
          <TabsTrigger value="landing" className="text-xs sm:text-sm gap-1.5">
            <Globe className="size-3.5" aria-hidden="true" />
            <span>Landing Page</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Akun Staf */}
        <TabsContent value="staf">
          <Card className="py-0 gap-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between gap-2 space-y-0 border-b border-border">
              <div>
                <CardTitle className="text-base font-semibold">
                  Akun Staf Bengkel
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kelola akun login untuk Admin/Kasir, Montir, dan Pemilik Usaha.
                </p>
              </div>
              {canManage && (
                <Button size="xs" onClick={() => setShowAddStaffModal(true)}>
                  <Plus className="size-3.5" aria-hidden="true" />
                  <span>Tambah Staf</span>
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table className="text-xs">
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead className="px-4">Nama</TableHead>
                    <TableHead className="px-4">Email</TableHead>
                    <TableHead className="px-4">Peran</TableHead>
                    <TableHead className="px-4 text-center">Aktif</TableHead>
                    {canManage && (
                      <TableHead className="px-4 text-center">Aksi</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.map((staf) => (
                    <TableRow key={staf.id}>
                      <TableCell className="px-4 py-3 font-semibold text-foreground">
                        {staf.nama}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground font-mono">
                        {staf.email}
                      </TableCell>
                      <TableCell className="px-4 py-3">
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
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={staf.aktif}
                            disabled={!canManage}
                            aria-label={`Aktifkan akun ${staf.nama}`}
                            onCheckedChange={() =>
                              handleToggleStaffActive(staf.id, staf.aktif)
                            }
                          />
                        </div>
                      </TableCell>
                      {canManage && (
                        <TableCell className="px-4 py-3 text-center">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleOpenEditStaff(staf)}
                          >
                            Ubah
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Template Tahapan */}
        <TabsContent value="tahapan">
          <Card className="py-0 gap-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between gap-2 space-y-0 border-b border-border">
              <div>
                <CardTitle className="text-base font-semibold">
                  Template Tahapan Pengerjaan
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Urutan tahapan baku yang akan diterapkan saat membuat pesanan
                  modifikasi baru.
                </p>
              </div>
              {canManage && (
                <Button size="xs" onClick={() => setShowAddStageModal(true)}>
                  <Plus className="size-3.5" aria-hidden="true" />
                  <span>Tambah Tahap</span>
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table className="text-xs">
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead className="px-4 text-center w-16">
                      Urutan
                    </TableHead>
                    <TableHead className="px-4">Nama Tahap</TableHead>
                    <TableHead className="px-4 text-center">
                      Wajib Foto
                    </TableHead>
                    {canManage && (
                      <TableHead className="px-4 text-center">
                        Aksi &amp; Urutan
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stagesList.map((stg, idx) => (
                    <TableRow key={stg.id}>
                      <TableCell className="px-4 py-3 text-center font-bold tabular-nums text-muted-foreground">
                        {stg.urutan}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-semibold text-foreground">
                        {stg.nama}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={stg.wajib_foto}
                            disabled={!canManage}
                            aria-label={`Wajib foto untuk tahap ${stg.nama}`}
                            onCheckedChange={() =>
                              handleToggleStagePhoto(stg.id, stg.wajib_foto)
                            }
                          />
                          <span className="text-[11px] text-muted-foreground">
                            {stg.wajib_foto ? "Wajib" : "Opsional"}
                          </span>
                        </label>
                      </TableCell>
                      {canManage && (
                        <TableCell className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleOpenEditStage(stg)}
                            >
                              Ubah
                            </Button>
                            <Button
                              variant="outline"
                              size="icon-xs"
                              disabled={idx === 0}
                              onClick={() => handleMoveStage(stg.id, "up")}
                              aria-label={`Naikkan urutan ${stg.nama}`}
                              title="Naikkan urutan"
                            >
                              <ArrowUp className="size-3" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon-xs"
                              disabled={idx === stagesList.length - 1}
                              onClick={() => handleMoveStage(stg.id, "down")}
                              aria-label={`Turunkan urutan ${stg.nama}`}
                              title="Turunkan urutan"
                            >
                              <ArrowDown className="size-3" aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Konfigurasi Hak Akses */}
        <TabsContent value="hak-akses" className="space-y-4">
          <Card className="py-0 gap-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ShieldCheck
                      className="size-4 text-primary"
                      aria-hidden="true"
                    />
                    <span>Matriks Hak Akses Peran (RBAC)</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Atur menu apa saja yang dapat dibuka dan dikelola oleh
                    masing-masing peran staf (berlaku di UI dan validasi server).
                  </p>
                </div>

                {hasUnsavedPermissions && (
                  <Badge variant="pending" className="text-[11px]">
                    Perubahan belum disimpan
                  </Badge>
                )}
              </div>

              {/* Pemilih Peran */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {ROLE_OPTIONS.map((opt) => {
                  const isActive = selectedRole === opt.peran;
                  const roleRules = permissionMatrix[opt.peran];
                  const activeMenus = RBAC_FEATURES.filter(
                    (f) => roleRules[f.kode].dapat_akses
                  ).length;

                  return (
                    <button
                      key={opt.peran}
                      type="button"
                      onClick={() => {
                        setSelectedRole(opt.peran);
                        setHasUnsavedPermissions(false);
                        setPermissionMatrix(
                          buildMatrixFromList(initialPermissionsList)
                        );
                      }}
                      className={`text-left p-3 rounded-lg border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isActive
                          ? "border-primary bg-primary/5 dark:bg-primary/10"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-bold ${
                            isActive ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {opt.label}
                        </span>
                        <Badge
                          variant={
                            opt.peran === PeranUser.Admin
                              ? "info"
                              : opt.peran === PeranUser.Montir
                              ? "progress"
                              : "ready"
                          }
                          className="text-[10px] tabular-nums"
                        >
                          {activeMenus}/{RBAC_FEATURES.length} Modul
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {opt.deskripsi}
                      </p>
                    </button>
                  );
                })}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Info ringkas peran aktif */}
              <div className="px-4 sm:px-5 py-3 bg-muted/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="text-muted-foreground">
                  Mengatur izin untuk peran{" "}
                  <strong className="text-foreground">
                    {selectedRoleInfo.label}
                  </strong>
                  : <span className="tabular-nums font-medium">{accessCount}</span>{" "}
                  modul dapat diakses,{" "}
                  <span className="tabular-nums font-medium">{manageCount}</span>{" "}
                  modul akses penuh (kelola).
                </div>
                {selectedRole === PeranUser.Admin && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Lock className="size-3" aria-hidden="true" />
                    Pengaturan sistem terkunci aktif untuk Admin
                  </span>
                )}
              </div>

              <Table className="text-xs">
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead className="px-4">Fitur / Modul</TableHead>
                    <TableHead className="px-4 text-center w-36">
                      Akses Menu (Lihat)
                    </TableHead>
                    <TableHead className="px-4 text-center w-40">
                      Kelola Data (CRUD)
                    </TableHead>
                    <TableHead className="px-4 text-center w-36">
                      Status Izin
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {RBAC_FEATURES.map((feature) => {
                    const rule = activeRoleRules[feature.kode];
                    const isLockedAdminSettings =
                      selectedRole === PeranUser.Admin &&
                      feature.kode === "pengaturan";

                    const statusBadge = !rule.dapat_akses ? (
                      <Badge variant="cancelled" className="text-[10px]">
                        Diblokir
                      </Badge>
                    ) : rule.dapat_kelola || !feature.supportsManage ? (
                      <Badge variant="ready" className="text-[10px]">
                        Akses Penuh
                      </Badge>
                    ) : (
                      <Badge variant="pending" className="text-[10px]">
                        Lihat Saja
                      </Badge>
                    );

                    return (
                      <TableRow key={feature.kode}>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">
                              {feature.nama}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {feature.rute}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {feature.deskripsi}
                          </p>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={rule.dapat_akses}
                              disabled={!canManage || isLockedAdminSettings}
                              aria-label={`Akses menu ${feature.nama} untuk ${selectedRole}`}
                              onCheckedChange={(checked) =>
                                handleTogglePermission(
                                  feature.kode,
                                  "dapat_akses",
                                  checked
                                )
                              }
                            />
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-center">
                          {feature.supportsManage ? (
                            <div className="flex justify-center">
                              <Switch
                                checked={rule.dapat_akses && rule.dapat_kelola}
                                disabled={
                                  !canManage ||
                                  !rule.dapat_akses ||
                                  isLockedAdminSettings
                                }
                                aria-label={`Kelola data ${feature.nama} untuk ${selectedRole}`}
                                onCheckedChange={(checked) =>
                                  handleTogglePermission(
                                    feature.kode,
                                    "dapat_kelola",
                                    checked
                                  )
                                }
                              />
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              &mdash;
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="px-4 py-3 text-center">
                          {statusBadge}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {canManage && (
                <div className="p-4 sm:p-5 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSavingPermissions}
                    onClick={handleResetRolePermissions}
                    className="w-full sm:w-auto text-xs"
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    <span>Reset Default {selectedRoleInfo.label}</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    disabled={isSavingPermissions}
                    onClick={handleSavePermissions}
                    className="w-full sm:w-auto text-xs font-semibold"
                  >
                    <Save className="size-3.5" aria-hidden="true" />
                    <span>
                      {isSavingPermissions
                        ? "Menyimpan..."
                        : `Simpan Hak Akses ${selectedRoleInfo.label}`}
                    </span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Pengaturan Landing Page */}
        <TabsContent value="landing">
          <LandingSettingsTab
            initialSettings={initialLandingSettings}
            initialReviews={initialReviewsList}
            canManage={canManage}
            onNotify={showNotification}
          />
        </TabsContent>
      </Tabs>

      {/* Modal Tambah Staf Baru */}
      <Dialog open={showAddStaffModal} onOpenChange={setShowAddStaffModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Akun Staf Baru</DialogTitle>
            <DialogDescription className="text-xs">
              Buat akun login untuk admin/kasir, montir bengkel, atau pemilik
              usaha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="add-staff-name" className="text-xs font-semibold">
                Nama Lengkap
              </Label>
              <Input
                id="add-staff-name"
                type="text"
                required
                value={staffNama}
                onChange={(e) => setStaffNama(e.target.value)}
                placeholder="Contoh: Andi Pratama"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="add-staff-email"
                className="text-xs font-semibold"
              >
                Email
              </Label>
              <Input
                id="add-staff-email"
                type="email"
                required
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="andi.montir@garagelog.com"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-staff-pass" className="text-xs font-semibold">
                Kata Sandi
              </Label>
              <Input
                id="add-staff-pass"
                type="password"
                required
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Peran Hak Akses</Label>
              <Select
                value={staffRole}
                onValueChange={(val) => setStaffRole(val as PeranUser)}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PeranUser.Admin}>Admin / Kasir</SelectItem>
                  <SelectItem value={PeranUser.Montir}>Montir</SelectItem>
                  <SelectItem value={PeranUser.Pemilik}>Pemilik Usaha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-3">
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Ubah Staf */}
      <Dialog
        open={Boolean(editStaffItem)}
        onOpenChange={(open) => {
          if (!open) setEditStaffItem(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Akun Staf</DialogTitle>
            <DialogDescription className="text-xs">
              Perbarui profil, peran akses, atau reset kata sandi akun staf.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateStaff} className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-staff-name"
                className="text-xs font-semibold"
              >
                Nama Lengkap
              </Label>
              <Input
                id="edit-staff-name"
                type="text"
                required
                value={editStaffNama}
                onChange={(e) => setEditStaffNama(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-staff-email"
                className="text-xs font-semibold"
              >
                Email
              </Label>
              <Input
                id="edit-staff-email"
                type="email"
                required
                value={editStaffEmail}
                onChange={(e) => setEditStaffEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-staff-pass"
                className="text-xs font-semibold"
              >
                Kata Sandi Baru (Kosongkan bila tidak diubah)
              </Label>
              <Input
                id="edit-staff-pass"
                type="password"
                value={editStaffPassword}
                onChange={(e) => setEditStaffPassword(e.target.value)}
                placeholder="Isi untuk reset kata sandi"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Peran Hak Akses</Label>
              <Select
                value={editStaffRole}
                onValueChange={(val) => setEditStaffRole(val as PeranUser)}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PeranUser.Admin}>Admin / Kasir</SelectItem>
                  <SelectItem value={PeranUser.Montir}>Montir</SelectItem>
                  <SelectItem value={PeranUser.Pemilik}>Pemilik Usaha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-3">
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Tambah Tahapan Baru */}
      <Dialog open={showAddStageModal} onOpenChange={setShowAddStageModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Template Tahapan Baru</DialogTitle>
            <DialogDescription className="text-xs">
              Tambahkan tahapan standar pengerjaan yang muncul pada formulir
              pesanan baru.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateStage} className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="add-stage-name" className="text-xs font-semibold">
                Nama Tahapan
              </Label>
              <Input
                id="add-stage-name"
                type="text"
                required
                value={stageNama}
                onChange={(e) => setStageNama(e.target.value)}
                placeholder="Contoh: Dyno Test & Kalibrasi ECU"
                className="h-9 text-xs"
              />
            </div>
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <Checkbox
                  checked={stageWajibFoto}
                  onCheckedChange={(checked) =>
                    setStageWajibFoto(Boolean(checked))
                  }
                />
                <span>
                  Wajib Unggah Foto Sebelum Tahap Diselesaikan (FR-18)
                </span>
              </label>
            </div>
            <DialogFooter className="pt-3">
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Ubah Tahapan */}
      <Dialog
        open={Boolean(editStageItem)}
        onOpenChange={(open) => {
          if (!open) setEditStageItem(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Template Tahapan</DialogTitle>
            <DialogDescription className="text-xs">
              Perbarui nama tahapan atau aturan dokumentasi foto wajib.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateStage} className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-stage-name"
                className="text-xs font-semibold"
              >
                Nama Tahapan
              </Label>
              <Input
                id="edit-stage-name"
                type="text"
                required
                value={editStageNama}
                onChange={(e) => setEditStageNama(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <Checkbox
                  checked={editStageWajibFoto}
                  onCheckedChange={(checked) =>
                    setEditStageWajibFoto(Boolean(checked))
                  }
                />
                <span>
                  Wajib Unggah Foto Sebelum Tahap Diselesaikan (FR-18)
                </span>
              </label>
            </div>
            <DialogFooter className="pt-3">
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </StaffLayout>
  );
}
