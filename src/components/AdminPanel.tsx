import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  DISPLAY_MODES,
  DRAW_STYLES,
  PRESET_BACKGROUNDS,
  WINNERS_OPTIONS,
  hashPw,
  useApp,
  type Ornaments,
  type Participant,
} from "@/lib/store";
import { defaultTexts, type TextsMap, type LangMode } from "@/lib/texts";
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
  Music,
  Pencil,
  Plus,
  Sparkles as SparklesIcon,
  Trash2,
  Upload,
  X,
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
    clearParticipants,
    winners,
    resetAllWinners,
    setAdmin,
  } = useApp();

  return (
    <div className="space-y-4">
      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="draw">Draw</TabsTrigger>
          <TabsTrigger value="visuals">Visuals</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="texts">Texts</TabsTrigger>
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
            clearParticipants={clearParticipants}
          />
        </TabsContent>

        <TabsContent value="draw" className="mt-4 space-y-4">
          <div>
            <Label className="mb-2 block">Draw animation style</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {DRAW_STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSettings({ drawStyle: s.value })}
                  className={`rounded-lg border-2 p-3 text-left transition ${
                    settings.drawStyle === s.value
                      ? "border-safety-yellow glow-gold bg-secondary"
                      : "border-border hover:border-primary"
                  }`}
                >
                  <div className="font-display text-sm">{s.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
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
                  Speed multiplier ({(settings.animSpeedMultiplier ?? 1).toFixed(2)}×)
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
                  Reduced motion — press M on the main screen to toggle (limits confetti, flashes, particles)
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

        <TabsContent value="media" className="mt-4">
          <MediaTab />
        </TabsContent>

        <TabsContent value="texts" className="mt-4">
          <TextsTab />
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
  clearParticipants,
}: {
  participants: Participant[];
  setParticipants: (p: Participant[]) => void;
  addParticipant: (p: Participant) => void;
  updateParticipant: (id: string, patch: Partial<Participant>) => void;
  removeParticipant: (id: string) => void;
  clearParticipants: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Participant | null>(null);
  const [bulkN, setBulkN] = useState("");
  const [bulkStart, setBulkStart] = useState("1");
  const [bulkPad, setBulkPad] = useState("3");

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
      .filter((p) => p.name || p.number);
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
      (p.name || "").toLowerCase().includes(q.toLowerCase()) ||
      p.number.toLowerCase().includes(q.toLowerCase()) ||
      (p.department || "").toLowerCase().includes(q.toLowerCase()),
  );
  filtered.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));

  const handleBulkGenerate = () => {
    const n = Math.max(0, Math.min(10000, parseInt(bulkN, 10) || 0));
    if (!n) return toast.error("Enter how many numbers to generate.");
    const start = parseInt(bulkStart, 10) || 1;
    const pad = Math.max(0, Math.min(8, parseInt(bulkPad, 10) || 0));
    const list: Participant[] = Array.from({ length: n }, (_, i) => ({
      id: crypto.randomUUID(),
      number: pad > 0 ? String(start + i).padStart(pad, "0") : String(start + i),
      name: "",
      department: "",
    }));
    setParticipants(list);
    setBulkN("");
    toast.success(`Generated ${n} numbered tickets.`);
  };

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
        {participants.length > 0 && (
          <ConfirmAction
            title="Delete all participants?"
            desc={`This will permanently remove all ${participants.length} participants. This action cannot be undone.`}
            onConfirm={() => {
              clearParticipants();
              toast.success("All participants deleted.");
            }}
          >
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete all
            </Button>
          </ConfirmAction>
        )}
        <Input
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="ml-auto max-w-xs"
        />
      </div>

      {/* Bulk generate number-only tickets */}
      <div className="rounded-lg border bg-secondary/40 p-3">
        <div className="mb-2 font-display text-xs uppercase tracking-widest text-muted-foreground">
          Quick generate numbered tickets
        </div>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleBulkGenerate();
          }}
        >
          <div>
            <Label className="text-xs">How many</Label>
            <Input
              type="number"
              min={1}
              max={10000}
              inputMode="numeric"
              placeholder="e.g. 200"
              value={bulkN}
              onChange={(e) => setBulkN(e.target.value)}
              className="mt-1 w-32"
            />
          </div>
          <div>
            <Label className="text-xs">Start at</Label>
            <Input
              type="number"
              value={bulkStart}
              onChange={(e) => setBulkStart(e.target.value)}
              className="mt-1 w-24"
            />
          </div>
          <div>
            <Label className="text-xs">Pad zeros</Label>
            <Input
              type="number"
              min={0}
              max={8}
              value={bulkPad}
              onChange={(e) => setBulkPad(e.target.value)}
              className="mt-1 w-20"
            />
          </div>
          <Button type="submit" className="h-9">
            Generate (replaces list)
          </Button>
          <span className="text-xs text-muted-foreground">
            Enter a count and press Enter — creates that many numbered tickets, no names needed.
          </span>
        </form>
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
                <td className="p-2">{p.name || <span className="text-muted-foreground/60">—</span>}</td>
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
          <AlertDialogAction onClick={() => (p.number || p.name) && onSave(p)}>Save</AlertDialogAction>
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

/* --------------------- Media Tab (music + custom flying icons) --------------------- */

function MediaTab() {
  const { settings, setSettings, addCustomIcon, removeCustomIcon, updateCustomIcon } = useApp();
  const musicRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);

  const handleMusic = async (f: File) => {
    try {
      const { saveMusic } = await import("@/lib/musicStore");
      const { url, name } = await saveMusic(f);
      setSettings({ customMusic: url, customMusicName: name });
      toast.success(`Music tersimpan: ${name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan musik.");
    }
  };

  const handleIcon = (files: FileList) => {
    Array.from(files).forEach((f, i) => {
      const r = new FileReader();
      r.onload = () => {
        addCustomIcon({
          id: crypto.randomUUID(),
          url: r.result as string,
          x: 20 + ((i * 17) % 60),
          y: 30 + ((i * 23) % 40),
          size: 96,
          float: true,
        });
      };
      r.readAsDataURL(f);
    });
    toast.success(`Added ${files.length} icon(s). Drag them on the main screen.`);
  };

  return (
    <div className="space-y-6">
      {/* Music */}
      <div className="rounded-lg border p-4">
        <div className="mb-2 flex items-center gap-2 font-display text-sm">
          <Music className="h-4 w-4" /> Custom draw music
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Upload an MP3/WAV/OGG file. It will replace the built-in spin sound during a draw, and fades out when the winner is revealed.
        </p>
        <input
          ref={musicRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleMusic(e.target.files[0])}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => musicRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Upload music
          </Button>
          {settings.customMusic && (
            <>
              <audio src={settings.customMusic} controls className="h-9 max-w-xs" />
              <span className="text-xs text-muted-foreground">
                {settings.customMusicName || "uploaded.mp3"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const { clearMusic } = await import("@/lib/musicStore");
                  await clearMusic();
                  setSettings({ customMusic: undefined, customMusicName: undefined });
                }}
              >
                <X className="mr-1 h-3 w-3" /> Remove
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Custom flying icons */}
      <div className="rounded-lg border p-4">
        <div className="mb-2 flex items-center gap-2 font-display text-sm">
          <SparklesIcon className="h-4 w-4" /> Custom flying icons
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Upload PNG/SVG/JPG images to float on the stage. While logged in, drag them on the main screen to reposition. Use the floating toolbar on each icon to resize, toggle motion, or remove.
        </p>
        <input
          ref={iconRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleIcon(e.target.files)}
        />
        <Button onClick={() => iconRef.current?.click()}>
          <Plus className="mr-2 h-4 w-4" /> Upload icons
        </Button>

        {!!settings.customIcons.length && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {settings.customIcons.map((ic) => (
              <div
                key={ic.id}
                className="relative flex flex-col items-center gap-2 rounded-lg border bg-secondary/40 p-2"
              >
                <img src={ic.url} className="h-16 w-16 object-contain" alt="" />
                <div className="w-full">
                  <Label className="text-[10px] text-muted-foreground">
                    Size {ic.size}px
                  </Label>
                  <Slider
                    className="mt-1"
                    min={32}
                    max={240}
                    value={[ic.size]}
                    onValueChange={(v) => updateCustomIcon(ic.id, { size: v[0] })}
                  />
                </div>
                <div className="flex w-full items-center justify-between text-xs">
                  <label className="flex items-center gap-1">
                    <Switch
                      checked={ic.float}
                      onCheckedChange={(v) => updateCustomIcon(ic.id, { float: v })}
                    />
                    Float
                  </label>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeCustomIcon(ic.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


/* --------------------- Texts Tab (bilingual editor) --------------------- */

const TEXT_LABELS: Record<keyof TextsMap, string> = {
  safetyFirst: "Top tagline (above brand)",
  brand: "Brand line",
  gebyar: "Small 'GEBYAR' line",
  titleMain: "Main title (e.g. BULAN K3)",
  titleHighlight: "Highlighted title (e.g. NASIONAL)",
  subtitle: "Subtitle (SAFETY LUCKY DRAW)",
  statTotal: "Stat — Total Participants",
  statRemaining: "Stat — Remaining",
  statWinners: "Stat — Total Winners",
  statRound: "Stat — Current Round",
  winnersPerSpin: "Control — Winners / spin",
  displayLabel: "Control — Display",
  startDraw: "Button — Start draw",
  nextDraw: "Button — Next draw",
  drawing: "Button — Drawing in progress",
  resetRound: "Button — Reset round",
  roundWinners: "Heading — Round {round} winners",
  celebrate: "Popup — Congratulations banner",
  wheelWinner: "Wheel — WINNER label",
  wheelSpinning: "Wheel — SPINNING label",
  wheelReady: "Wheel — READY label",
};

function TextsTab() {
  const { settings, setSettings } = useApp();
  const language: LangMode = (settings.language ?? "id") as LangMode;
  const texts = settings.texts ?? {};

  const update = (key: keyof TextsMap, lang: "id" | "zh", value: string) => {
    setSettings({
      texts: {
        ...texts,
        [key]: { ...(texts[key] ?? {}), [lang]: value },
      },
    });
  };

  const resetKey = (key: keyof TextsMap) => {
    const next = { ...texts };
    delete next[key];
    setSettings({ texts: next });
  };

  const keys = Object.keys(defaultTexts) as (keyof TextsMap)[];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-secondary/40 p-3">
        <Label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
          Language mode
        </Label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { v: "id", label: "Indonesian only" },
              { v: "zh", label: "中文 only" },
              { v: "both", label: "Both (ID + 中文)" },
            ] as { v: LangMode; label: string }[]
          ).map((opt) => (
            <Button
              key={opt.v}
              size="sm"
              variant={language === opt.v ? "default" : "secondary"}
              onClick={() => setSettings({ language: opt.v })}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          "Both" shows Indonesian on top and Mandarin underneath everywhere.
        </p>
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-[1fr,1fr,auto] gap-2 border-b bg-secondary/60 px-3 py-2 text-[11px] font-display uppercase tracking-widest text-muted-foreground">
          <div>Indonesian</div>
          <div>中文 (Mandarin)</div>
          <div className="text-right">Reset</div>
        </div>
        <div className="max-h-[55vh] overflow-auto divide-y">
          {keys.map((k) => {
            const def = defaultTexts[k];
            const cur = texts[k] ?? {};
            const idVal = cur.id ?? def.id;
            const zhVal = cur.zh ?? def.zh;
            return (
              <div key={k} className="px-3 py-2">
                <div className="mb-1 text-[11px] font-medium text-muted-foreground">
                  {TEXT_LABELS[k]}
                </div>
                <div className="grid grid-cols-[1fr,1fr,auto] gap-2">
                  <Input
                    value={idVal}
                    onChange={(e) => update(k, "id", e.target.value)}
                  />
                  <Input
                    value={zhVal}
                    onChange={(e) => update(k, "zh", e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resetKey(k)}
                    title="Reset to default"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Use <code>{"{round}"}</code> as a placeholder where it already appears (e.g. round winners heading).
      </p>
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
