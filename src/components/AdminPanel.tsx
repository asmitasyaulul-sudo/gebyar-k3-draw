import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  DISPLAY_MODES,
  PRESET_BACKGROUNDS,
  WINNERS_OPTIONS,
  hashPw,
  useApp,
  type Ornaments,
  type Participant,
} from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const {
    settings,
    setSettings,
    setOrnament,
    participants,
    setParticipants,
    addParticipant,
    updateParticipant,
    removeParticipant,
    winners,
    resetAllWinners,
    setAdmin,
  } = useApp();

  return (
    <div className="space-y-4">
      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="draw">Draw</TabsTrigger>
          <TabsTrigger value="visuals">Visuals</TabsTrigger>
          <TabsTrigger value="ornaments">Ornaments</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="mt-4">
          <ParticipantsTab
            participants={participants}
            setParticipants={setParticipants}
            addParticipant={addParticipant}
            updateParticipant={updateParticipant}
            removeParticipant={removeParticipant}
          />
        </TabsContent>

        <TabsContent value="draw" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Winners per round</Label>
              <Select
                value={String(settings.winnersPerRound)}
                onValueChange={(v) =>
                  setSettings({ winnersPerRound: Number(v) })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WINNERS_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Display mode</Label>
              <Select
                value={settings.displayMode}
                onValueChange={(v) => setSettings({ displayMode: v as any })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISPLAY_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Animation speed preset</Label>
              <Select
                value={settings.animSpeed}
                onValueChange={(v) => setSettings({ animSpeed: v as any })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Slow</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="fast">Fast</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground">
                  Speed multiplier ({settings.animSpeedMultiplier.toFixed(2)}×)
                </Label>
                <Slider
                  className="mt-2"
                  value={[settings.animSpeedMultiplier * 100]}
                  min={50}
                  max={200}
                  step={5}
                  onValueChange={(v) =>
                    setSettings({ animSpeedMultiplier: v[0] / 100 })
                  }
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Switch
                  checked={settings.reducedMotion}
                  onCheckedChange={(v) => setSettings({ reducedMotion: v })}
                />
                <span className="text-sm text-muted-foreground">
                  Reduced motion (limits confetti, flashes, particles)
                </span>
              </div>
            </div>
            <div>
              <Label>Volume ({Math.round(settings.volume * 100)}%)</Label>
              <Slider
                className="mt-3"
                value={[settings.volume * 100]}
                max={100}
                onValueChange={(v) => setSettings({ volume: v[0] / 100 })}
              />
              <div className="mt-3 flex items-center gap-2">
                <Switch
                  checked={settings.muted}
                  onCheckedChange={(v) => setSettings({ muted: v })}
                />
                <span className="text-sm text-muted-foreground">Mute all sound</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-2 font-display text-sm">Danger zone</div>
            <div className="flex flex-wrap gap-2">
              <ConfirmAction
                title="Reset all winners?"
                desc="Returns every participant back into the available pool. History will be cleared."
                onConfirm={() => {
                  resetAllWinners();
                  toast.success("All winners reset.");
                }}
              >
                <Button variant="destructive">Reset all winners</Button>
              </ConfirmAction>
              <div className="text-xs text-muted-foreground self-center">
                {winners.length} draw round(s) recorded
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="visuals" className="mt-4">
          <VisualsTab />
        </TabsContent>

        <TabsContent value="ornaments" className="mt-4 space-y-2">
          {(
            [
              ["gears", "Rotating industrial gears"],
              ["helmets", "Floating glossy safety helmets"],
              ["hazard", "Hazard black-yellow stripes"],
              ["cones", "Traffic cones"],
              ["apar", "APAR (fire extinguisher) icons"],
              ["sparkles", "Sparkles"],
              ["particles", "Light particles"],
              ["stageLights", "Flashing stage lights"],
              ["confetti", "Confetti effects"],
            ] as [keyof Ornaments, string][]
          ).map(([key, label]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <span className="text-sm">{label}</span>
              <Switch
                checked={settings.ornaments[key]}
                onCheckedChange={(v) => setOrnament(key, v)}
              />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="account" className="mt-4 space-y-4">
          <ChangePassword />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setAdmin(false);
              onClose();
              toast.success("Logged out.");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConfirmAction({
  title,
  desc,
  onConfirm,
  children,
}: {
  title: string;
  desc: string;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{desc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* --------------------- Participants Tab --------------------- */

function ParticipantsTab({
  participants,
  setParticipants,
  addParticipant,
  updateParticipant,
  removeParticipant,
}: {
  participants: Participant[];
  setParticipants: (p: Participant[]) => void;
  addParticipant: (p: Participant) => void;
  updateParticipant: (id: string, patch: Partial<Participant>) => void;
  removeParticipant: (id: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Participant | null>(null);

  const handleFile = async (f: File) => {
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
    const list: Participant[] = rows
      .map((r, i) => {
        const number = String(
          r.Number ?? r.number ?? r.No ?? r.no ?? i + 1,
        ).trim();
        const name = String(r.Name ?? r.name ?? "").trim();
        const department = String(r.Department ?? r.department ?? "").trim();
        const photoUrl = String(r.PhotoURL ?? r.photoUrl ?? r.photo ?? "").trim();
        return {
          id: crypto.randomUUID(),
          number,
          name,
          department,
          photoUrl: photoUrl || undefined,
        };
      })
      .filter((p) => p.name);
    setParticipants(list);
    toast.success(`Imported ${list.length} participants.`);
  };

  const handlePhotoUpload = async (id: string, f: File) => {
    const reader = new FileReader();
    reader.onload = () => updateParticipant(id, { photoUrl: reader.result as string });
    reader.readAsDataURL(f);
  };

  const filtered = participants.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.number.toLowerCase().includes(q.toLowerCase()) ||
      p.department.toLowerCase().includes(q.toLowerCase()),
  );
  filtered.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".xlsx,.csv"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button onClick={() => fileRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" /> Import Excel/CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setEditing({
              id: crypto.randomUUID(),
              number: String(participants.length + 1).padStart(3, "0"),
              name: "",
              department: "",
            });
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add manually
        </Button>
        <Input
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="ml-auto max-w-xs"
        />
      </div>

      <div className="max-h-[55vh] overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-secondary text-left">
            <tr>
              <th className="p-2">#</th>
              <th className="p-2">Name</th>
              <th className="p-2">Department</th>
              <th className="p-2">Photo</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2 font-display">{p.number}</td>
                <td className="p-2">{p.name}</td>
                <td className="p-2 text-muted-foreground">{p.department}</td>
                <td className="p-2">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files?.[0] && handlePhotoUpload(p.id, e.target.files[0])
                      }
                    />
                    {p.photoUrl ? (
                      <img src={p.photoUrl} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-xs text-primary underline">change</span>
                  </label>
                </td>
                <td className="p-2 text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <ConfirmAction
                    title="Delete participant?"
                    desc={`Remove ${p.name} (${p.number}) from the list?`}
                    onConfirm={() => removeParticipant(p.id)}
                  >
                    <Button size="icon" variant="ghost">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </ConfirmAction>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No participants. Import an Excel/CSV with columns: Number, Name,
                  Department, PhotoURL.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditParticipant
          value={editing}
          onClose={() => setEditing(null)}
          onSave={(p) => {
            if (participants.some((x) => x.id === p.id)) updateParticipant(p.id, p);
            else addParticipant(p);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditParticipant({
  value,
  onSave,
  onClose,
}: {
  value: Participant;
  onSave: (p: Participant) => void;
  onClose: () => void;
}) {
  const [p, setP] = useState(value);
  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Participant</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Number</Label>
            <Input value={p.number} onChange={(e) => setP({ ...p, number: e.target.value })} />
          </div>
          <div>
            <Label>Name</Label>
            <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
          </div>
          <div>
            <Label>Department</Label>
            <Input
              value={p.department}
              onChange={(e) => setP({ ...p, department: e.target.value })}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => p.name && onSave(p)}>Save</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* --------------------- Visuals Tab --------------------- */

function VisualsTab() {
  const { settings, setSettings } = useApp();
  const bgRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const eventRef = useRef<HTMLInputElement>(null);

  const upload = (
    f: File,
    cb: (data: string) => void,
  ) => {
    const r = new FileReader();
    r.onload = () => cb(r.result as string);
    r.readAsDataURL(f);
  };

  return (
    <div className="space-y-5">
      <div>
        <Label className="mb-2 block">Background preset</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PRESET_BACKGROUNDS.map((b, i) => (
            <button
              key={b.name}
              onClick={() => setSettings({ bgIndex: i, bgCustom: undefined })}
              className={`relative h-20 overflow-hidden rounded-lg border-2 transition ${
                settings.bgIndex === i && !settings.bgCustom
                  ? "border-safety-yellow glow-gold"
                  : "border-border hover:border-primary"
              }`}
              style={{ background: b.css }}
            >
              <span className="absolute bottom-1 left-2 text-xs font-bold text-white drop-shadow">
                {b.name}
              </span>
            </button>
          ))}
          <button
            onClick={() => bgRef.current?.click()}
            className={`relative flex h-20 items-center justify-center rounded-lg border-2 border-dashed transition ${
              settings.bgCustom ? "border-safety-yellow glow-gold" : "border-border"
            }`}
            style={
              settings.bgCustom
                ? { backgroundImage: `url(${settings.bgCustom})`, backgroundSize: "cover" }
                : undefined
            }
          >
            <span className="text-xs">Custom upload</span>
          </button>
          <input
            ref={bgRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] &&
              upload(e.target.files[0], (d) =>
                setSettings({ bgCustom: d, bgIndex: -1 }),
              )
            }
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Brightness ({settings.bgBrightness.toFixed(2)})</Label>
          <Slider
            className="mt-2"
            min={20}
            max={120}
            value={[settings.bgBrightness * 100]}
            onValueChange={(v) => setSettings({ bgBrightness: v[0] / 100 })}
          />
        </div>
        <div>
          <Label>Blur ({settings.bgBlur}px)</Label>
          <Slider
            className="mt-2"
            max={20}
            value={[settings.bgBlur]}
            onValueChange={(v) => setSettings({ bgBlur: v[0] })}
          />
        </div>
        <div>
          <Label>Overlay ({Math.round(settings.overlayOpacity * 100)}%)</Label>
          <Slider
            className="mt-2"
            max={85}
            value={[settings.overlayOpacity * 100]}
            onValueChange={(v) => setSettings({ overlayOpacity: v[0] / 100 })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LogoBlock
          label="Company logo"
          value={settings.companyLogo}
          inputRef={companyRef}
          onUpload={(d) => setSettings({ companyLogo: d })}
          onClear={() => setSettings({ companyLogo: undefined })}
        />
        <LogoBlock
          label="Event logo"
          value={settings.eventLogo}
          inputRef={eventRef}
          onUpload={(d) => setSettings({ eventLogo: d })}
          onClear={() => setSettings({ eventLogo: undefined })}
        />
      </div>
      <div>
        <Label>Logo size</Label>
        <Select
          value={settings.logoSize}
          onValueChange={(v) => setSettings({ logoSize: v as any })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="xl">Extra Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={settings.dark}
          onCheckedChange={(v) => setSettings({ dark: v })}
        />
        <span className="text-sm">Dark mode</span>
      </div>
    </div>
  );
}

function LogoBlock({
  label,
  value,
  inputRef,
  onUpload,
  onClear,
}: {
  label: string;
  value?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (d: string) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border bg-secondary">
          {value ? (
            <img src={value} className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => onUpload(r.result as string);
            r.readAsDataURL(f);
          }}
        />
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Upload
        </Button>
        {value && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

/* --------------------- Change password --------------------- */

function ChangePassword() {
  const { settings, setSettings } = useApp();
  const [cur, setCur] = useState("");
  const [n1, setN1] = useState("");
  const [n2, setN2] = useState("");
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="font-display text-sm">Change admin password</div>
      <Input
        type="password"
        placeholder="Current password"
        value={cur}
        onChange={(e) => setCur(e.target.value)}
      />
      <Input
        type="password"
        placeholder="New password"
        value={n1}
        onChange={(e) => setN1(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Confirm new password"
        value={n2}
        onChange={(e) => setN2(e.target.value)}
      />
      <Button
        onClick={() => {
          if (hashPw(cur) !== settings.adminPasswordHash)
            return toast.error("Current password is wrong.");
          if (n1.length < 4) return toast.error("Password too short.");
          if (n1 !== n2) return toast.error("Passwords don't match.");
          setSettings({ adminPasswordHash: hashPw(n1) });
          setCur("");
          setN1("");
          setN2("");
          toast.success("Password updated.");
        }}
      >
        Update password
      </Button>
    </div>
  );
}

/* --------------------- Export helpers --------------------- */

export function exportWinners(
  winners: ReturnType<typeof useApp.getState>["winners"],
  fmt: "xlsx" | "csv",
) {
  const rows = winners.flatMap((w) =>
    w.participants.map((p) => ({
      "Draw Round": w.round,
      Number: p.number,
      Name: p.name,
      Department: p.department,
    })),
  );
  if (!rows.length) {
    toast.error("No winners to export.");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Winners");
  const name = `winners-${Date.now()}.${fmt}`;
  XLSX.writeFile(wb, name, { bookType: fmt });
  toast.success(`Exported ${name}`);
}
